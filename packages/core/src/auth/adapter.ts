import { createMockAuth, type MockAuthOptions } from "./mock-oidc";
import type { AuthAdapter } from "./types";

/**
 * Selected by AUTH_PROVIDER. Only the dev mock exists today; it refuses to run in production.
 * Apps pass their own mock users with `getAuthAdapter({ users })`; omitted -> MOCK_USERS.
 */
export function getAuthAdapter(options: MockAuthOptions = {}): AuthAdapter {
  const provider = process.env.AUTH_PROVIDER;
  if (provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_PROVIDER=mock is not allowed in production");
    }
    return createMockAuth(options);
  }
  throw new Error(`Unsupported AUTH_PROVIDER: ${provider ?? "(unset)"}`);
}
