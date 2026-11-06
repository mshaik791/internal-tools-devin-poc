import { getSession } from "@internal/core/auth/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "./login/actions";
import "./globals.css";

export const metadata: Metadata = { title: "Internal tool" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="flex items-center justify-between border-b bg-background px-6 py-3">
          <Link href="/" className="font-semibold">
            Internal tool
          </Link>
          {session && (
            <form action={logout} className="flex items-center gap-3 text-sm">
              <span data-testid="current-user">
                {session.name} <span className="text-muted-foreground">({session.role})</span>
              </span>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          )}
        </header>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
