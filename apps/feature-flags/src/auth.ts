import { getAuthAdapter, type User } from "@internal/core/auth";

/** Mock OIDC users for this app (specs/feature-flags.md roles). Dev only. */
export const USERS: readonly User[] = [
  { sub: "engineer", name: "Eve Engineer", email: "engineer@example.test", role: "engineer", regions: ["*"] },
  { sub: "admin", name: "Ada Admin", email: "admin@example.test", role: "admin", regions: ["*"] },
  { sub: "viewer", name: "Vic Viewer", email: "viewer@example.test", role: "viewer", regions: ["*"] },
];

export const authAdapter = () => getAuthAdapter({ users: USERS });
