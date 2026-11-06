import { listAudit } from "@/kyc/cases";
import { requirePermission } from "@/permissions";

/** GET /api/audit?caseId= — audit rows for one case, newest first. 404 if the case is out of scope. */
export async function GET(req: Request) {
  const guard = await requirePermission("audit", "read");
  if (!guard.ok) return guard.response;
  const caseId = new URL(req.url).searchParams.get("caseId");
  if (!caseId) return Response.json({ error: "caseId is required" }, { status: 400 });
  const rows = await listAudit(guard.session, caseId);
  if (!rows) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(rows);
}
