import { ALL_REGIONS, type AuthAdapter, type User } from "./types";

export const MOCK_USERS: readonly User[] = [
  { sub: "analyst", name: "Ana Analyst", email: "analyst@example.test", role: "analyst", regions: ["US-WEST"] },
  { sub: "senior", name: "Sam Senior", email: "senior@example.test", role: "senior_reviewer", regions: [ALL_REGIONS] },
  { sub: "admin", name: "Ada Admin", email: "admin@example.test", role: "admin", regions: [ALL_REGIONS] },
];

export const mockOidcAdapter: AuthAdapter = {
  id: "mock",
  async listUsers() {
    return MOCK_USERS.map((u) => ({ ...u, regions: [...u.regions] }));
  },
  async getUser(sub) {
    const u = MOCK_USERS.find((m) => m.sub === sub);
    return u ? { ...u, regions: [...u.regions] } : null;
  },
};
