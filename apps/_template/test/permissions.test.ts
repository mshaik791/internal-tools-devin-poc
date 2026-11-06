import { describe, expect, it } from "vitest";
import { can, permissions } from "@/permissions";

const ROLES = ["analyst", "senior_reviewer", "admin", "unknown"];
const RESOURCES = ["home", "other"];
const ACTIONS = ["read", "write"];
const ALLOWED = new Set(["analyst:home:read", "senior_reviewer:home:read", "admin:home:read"]);

describe("template permissions matrix", () => {
  const cells = ROLES.flatMap((r) => RESOURCES.flatMap((res) => ACTIONS.map((a) => [r, res, a] as const)));
  it.each(cells)("%s / %s / %s", (role, resource, action) => {
    expect(can({ role }, resource as never, action as never)).toBe(ALLOWED.has(`${role}:${resource}:${action}`));
  });
  it("policy has no undeclared grants", () => {
    expect(Object.keys(permissions).sort()).toEqual(["admin", "analyst", "senior_reviewer"]);
  });
});
