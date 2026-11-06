import { describe, expect, it } from "vitest";
import { can, permissions } from "@/permissions";

const ROLES = ["analyst", "senior_reviewer", "admin", "viewer"];
const RESOURCES = ["case", "audit", "user"];
const ACTIONS = ["read", "transition", "assign", "delete"];

// Full matrix from specs/kyc-queue.md. Everything else is denied.
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

describe("kyc-queue permissions matrix", () => {
  const cells = ROLES.flatMap((r) => RESOURCES.flatMap((res) => ACTIONS.map((a) => [r, res, a] as const)));
  it.each(cells)("%s / %s / %s", (role, resource, action) => {
    expect(can({ role }, resource as never, action as never)).toBe(ALLOWED.has(`${role}:${resource}:${action}`));
  });

  it("declares exactly the expected grants", () => {
    const declared = Object.entries(permissions as Record<string, Record<string, readonly string[]>>).flatMap(
      ([role, res]) => Object.entries(res).flatMap(([r, actions]) => actions.map((a) => `${role}:${r}:${a}`)),
    );
    expect(new Set(declared)).toEqual(ALLOWED);
  });
});
