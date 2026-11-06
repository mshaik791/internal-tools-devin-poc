import { getRequestId } from "@internal/core/auth/server";
import { transitionCase } from "@/kyc/cases";
import { requirePermission } from "@/permissions";

/** POST { to, reason, escalationCategory? } — escalationCategory is required when to = "escalated". */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("case", "transition");
  if (!guard.ok) return guard.response;
  const body = (await req.json().catch(() => ({}))) as { to?: unknown; reason?: unknown; escalationCategory?: unknown };
  const result = await transitionCase(guard.session, {
    id: (await params).id,
    to: typeof body.to === "string" ? body.to : "",
    reason: body.reason,
    escalationCategory: body.escalationCategory,
    requestId: await getRequestId(),
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.value);
}
