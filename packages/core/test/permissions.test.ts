import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined) }),
  headers: async () => new Headers(),
}));

const { definePermissions, isAllowed } = await import("../src/permissions");
const { SESSION_COOKIE, signSession, MOCK_USERS } = await import("../src/auth");

const policy = {
  analyst: { case: ["read", "transition"], audit: ["read"] },
  senior_reviewer: { case: ["read", "transition"], audit: ["read"] },
  admin: { case: ["read", "assign"], audit: ["read"] },
} as const;
const { can, requirePermission } = definePermissions(policy);

// Every allowed (role, resource, action). Everything else must be denied.
const ALLOWED = new Set([
  "analyst:case:read",
  "analyst:case:transition",
  "analyst:audit:read",
  "senior_reviewer:case:read",
  "senior_reviewer:case:transition",
  "senior_reviewer:audit:read",
  "admin:case:read",
  "admin:case:assign",
  "admin:audit:read",
]);
const ROLES = ["analyst", "senior_reviewer", "admin", "viewer", "__proto__", "constructor"];
const RESOURCES = ["case", "audit", "user", "__proto__", "toString"];
const ACTIONS = ["read", "transition", "assign", "delete", "write", "*"];

describe("permissions matrix", () => {
  const cells = ROLES.flatMap((role) =>
    RESOURCES.flatMap((resource) => ACTIONS.map((action) => [role, resource, action] as const)),
  );

  it.each(cells)("%s / %s / %s", (role, resource, action) => {
    const expected = ALLOWED.has(`${role}:${resource}:${action}`);
    expect(can({ role }, resource as never, action as never)).toBe(expected);
  });

  it("covers every grant declared in the policy", () => {
    const declared = Object.entries(policy as Record<string, Record<string, readonly string[]>>).flatMap(
      ([role, resources]) =>
        Object.entries(resources).flatMap(([resource, actions]) => actions.map((a) => `${role}:${resource}:${a}`)),
    );
    expect(new Set(declared)).toEqual(ALLOWED);
  });

  it("denies a missing session", () => {
    expect(can(null, "case", "read")).toBe(false);
    expect(isAllowed(policy, undefined, "case", "read")).toBe(false);
  });
});

describe("requirePermission", () => {
  beforeEach(() => cookieStore.clear());

  it("401 without a session", async () => {
    const g = await requirePermission("case", "read");
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.response.status).toBe(401);
  });

  it("403 when the role lacks the action", async () => {
    cookieStore.set(SESSION_COOKIE, await signSession(MOCK_USERS[2]!)); // admin
    const g = await requirePermission("case", "transition");
    expect(g.ok).toBe(false);
    if (!g.ok) expect(g.response.status).toBe(403);
  });

  it("passes the session through when allowed", async () => {
    cookieStore.set(SESSION_COOKIE, await signSession(MOCK_USERS[0]!)); // analyst
    const g = await requirePermission("case", "transition");
    expect(g.ok && g.session.sub).toBe("analyst");
  });
});
