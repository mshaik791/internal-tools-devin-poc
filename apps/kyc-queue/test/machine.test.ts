import { TransitionError } from "@internal/core/state-machine";
import { describe, expect, it } from "vitest";
import { KYC_STATUSES, kycMachine, transitionsFor, type KycStatus } from "@/kyc/machine";

const ROLES = ["analyst", "senior_reviewer", "admin"] as const;

// [from, to, roles allowed] — specs/kyc-queue.md
const LEGAL: [KycStatus, KycStatus, string[]][] = [
  ["pending", "in_review", ["analyst", "senior_reviewer"]],
  ["in_review", "approved", ["analyst", "senior_reviewer"]],
  ["in_review", "rejected", ["analyst", "senior_reviewer"]],
  ["in_review", "escalated", ["analyst", "senior_reviewer"]],
  ["escalated", "approved", ["senior_reviewer"]],
  ["escalated", "rejected", ["senior_reviewer"]],
];

const attempt = (from: string, to: string, role: string, reason: string | null = "because") => {
  try {
    return kycMachine.transition({ from, to, role, reason }).to;
  } catch (e) {
    if (e instanceof TransitionError) return e.code;
    throw e;
  }
};

describe("kyc state machine", () => {
  it.each(LEGAL.flatMap(([from, to, roles]) => roles.map((role) => [from, to, role] as const)))(
    "legal: %s -> %s by %s",
    (from, to, role) => expect(attempt(from, to, role)).toBe(to),
  );

  it("illegal: approved -> in_review is undeclared", () => {
    expect(attempt("approved", "in_review", "senior_reviewer")).toBe("UNDECLARED");
  });

  it("illegal: pending -> approved skips review", () => {
    expect(attempt("pending", "approved", "senior_reviewer")).toBe("UNDECLARED");
  });

  it("wrong role: analyst cannot resolve an escalation", () => {
    expect(attempt("escalated", "approved", "analyst")).toBe("FORBIDDEN");
  });

  it("wrong role: admin cannot transition", () => {
    expect(attempt("pending", "in_review", "admin")).toBe("FORBIDDEN");
  });

  it("requires a reason", () => {
    expect(attempt("pending", "in_review", "analyst", "  ")).toBe("REASON_REQUIRED");
  });

  it("declares exactly the spec transitions", () => {
    expect(kycMachine.transitions.map((t) => [t.from, t.to, [...t.roles]])).toEqual(LEGAL);
  });

  // The detail page renders buttons from transitionsFor(); the API runs kycMachine.transition().
  it.each(ROLES.flatMap((role) => KYC_STATUSES.map((s) => [role, s] as const)))(
    "UI buttons match API for %s on %s",
    (role, status) => {
      const accepted = KYC_STATUSES.filter((to) => attempt(status, to, role) === to);
      const permitted = role === "admin" ? [] : accepted;
      expect(transitionsFor({ role }, status)).toEqual(permitted);
    },
  );
});
