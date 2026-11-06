import { getCase } from "@/kyc/cases";
import { requirePermission } from "@/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("case", "read");
  if (!guard.ok) return guard.response;
  const kase = await getCase(guard.session, (await params).id);
  if (!kase) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(kase);
}
