import { listAudit } from "@/flags/flags";
import { requirePermission } from "@/permissions";

/** GET /api/audit?flagId= — audit rows for one flag, newest first. */
export async function GET(req: Request) {
  const guard = await requirePermission("audit", "read");
  if (!guard.ok) return guard.response;
  const flagId = new URL(req.url).searchParams.get("flagId");
  if (!flagId) return Response.json({ error: "flagId is required" }, { status: 400 });
  const rows = await listAudit(guard.session, flagId);
  if (!rows) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(rows);
}
