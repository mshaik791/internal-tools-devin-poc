import { getSession } from "@internal/core/auth/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/permissions";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session, "home", "read")) return <p>403 — you do not have access to this page.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected page</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        Signed in as <b>{session.name}</b> ({session.role}), regions: {session.regions.join(", ")}.
      </CardContent>
    </Card>
  );
}
