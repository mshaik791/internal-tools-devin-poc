import { createAuthMiddleware } from "@internal/core/middleware";

export const middleware = createAuthMiddleware({ publicPaths: ["/login"] });

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
