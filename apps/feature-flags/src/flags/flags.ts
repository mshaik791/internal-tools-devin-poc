import type { Session } from "@internal/core/auth";
import { audit } from "@internal/core/audit";
import { TransitionError } from "@internal/core/state-machine";
import type { Flag, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { can } from "@/permissions";
import { FLAG_ENVS, FLAG_STATES, flagMachines, toggleResource, type FlagEnv, type FlagState } from "./machine";

export const ENTITY = "Flag";

export type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: string };
const fail = (status: number, error: string) => ({ ok: false, status, error }) as const;

export interface FlagFilters {
  state?: string;
  q?: string;
  sort?: "key" | "updated";
}

export async function listFlags(session: Session, filters: FlagFilters = {}) {
  if (!can(session, "flag", "read")) return [];
  const where: Prisma.FlagWhereInput[] = [];
  if (filters.state && (FLAG_STATES as readonly string[]).includes(filters.state)) {
    where.push({ state: filters.state as FlagState });
  }
  if (filters.q) where.push({ key: { contains: filters.q, mode: "insensitive" } });
  return prisma.flag.findMany({
    where: { AND: where },
    orderBy: filters.sort === "updated" ? [{ updatedAt: "desc" }, { key: "asc" }] : [{ key: "asc" }],
  });
}

export function groupByEnv<T extends { env: FlagEnv }>(flags: T[]): Record<FlagEnv, T[]> {
  const groups = Object.fromEntries(FLAG_ENVS.map((e) => [e, [] as T[]])) as Record<FlagEnv, T[]>;
  for (const f of flags) groups[f.env].push(f);
  return groups;
}

export async function getFlag(session: Session, id: string) {
  if (!can(session, "flag", "read")) return null;
  return prisma.flag.findUnique({ where: { id } });
}

export async function listAudit(session: Session, flagId: string) {
  if (!can(session, "audit", "read")) return null;
  const flag = await getFlag(session, flagId);
  if (!flag) return null;
  return prisma.auditLog.findMany({
    where: { entity: ENTITY, entityId: flagId },
    orderBy: [{ ts: "desc" }, { id: "desc" }],
  });
}

/** Integer 1-99, or null. 0 and 100 are expressed as off / on. */
export function parsePercentage(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : Number.NaN;
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
}

const TRANSITION_STATUS: Record<TransitionError["code"], number> = {
  UNDECLARED: 409,
  FORBIDDEN: 403,
  REASON_REQUIRED: 400,
};

export async function transitionFlag(
  session: Session,
  input: { id: string; to: string; reason: unknown; percentage?: unknown; requestId: string },
): Promise<Result<Flag>> {
  const flag = await getFlag(session, input.id);
  if (!flag) return fail(404, "not found");
  if (!can(session, toggleResource(flag.env), "toggle")) return fail(403, `forbidden: ${flag.env} toggles`);

  let move;
  try {
    move = flagMachines[flag.env].transition({
      from: flag.state,
      to: input.to,
      role: session.role,
      reason: typeof input.reason === "string" ? input.reason : null,
    });
  } catch (e) {
    if (e instanceof TransitionError) return fail(TRANSITION_STATUS[e.code], e.message);
    throw e;
  }

  let percentage: number | null = null;
  if (move.to === "percentage") {
    percentage = parsePercentage(input.percentage);
    if (percentage === null) return fail(400, "percentage must be an integer from 1 to 99");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.flag.updateMany({
      where: { id: flag.id, state: move.from },
      data: { state: move.to, percentage },
    });
    if (count !== 1) return null;
    await audit(
      {
        actor: session.sub,
        action: "flag.transition",
        entity: ENTITY,
        entityId: flag.id,
        before: { state: move.from, percentage: flag.percentage },
        after: { state: move.to, percentage },
        reason: move.reason,
        requestId: input.requestId,
      },
      tx,
    );
    return tx.flag.findUniqueOrThrow({ where: { id: flag.id } });
  });
  return updated ? { ok: true, value: updated } : fail(409, "flag changed, reload and retry");
}
