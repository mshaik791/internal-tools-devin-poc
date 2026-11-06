import { MOCK_USERS, SESSION_COOKIE, signSession, type Session } from "@internal/core/auth";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let cookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === SESSION_COOKIE && cookie ? { value: cookie } : undefined) }),
  headers: async () => new Headers({ "x-request-id": "test-request" }),
}));

const { prisma } = await import("@/lib/db");
const auditRoute = await import("@/app/api/audit/route");
const flagRoute = await import("@/app/api/flags/[id]/route");
const transitionRoute = await import("@/app/api/flags/[id]/transition/route");

// Core's mock OIDC only seeds analyst / senior_reviewer / admin. Engineer and viewer are
// test-only signed sessions until core adds those users (see PR description).
const admin = MOCK_USERS.find((u) => u.role === "admin")!;
const analyst = MOCK_USERS.find((u) => u.role === "analyst")!;
const user = (role: string): Session => ({ sub: `test-${role}`, name: role, email: `${role}@example.test`, role, regions: ["*"] });
const engineer = user("engineer");
const viewer = user("viewer");

const as = async (u: Session) => {
  cookie = await signSession(u);
};
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (body: unknown) =>
  new Request("http://test/x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const toggle = (id: string, body: unknown) => transitionRoute.POST(post(body), params(id));

const key = `db-test-${Date.now()}`;
let staging: string;
let prod: string;

beforeAll(async () => {
  const base = { key, description: "integration test flag", owner: "team-test" };
  staging = (await prisma.flag.create({ data: { ...base, env: "staging" } })).id;
  prod = (await prisma.flag.create({ data: { ...base, env: "prod" } })).id;
});
afterAll(async () => {
  await prisma.flag.deleteMany({ where: { key } });
  await prisma.$disconnect();
});

describe("env-scoped toggles", () => {
  it("engineer toggles staging, writes audit rows newest first", async () => {
    await as(engineer);
    expect((await toggle(staging, { to: "percentage", percentage: 25, reason: "canary" })).status).toBe(200);
    expect((await toggle(staging, { to: "on", reason: "full rollout" })).status).toBe(200);
    const rows = await (await auditRoute.GET(new Request(`http://test/api/audit?flagId=${staging}`))).json();
    expect(rows).toMatchObject([
      { actor: "test-engineer", reason: "full rollout", before: { state: "percentage", percentage: 25 }, after: { state: "on", percentage: null }, requestId: "test-request" },
      { actor: "test-engineer", reason: "canary", before: { state: "off", percentage: null }, after: { state: "percentage", percentage: 25 } },
    ]);
  });

  it("engineer gets 403 on prod and nothing is written", async () => {
    await as(engineer);
    expect((await toggle(prod, { to: "on", reason: "x" })).status).toBe(403);
    expect(await prisma.auditLog.count({ where: { entityId: prod } })).toBe(0);
    expect((await prisma.flag.findUniqueOrThrow({ where: { id: prod } })).state).toBe("off");
  });

  it("viewer can read but not toggle; roles outside the spec are denied", async () => {
    await as(viewer);
    expect((await flagRoute.GET(new Request("http://test"), params(staging))).status).toBe(200);
    expect((await toggle(staging, { to: "off", reason: "x" })).status).toBe(403);
    await as(analyst);
    expect((await flagRoute.GET(new Request("http://test"), params(staging))).status).toBe(403);
  });

  it("admin toggles prod; validation errors write nothing", async () => {
    await as(admin);
    expect((await toggle(prod, { to: "percentage", percentage: 0, reason: "x" })).status).toBe(400);
    expect((await toggle(prod, { to: "on", reason: "  " })).status).toBe(400);
    expect((await toggle(prod, { to: "off", reason: "x" })).status).toBe(409);
    expect(await prisma.auditLog.count({ where: { entityId: prod } })).toBe(0);
    expect((await toggle(prod, { to: "on", reason: "launch" })).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { entityId: prod } })).toBe(1);
  });
});

describe("audit_log is append-only for app_rw", () => {
  it("denies UPDATE, DELETE and TRUNCATE", async () => {
    await expect(prisma.$executeRawUnsafe("UPDATE audit_log SET reason = reason")).rejects.toThrow(/permission denied/);
    await expect(prisma.$executeRawUnsafe("DELETE FROM audit_log")).rejects.toThrow(/permission denied/);
    await expect(prisma.$executeRawUnsafe("TRUNCATE audit_log")).rejects.toThrow(/permission denied/);
  });
});
