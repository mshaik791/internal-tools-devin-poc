import { describe, expect, it } from "vitest";
import { can, permissions } from "@/permissions";

const ROLES = ["engineer", "admin", "viewer", "analyst", "senior_reviewer"];
const RESOURCES = ["flag", "flag_staging", "flag_prod", "audit"];
const ACTIONS = ["read", "toggle", "delete"];

// Full matrix from specs/feature-flags.md. Everything else is denied.
const ALLOWED = new Set([
  "engineer:flag:read",
  "engineer:flag_staging:toggle",
  "engineer:audit:read",
  "admin:flag:read",
  "admin:flag_staging:toggle",
  "admin:flag_prod:toggle",
  "admin:audit:read",
  "viewer:flag:read",
  "viewer:audit:read",
]);

describe("feature-flags permissions matrix", () => {
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
