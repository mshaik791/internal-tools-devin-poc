import { TransitionError } from "@internal/core/state-machine";
import { describe, expect, it } from "vitest";
import { FLAG_ENVS, FLAG_STATES, flagMachines, transitionsFor, type FlagEnv, type FlagState } from "@/flags/machine";

const ROLES = ["engineer", "admin", "viewer"] as const;
const MOVES: [FlagState, FlagState][] = [
  ["off", "on"],
  ["off", "percentage"],
  ["on", "off"],
  ["percentage", "on"],
  ["percentage", "off"],
];
const ROLES_BY_ENV: Record<FlagEnv, string[]> = { staging: ["engineer", "admin"], prod: ["admin"] };

const attempt = (env: FlagEnv, from: string, to: string, role: string, reason: string | null = "because") => {
  try {
    return flagMachines[env].transition({ from, to, role, reason }).to;
  } catch (e) {
    if (e instanceof TransitionError) return e.code;
    throw e;
  }
};

describe("flag state machine", () => {
  it.each(FLAG_ENVS.flatMap((env) => MOVES.flatMap(([from, to]) => ROLES_BY_ENV[env].map((r) => [env, from, to, r] as const))))(
    "legal: %s %s -> %s by %s",
    (env, from, to, role) => expect(attempt(env, from, to, role)).toBe(to),
  );

  it("illegal: on -> percentage is undeclared", () => {
    expect(attempt("staging", "on", "percentage", "admin")).toBe("UNDECLARED");
  });

  it("wrong role: engineer cannot transition prod", () => {
    expect(attempt("prod", "off", "on", "engineer")).toBe("FORBIDDEN");
  });

  it("wrong role: viewer cannot transition staging", () => {
    expect(attempt("staging", "off", "on", "viewer")).toBe("FORBIDDEN");
  });

  it("requires a reason", () => {
    expect(attempt("staging", "off", "on", "engineer", " ")).toBe("REASON_REQUIRED");
  });

  it.each(FLAG_ENVS)("%s declares exactly the spec transitions", (env) => {
    expect(flagMachines[env].transitions.map((t) => [t.from, t.to, [...t.roles]])).toEqual(
      MOVES.map(([f, t]) => [f, t, ROLES_BY_ENV[env]]),
    );
  });

  // Inline toggle + detail buttons render transitionsFor(); the API runs flagMachines[env].transition().
  it.each(ROLES.flatMap((role) => FLAG_ENVS.flatMap((env) => FLAG_STATES.map((s) => [role, env, s] as const))))(
    "UI options match API for %s on %s/%s",
    (role, env, state) => {
      expect([...transitionsFor({ role }, { env, state })].sort()).toEqual(
        FLAG_STATES.filter((to) => attempt(env, state, to, role) === to).sort(),
      );
    },
  );
});
