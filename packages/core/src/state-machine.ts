export interface TransitionDef<S extends string = string> {
  from: S;
  to: S;
  roles: readonly string[];
}

export type TransitionErrorCode = "UNDECLARED" | "FORBIDDEN" | "REASON_REQUIRED";

export class TransitionError extends Error {
  constructor(
    readonly code: TransitionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

export interface TransitionRequest {
  from: string;
  to: string;
  role: string;
  reason: string | null | undefined;
}

export interface Machine<S extends string> {
  readonly states: readonly S[];
  readonly transitions: readonly TransitionDef<S>[];
  /** Transitions out of `from` that `role` may perform. */
  allowedTransitions(from: string, role: string): TransitionDef<S>[];
  canTransition(from: string, to: string, role: string): boolean;
  /** Validates a move. Throws TransitionError; returns the target state and trimmed reason. */
  transition(req: TransitionRequest): { from: S; to: S; reason: string };
}

export function defineMachine<const S extends string>(def: {
  states: readonly S[];
  transitions: readonly TransitionDef<NoInfer<S>>[];
}): Machine<S> {
  const states = new Set<string>(def.states);
  const seen = new Set<string>();
  for (const t of def.transitions) {
    if (!states.has(t.from) || !states.has(t.to)) {
      throw new Error(`defineMachine: unknown state in ${t.from} -> ${t.to}`);
    }
    const key = `${t.from}->${t.to}`;
    if (seen.has(key)) throw new Error(`defineMachine: duplicate transition ${key}`);
    seen.add(key);
  }

  const find = (from: string, to: string) => def.transitions.find((t) => t.from === from && t.to === to);

  return {
    states: def.states,
    transitions: def.transitions,
    allowedTransitions(from, role) {
      return def.transitions.filter((t) => t.from === from && t.roles.includes(role));
    },
    canTransition(from, to, role) {
      return find(from, to)?.roles.includes(role) ?? false;
    },
    transition({ from, to, role, reason }) {
      const t = find(from, to);
      if (!t) throw new TransitionError("UNDECLARED", `Transition ${from} -> ${to} is not declared`);
      if (!t.roles.includes(role)) {
        throw new TransitionError("FORBIDDEN", `Role ${role} may not transition ${from} -> ${to}`);
      }
      const trimmed = reason?.trim() ?? "";
      if (!trimmed) throw new TransitionError("REASON_REQUIRED", "A non-empty reason is required");
      return { from: t.from, to: t.to, reason: trimmed };
    },
  };
}
