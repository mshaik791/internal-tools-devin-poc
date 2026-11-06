import { getSession } from "./auth/server";
import type { Session } from "./auth/types";

/** { role: { resource: [actions] } }. Anything not listed is denied. */
export type PermissionPolicy = Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;

export type ResourceOf<P extends PermissionPolicy> = {
  [Ro in keyof P]: keyof P[Ro];
}[keyof P] &
  string;

export type ActionOf<P extends PermissionPolicy> = {
  [Ro in keyof P]: { [Re in keyof P[Ro]]: P[Ro][Re][number] }[keyof P[Ro]];
}[keyof P] &
  string;

export type PermissionGuard =
  | { ok: true; session: Session }
  | { ok: false; response: Response };

/** Pure default-deny check against a policy. */
export function isAllowed(
  policy: PermissionPolicy,
  session: Pick<Session, "role"> | null | undefined,
  resource: string,
  action: string,
): boolean {
  if (!session) return false;
  if (!Object.hasOwn(policy, session.role)) return false;
  const resources = policy[session.role]!;
  if (!Object.hasOwn(resources, resource)) return false;
  return resources[resource]!.includes(action);
}

/**
 * Binds an app's permissions.ts data to typed helpers:
 *   can(session, resource, action)      -> boolean, default deny
 *   requirePermission(resource, action) -> route-handler guard (401 no session, 403 denied)
 */
export function definePermissions<const P extends PermissionPolicy>(policy: P) {
  function can(
    session: Pick<Session, "role"> | null | undefined,
    resource: ResourceOf<P>,
    action: ActionOf<P>,
  ): boolean {
    return isAllowed(policy, session, resource, action);
  }

  async function requirePermission(resource: ResourceOf<P>, action: ActionOf<P>): Promise<PermissionGuard> {
    const session = await getSession();
    if (!session) {
      return { ok: false, response: Response.json({ error: "unauthenticated" }, { status: 401 }) };
    }
    if (!can(session, resource, action)) {
      return { ok: false, response: Response.json({ error: "forbidden" }, { status: 403 }) };
    }
    return { ok: true, session };
  }

  return { policy, can, requirePermission };
}
