import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authAdapter } from "@/auth";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const users = await authAdapter().listUsers();
  return (
    <Card className="mx-auto mt-16 max-w-md">
      <CardHeader>
        <CardTitle>Sign in (mock OIDC)</CardTitle>
        <p className="text-sm text-muted-foreground">Dev only. Pick a seeded user.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {users.map((u) => (
          <form key={u.sub} action={login}>
            <input type="hidden" name="sub" value={u.sub} />
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="outline" className="w-full justify-between">
              <span>{u.name}</span>
              <span className="text-xs text-muted-foreground">
                {u.role} · {u.regions.join(", ")}
              </span>
            </Button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
