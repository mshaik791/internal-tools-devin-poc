import { PrismaClient, type FlagEnv, type FlagState, type Prisma } from "../src/generated/prisma";

// 12 flags: 6 keys, each in staging and prod. Deterministic; skipped if flags exist.
type EnvSeed = [FlagState, number | null];
const FLAGS: [key: string, description: string, owner: string, staging: EnvSeed, prod: EnvSeed][] = [
  ["new-checkout", "Redesigned checkout flow", "team-payments", ["on", null], ["off", null]],
  ["dark-mode", "Dark theme for the customer dashboard", "team-web", ["percentage", 50], ["percentage", 10]],
  ["ledger-v2", "Double-entry ledger service", "team-ledger", ["on", null], ["on", null]],
  ["fast-payouts", "Same-day payouts for verified merchants", "team-payments", ["off", null], ["off", null]],
  ["kyc-auto-approve", "Auto-approve low-risk KYC cases", "team-compliance", ["percentage", 25], ["off", null]],
  ["search-reindex", "Nightly search reindex job", "team-platform", ["off", null], ["on", null]],
];

export function buildFlags(): Prisma.FlagCreateManyInput[] {
  return FLAGS.flatMap(([key, description, owner, staging, prod]) =>
    (["staging", "prod"] as FlagEnv[]).map((env) => {
      const [state, percentage] = env === "staging" ? staging : prod;
      return { id: `${env}-${key}`, key, description, owner, env, state, percentage };
    }),
  );
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.flag.count();
    if (existing > 0) {
      console.log(`feature-flags: ${existing} flags already present, skipping seed (use \`pnpm db:reset\` to reseed)`);
      return;
    }
    const { count } = await prisma.flag.createMany({ data: buildFlags() });
    console.log(`feature-flags: seeded ${count} flags`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
