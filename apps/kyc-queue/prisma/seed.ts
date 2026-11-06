import { PrismaClient, type EscalationCategory, type KycStatus, type Prisma } from "../src/generated/prisma";

// 40 cases across 3 regions, 10 of the open ones overdue. Deterministic; skipped if cases exist.
const REGIONS = ["US-WEST", "US-EAST", "EU"] as const;
const STATUS_CYCLE: KycStatus[] = ["pending", "in_review", "pending", "escalated", "in_review", "approved", "rejected", "in_review"];
const OPEN: KycStatus[] = ["pending", "in_review", "escalated"];
const CATEGORIES: EscalationCategory[] = ["fraud", "sanctions", "identity_mismatch"];
const FIRST = ["Ava", "Ben", "Chloe", "Dev", "Elif", "Farid", "Grace", "Hiro", "Ines", "Jonas"];
const LAST = ["Nguyen", "Okafor", "Silva", "Kowalski", "Haddad", "Larsen", "Moreau", "Tanaka"];
const HOUR = 3_600_000;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCases(now = new Date(), count = 40, overdueTarget = 10): Prisma.KycCaseCreateManyInput[] {
  const rand = rng(42);
  let open = 0;
  let overdue = 0;
  return Array.from({ length: count }, (_, i) => {
    const region = REGIONS[i % REGIONS.length]!;
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length]!;
    const isOpen = OPEN.includes(status);
    const makeOverdue = isOpen && open++ % 3 === 0 && overdue < overdueTarget;
    if (makeOverdue) overdue++;
    const first = FIRST[i % FIRST.length]!;
    const last = LAST[(i * 3) % LAST.length]!;
    const createdAt = new Date(now.getTime() - (24 + Math.floor(rand() * 240)) * HOUR);
    const slaDueAt = makeOverdue
      ? new Date(now.getTime() - (1 + Math.floor(rand() * 72)) * HOUR)
      : new Date(now.getTime() + (2 + Math.floor(rand() * 120)) * HOUR);
    return {
      id: `KYC-${String(i + 1).padStart(4, "0")}`,
      customerName: `${first} ${last}`,
      customerEmail: `${first}.${last}.${i + 1}@example.test`.toLowerCase(),
      region,
      riskScore: Math.floor(rand() * 101),
      status,
      assignedTo: status === "escalated" ? "senior" : region === "US-WEST" && status !== "pending" ? "analyst" : null,
      escalationCategory: status === "escalated" ? CATEGORIES[i % CATEGORIES.length]! : null,
      slaDueAt,
      createdAt,
    };
  });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.kycCase.count();
    if (existing > 0) {
      console.log(`kyc-queue: ${existing} cases already present, skipping seed (use \`pnpm db:reset\` to reseed)`);
      return;
    }
    const { count } = await prisma.kycCase.createMany({ data: buildCases() });
    console.log(`kyc-queue: seeded ${count} cases`);
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
