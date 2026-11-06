import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getAuthAdapter } from "./adapter";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./session-token";
import type { Session } from "./types";

/** Current user from the signed session cookie, or null. For server components, route handlers and actions. */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Sets the session cookie for `sub`. Call from a server action or route handler. */
export async function signIn(sub: string): Promise<Session> {
  const user = await getAuthAdapter().getUser(sub);
  if (!user) throw new Error("Unknown user");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return user;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Request id set by the core middleware (falls back to a fresh id). */
export async function getRequestId(): Promise<string> {
  const h = await headers();
  return h.get("x-request-id") ?? randomUUID();
}
