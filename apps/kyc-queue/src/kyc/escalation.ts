// No server imports: shared by the API and the client transition form.
export const ESCALATION_CATEGORIES = ["fraud", "sanctions", "identity_mismatch"] as const;
export type EscalationCategory = (typeof ESCALATION_CATEGORIES)[number];

export const ESCALATION_CATEGORY_LABELS: Record<EscalationCategory, string> = {
  fraud: "Fraud",
  sanctions: "Sanctions",
  identity_mismatch: "Identity mismatch",
};

export function parseEscalationCategory(v: unknown): EscalationCategory | null {
  return typeof v === "string" && (ESCALATION_CATEGORIES as readonly string[]).includes(v) ? (v as EscalationCategory) : null;
}
