import { definePermissions } from "@internal/core/permissions";

// role -> resource -> actions (specs/kyc-queue.md). Anything not listed is denied.
// Which specific state moves a role may make is declared in src/kyc/machine.ts.
export const permissions = {
  analyst: { case: ["read", "transition"], audit: ["read"] },
  senior_reviewer: { case: ["read", "transition"], audit: ["read"] },
  admin: { case: ["read", "assign"], audit: ["read"] },
} as const;

export const { can, requirePermission } = definePermissions(permissions);
