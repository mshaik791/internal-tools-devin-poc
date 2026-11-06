import { definePermissions } from "@internal/core/permissions";

// role -> resource -> actions. Anything not listed is denied.
export const permissions = {
  analyst: { home: ["read"] },
  senior_reviewer: { home: ["read"] },
  admin: { home: ["read"] },
} as const;

export const { can, requirePermission } = definePermissions(permissions);
