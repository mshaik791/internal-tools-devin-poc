import type { Session } from "@internal/core/auth";
import { defineMachine } from "@internal/core/state-machine";
import { can } from "@/permissions";

export const FLAG_ENVS = ["staging", "prod"] as const;
export type FlagEnv = (typeof FLAG_ENVS)[number];
export const FLAG_STATES = ["off", "on", "percentage"] as const;
export type FlagState = (typeof FLAG_STATES)[number];

// off -> on | percentage; on -> off; percentage -> on | off
const MOVES = [
  ["off", "on"],
  ["off", "percentage"],
  ["on", "off"],
  ["percentage", "on"],
  ["percentage", "off"],
] as const;

/** Prod transitions are admin only. */
export const ENV_ROLES: Record<FlagEnv, readonly string[]> = {
  staging: ["engineer", "admin"],
  prod: ["admin"],
};

const machineFor = (env: FlagEnv) =>
  defineMachine({ states: FLAG_STATES, transitions: MOVES.map(([from, to]) => ({ from, to, roles: ENV_ROLES[env] })) });

export const flagMachines = { staging: machineFor("staging"), prod: machineFor("prod") } as const;

export const toggleResource = (env: FlagEnv) => (env === "prod" ? "flag_prod" : "flag_staging");

export const TRANSITION_LABELS: Record<FlagState, string> = {
  on: "Turn on",
  off: "Turn off",
  percentage: "Roll out %",
};

/**
 * Target states `session` may move `flag` to. Single source of truth for the table's inline
 * toggle and the detail-page buttons; the API enforces the same permission + machine.
 */
export function transitionsFor(session: Pick<Session, "role">, flag: { env: FlagEnv; state: FlagState }): FlagState[] {
  if (!can(session, toggleResource(flag.env), "toggle")) return [];
  return flagMachines[flag.env].allowedTransitions(flag.state, session.role).map((t) => t.to);
}
