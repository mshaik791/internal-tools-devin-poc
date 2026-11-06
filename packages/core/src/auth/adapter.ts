import { mockOidcAdapter } from "./mock-oidc";
import type { AuthAdapter } from "./types";

/** Selected by AUTH_PROVIDER. Only the dev mock exists today; it refuses to run in production. */
export function getAuthAdapter(): AuthAdapter {
  const provider = process.env.AUTH_PROVIDER;
  if (provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_PROVIDER=mock is not allowed in production");
    }
    return mockOidcAdapter;
  }
  throw new Error(`Unsupported AUTH_PROVIDER: ${provider ?? "(unset)"}`);
}
