import { definePermissions } from "@internal/core/permissions";

// role -> resource -> actions (specs/feature-flags.md). Anything not listed is denied.
// Toggling is split by env so "prod is admin only" is data, not code. Which state moves
// each role may make is declared in src/flags/machine.ts.
export const permissions = {
  engineer: { flag: ["read"], flag_staging: ["toggle"], audit: ["read"] },
  admin: { flag: ["read"], flag_staging: ["toggle"], flag_prod: ["toggle"], audit: ["read"] },
  viewer: { flag: ["read"], audit: ["read"] },
} as const;

export const { can, requirePermission } = definePermissions(permissions);
