import { getFlag } from "@/flags/flags";
import { requirePermission } from "@/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePermission("flag", "read");
  if (!guard.ok) return guard.response;
  const flag = await getFlag(guard.session, (await params).id);
  if (!flag) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(flag);
}
