import { getRequestId } from "@internal/core/auth/server";
import { transitionFlag } from "@/flags/flags";
import { requirePermission } from "@/permissions";

/** POST { to, reason, percentage? }. The env-specific toggle permission is checked in transitionFlag. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("flag", "read");
  if (!guard.ok) return guard.response;
  const body = (await req.json().catch(() => ({}))) as { to?: unknown; reason?: unknown; percentage?: unknown };
  const result = await transitionFlag(guard.session, {
    id: (await params).id,
    to: typeof body.to === "string" ? body.to : "",
    reason: body.reason,
    percentage: body.percentage,
    requestId: await getRequestId(),
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.value);
}
