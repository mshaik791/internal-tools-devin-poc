export const ALL_REGIONS = "*";

/** Identity claims as an OIDC provider would return them. */
export interface User {
  sub: string;
  name: string;
  email: string;
  role: string;
  /** Region codes the user may access, or ["*"] for all regions. */
  regions: string[];
}

export type Session = User;

/** Anything that can resolve a user id to identity claims (mock in dev, real OIDC in prod). */
export interface AuthAdapter {
  readonly id: string;
  listUsers(): Promise<User[]>;
  getUser(sub: string): Promise<User | null>;
}

export function hasRegion(session: Session, region: string): boolean {
  return session.regions.includes(ALL_REGIONS) || session.regions.includes(region);
}
