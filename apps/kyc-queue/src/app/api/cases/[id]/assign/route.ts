import { getRequestId } from "@internal/core/auth/server";
import { assignCase } from "@/kyc/cases";
import { requirePermission } from "@/permissions";

/** POST { assignedTo: sub | null, reason } */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("case", "assign");
  if (!guard.ok) return guard.response;
  const body = (await req.json().catch(() => ({}))) as { assignedTo?: unknown; reason?: unknown };
  const result = await assignCase(guard.session, {
    id: (await params).id,
    assignedTo: body.assignedTo,
    reason: body.reason,
    requestId: await getRequestId(),
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.value);
}
