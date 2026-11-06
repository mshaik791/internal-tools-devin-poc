import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./auth/session-token";

/**
 * Default-deny auth gate: every path except `publicPaths` needs a valid session.
 * Pages redirect to /login; /api/* gets 401. Also stamps a fresh x-request-id.
 */
export function createAuthMiddleware({ publicPaths = ["/login"] }: { publicPaths?: string[] } = {}) {
  return async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const requestId = crypto.randomUUID();
    const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (!isPublic) {
      const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
      if (!session) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.search = `?next=${encodeURIComponent(pathname + search)}`;
        return NextResponse.redirect(url);
      }
    }

    const headers = new Headers(req.headers);
    headers.set("x-request-id", requestId);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("x-request-id", requestId);
    return res;
  };
}
