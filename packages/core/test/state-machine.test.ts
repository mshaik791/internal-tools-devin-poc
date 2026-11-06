import { describe, expect, it } from "vitest";
import { defineMachine, TransitionError } from "../src/state-machine";

const machine = defineMachine({
  states: ["pending", "in_review", "approved", "escalated"],
  transitions: [
    { from: "pending", to: "in_review", roles: ["analyst", "senior_reviewer"] },
    { from: "in_review", to: "escalated", roles: ["analyst"] },
    { from: "escalated", to: "approved", roles: ["senior_reviewer"] },
  ],
});

const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof TransitionError ? e.code : "OTHER";
  }
  return "NO_THROW";
};

describe("state machine", () => {
  it("allows a legal transition and trims the reason", () => {
    expect(machine.transition({ from: "pending", to: "in_review", role: "analyst", reason: "  picking up " })).toEqual({
      from: "pending",
      to: "in_review",
      reason: "picking up",
    });
  });

  it("throws on an undeclared transition", () => {
    expect(codeOf(() => machine.transition({ from: "pending", to: "approved", role: "senior_reviewer", reason: "x" }))).toBe(
      "UNDECLARED",
    );
  });

  it("throws when the role is not allowed", () => {
    expect(codeOf(() => machine.transition({ from: "escalated", to: "approved", role: "analyst", reason: "x" }))).toBe(
      "FORBIDDEN",
    );
  });

  it.each([undefined, null, "", "   "])("requires a non-empty reason (%j)", (reason) => {
    expect(codeOf(() => machine.transition({ from: "pending", to: "in_review", role: "analyst", reason }))).toBe(
      "REASON_REQUIRED",
    );
  });

  it("lists allowed transitions per role", () => {
    expect(machine.allowedTransitions("escalated", "analyst")).toEqual([]);
    expect(machine.allowedTransitions("escalated", "senior_reviewer").map((t) => t.to)).toEqual(["approved"]);
  });

  it("rejects definitions with unknown states", () => {
    expect(() =>
      defineMachine({ states: ["a"], transitions: [{ from: "a", to: "b" as "a", roles: [] }] }),
    ).toThrow(/unknown state/);
  });
});
