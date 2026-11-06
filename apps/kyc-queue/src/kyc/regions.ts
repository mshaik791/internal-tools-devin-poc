import { ALL_REGIONS, type Session } from "@internal/core/auth";
import type { Prisma } from "@/generated/prisma";

export const REGIONS = ["US-WEST", "US-EAST", "EU"] as const;

export function visibleRegions(session: Pick<Session, "regions">): string[] {
  return session.regions.includes(ALL_REGIONS) ? [...REGIONS] : REGIONS.filter((r) => session.regions.includes(r));
}

/** Server-side row filter: every KycCase query must include this. */
export function caseScope(session: Pick<Session, "regions">): Prisma.KycCaseWhereInput {
  return session.regions.includes(ALL_REGIONS) ? {} : { region: { in: visibleRegions(session) } };
}
