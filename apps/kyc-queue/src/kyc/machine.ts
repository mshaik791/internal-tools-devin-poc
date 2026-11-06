import type { Session } from "@internal/core/auth";
import { defineMachine } from "@internal/core/state-machine";
import { can } from "@/permissions";

export const KYC_STATUSES = ["pending", "in_review", "approved", "rejected", "escalated"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

const REVIEWERS = ["analyst", "senior_reviewer"];

export const kycMachine = defineMachine({
  states: KYC_STATUSES,
  transitions: [
    { from: "pending", to: "in_review", roles: REVIEWERS },
    { from: "in_review", to: "approved", roles: REVIEWERS },
    { from: "in_review", to: "rejected", roles: REVIEWERS },
    { from: "in_review", to: "escalated", roles: REVIEWERS },
    { from: "escalated", to: "approved", roles: ["senior_reviewer"] },
    { from: "escalated", to: "rejected", roles: ["senior_reviewer"] },
  ],
});

export const OPEN_STATUSES: readonly KycStatus[] = ["pending", "in_review", "escalated"];

export const TRANSITION_LABELS: Record<KycStatus, string> = {
  pending: "Reopen",
  in_review: "Start review",
  approved: "Approve",
  rejected: "Reject",
  escalated: "Escalate",
};

/**
 * Target states `session` may move a case to from `status`. Single source of truth for
 * the detail-page buttons; the API enforces the same permission + machine.
 */
export function transitionsFor(session: Pick<Session, "role">, status: KycStatus): KycStatus[] {
  if (!can(session, "case", "transition")) return [];
  return kycMachine.allowedTransitions(status, session.role).map((t) => t.to);
}
