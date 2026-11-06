import { getAuthAdapter, hasRegion, type Session } from "@internal/core/auth";
import { audit } from "@internal/core/audit";
import { TransitionError } from "@internal/core/state-machine";
import type { KycCase, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { can } from "@/permissions";
import { KYC_STATUSES, kycMachine, OPEN_STATUSES, type KycStatus } from "./machine";
import { ESCALATION_CATEGORIES, parseEscalationCategory } from "./escalation";
import { caseScope } from "./regions";

export const ENTITY = "KycCase";

export type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string) => ({ ok: false, status, error }) as const;

export function isOverdue(c: Pick<KycCase, "status" | "slaDueAt">, now = new Date()): boolean {
  return OPEN_STATUSES.includes(c.status) && c.slaDueAt < now;
}

export interface CaseFilters {
  status?: string;
  region?: string;
  sort?: "asc" | "desc";
}

export async function listCases(session: Session, filters: CaseFilters = {}) {
  const where: Prisma.KycCaseWhereInput[] = [caseScope(session)];
  if (filters.status && (KYC_STATUSES as readonly string[]).includes(filters.status)) {
    where.push({ status: filters.status as KycStatus });
  }
  if (filters.region) where.push({ region: filters.region });
  return prisma.kycCase.findMany({
    where: { AND: where },
    orderBy: [{ slaDueAt: filters.sort === "desc" ? "desc" : "asc" }, { id: "asc" }],
  });
}

/** Region-scoped lookup. Out-of-scope cases are indistinguishable from missing ones (404). */
export async function getCase(session: Session, id: string) {
  return prisma.kycCase.findFirst({ where: { AND: [{ id }, caseScope(session)] } });
}

export async function listAudit(session: Session, caseId: string) {
  const kase = await getCase(session, caseId);
  if (!kase) return null;
  return prisma.auditLog.findMany({
    where: { entity: ENTITY, entityId: caseId },
    orderBy: [{ ts: "desc" }, { id: "desc" }],
  });
}

const TRANSITION_STATUS: Record<TransitionError["code"], number> = {
  UNDECLARED: 409,
  FORBIDDEN: 403,
  REASON_REQUIRED: 400,
};

export async function transitionCase(
  session: Session,
  input: { id: string; to: string; reason: unknown; escalationCategory?: unknown; requestId: string },
): Promise<Result<KycCase>> {
  if (!can(session, "case", "transition")) return fail(403, "forbidden");
  const kase = await getCase(session, input.id);
  if (!kase) return fail(404, "not found");

  let move;
  try {
    move = kycMachine.transition({
      from: kase.status,
      to: input.to,
      role: session.role,
      reason: typeof input.reason === "string" ? input.reason : null,
    });
  } catch (e) {
    if (e instanceof TransitionError) return fail(TRANSITION_STATUS[e.code], e.message);
    throw e;
  }

  const escalating = move.to === "escalated";
  const escalationCategory = escalating ? parseEscalationCategory(input.escalationCategory) : null;
  if (escalating && !escalationCategory) {
    return fail(400, `escalationCategory is required when escalating (${ESCALATION_CATEGORIES.join(" | ")})`);
  }
  if (!escalating && input.escalationCategory != null) {
    return fail(400, "escalationCategory is only valid when escalating");
  }
  const changes = escalating ? { status: move.to, escalationCategory } : { status: move.to };

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.kycCase.updateMany({
      where: { AND: [{ id: kase.id, status: move.from }, caseScope(session)] },
      data: changes,
    });
    if (count !== 1) return null;
    await audit(
      {
        actor: session.sub,
        action: "case.transition",
        entity: ENTITY,
        entityId: kase.id,
        before: { status: move.from },
        after: changes,
        reason: move.reason,
        requestId: input.requestId,
      },
      tx,
    );
    return { ...kase, ...changes };
  });
  return updated ? { ok: true, value: updated } : fail(409, "case changed, reload and retry");
}

/** Users who may be assigned a case: reviewers with access to its region. */
export async function assignableUsers(region: string) {
  const users = await getAuthAdapter().listUsers();
  return users.filter((u) => can(u, "case", "transition") && hasRegion(u, region));
}

export async function assignCase(
  session: Session,
  input: { id: string; assignedTo: unknown; reason: unknown; requestId: string },
): Promise<Result<KycCase>> {
  if (!can(session, "case", "assign")) return fail(403, "forbidden");
  const kase = await getCase(session, input.id);
  if (!kase) return fail(404, "not found");
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!reason) return fail(400, "A non-empty reason is required");
  const assignedTo = typeof input.assignedTo === "string" && input.assignedTo ? input.assignedTo : null;
  if (assignedTo && !(await assignableUsers(kase.region)).some((u) => u.sub === assignedTo)) {
    return fail(400, "user cannot be assigned to this case");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.kycCase.update({ where: { id: kase.id }, data: { assignedTo } });
    await audit(
      {
        actor: session.sub,
        action: "case.assign",
        entity: ENTITY,
        entityId: kase.id,
        before: { assignedTo: kase.assignedTo },
        after: { assignedTo },
        reason,
        requestId: input.requestId,
      },
      tx,
    );
    return row;
  });
  return { ok: true, value: updated };
}
