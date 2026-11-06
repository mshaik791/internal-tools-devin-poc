import { ALL_REGIONS, type AuthAdapter, type User } from "./types";

/** Default dev users (kyc-queue and the template rely on these). */
export const MOCK_USERS: readonly User[] = [
  { sub: "analyst", name: "Ana Analyst", email: "analyst@example.test", role: "analyst", regions: ["US-WEST"] },
  { sub: "senior", name: "Sam Senior", email: "senior@example.test", role: "senior_reviewer", regions: [ALL_REGIONS] },
  { sub: "admin", name: "Ada Admin", email: "admin@example.test", role: "admin", regions: [ALL_REGIONS] },
];

export interface MockAuthOptions {
  /** Users this app can sign in as. Defaults to MOCK_USERS. */
  users?: readonly User[];
}

const copy = (u: User): User => ({ ...u, regions: [...u.regions] });

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") throw new Error("mock auth is not allowed in production");
}

/** Dev-only mock OIDC adapter over an app-supplied user list. Refuses to resolve users in production. */
export function createMockAuth({ users = MOCK_USERS }: MockAuthOptions = {}): AuthAdapter {
  const list = users.map(copy);
  const subs = new Set<string>();
  for (const u of list) {
    if (!u.sub) throw new Error("createMockAuth: user without sub");
    if (subs.has(u.sub)) throw new Error(`createMockAuth: duplicate sub ${u.sub}`);
    subs.add(u.sub);
  }
  return {
    id: "mock",
    async listUsers() {
      assertNotProduction();
      return list.map(copy);
    },
    async getUser(sub) {
      assertNotProduction();
      const u = list.find((m) => m.sub === sub);
      return u ? copy(u) : null;
    },
  };
}

export const mockOidcAdapter: AuthAdapter = createMockAuth();
