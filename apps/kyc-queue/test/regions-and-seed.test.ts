import { describe, expect, it } from "vitest";
import { isOverdue } from "@/kyc/cases";
import { ESCALATION_CATEGORIES, parseEscalationCategory } from "@/kyc/escalation";
import { caseScope, visibleRegions } from "@/kyc/regions";
import { buildCases } from "../prisma/seed";

describe("region scope", () => {
  it("restricts analysts to their regions in the query", () => {
    expect(caseScope({ regions: ["US-WEST"] })).toEqual({ region: { in: ["US-WEST"] } });
    expect(caseScope({ regions: [] })).toEqual({ region: { in: [] } });
  });
  it("does not filter all-region users", () => {
    expect(caseScope({ regions: ["*"] })).toEqual({});
    expect(visibleRegions({ regions: ["*"] })).toEqual(["US-WEST", "US-EAST", "EU"]);
  });
});

describe("seed", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const cases = buildCases(now);
  it("has 40 cases across 3 regions with 10 overdue", () => {
    expect(cases).toHaveLength(40);
    expect(new Set(cases.map((c) => c.region))).toEqual(new Set(["US-WEST", "US-EAST", "EU"]));
    const overdue = cases.filter((c) => isOverdue({ status: c.status!, slaDueAt: new Date(c.slaDueAt) }, now));
    expect(overdue).toHaveLength(10);
  });
  it("sets an escalation category on exactly the escalated cases", () => {
    for (const c of cases) expect(c.escalationCategory != null).toBe(c.status === "escalated");
    expect(new Set(cases.flatMap((c) => (c.escalationCategory ? [c.escalationCategory] : [])))).toEqual(new Set(ESCALATION_CATEGORIES));
  });
  it("gives the analyst in_review cases to work", () => {
    expect(cases.filter((c) => c.region === "US-WEST" && c.status === "in_review").length).toBeGreaterThan(3);
  });
});

describe("parseEscalationCategory", () => {
  it.each([["fraud", "fraud"], ["sanctions", "sanctions"], ["identity_mismatch", "identity_mismatch"], ["FRAUD", null], ["other", null], ["", null], [null, null], [1, null]])(
    "%s -> %s",
    (v, out) => expect(parseEscalationCategory(v)).toBe(out),
  );
});
