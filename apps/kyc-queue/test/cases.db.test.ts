import { MOCK_USERS, SESSION_COOKIE, signSession } from "@internal/core/auth";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Route handlers read the session cookie via next/headers.
let cookie: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (n === SESSION_COOKIE && cookie ? { value: cookie } : undefined) }),
  headers: async () => new Headers({ "x-request-id": "test-request" }),
}));

const { prisma } = await import("@/lib/db");
const { getCase, listCases, transitionCase } = await import("@/kyc/cases");
const auditRoute = await import("@/app/api/audit/route");
const caseRoute = await import("@/app/api/cases/[id]/route");
const transitionRoute = await import("@/app/api/cases/[id]/transition/route");

const [analyst, senior, admin] = MOCK_USERS as [typeof MOCK_USERS[0], typeof MOCK_USERS[0], typeof MOCK_USERS[0]];
const as = async (u: typeof analyst) => {
  cookie = await signSession(u);
};
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (body: unknown) =>
  new Request("http://test/x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

let euCaseId: string;

beforeAll(async () => {
  euCaseId = (await prisma.kycCase.findFirstOrThrow({ where: { region: "EU" } })).id;
});
afterAll(() => prisma.$disconnect());

describe("region scoping (server-side)", () => {
  it("analyst list only contains their region", async () => {
    const rows = await listCases(analyst);
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.map((r) => r.region))).toEqual(new Set(["US-WEST"]));
  });

  it("analyst gets null / 404 for another region's case", async () => {
    expect(await getCase(analyst, euCaseId)).toBeNull();
    expect(await getCase(senior, euCaseId)).not.toBeNull();
    await as(analyst);
    expect((await caseRoute.GET(new Request("http://test"), params(euCaseId))).status).toBe(404);
    expect((await auditRoute.GET(new Request(`http://test/api/audit?caseId=${euCaseId}`))).status).toBe(404);
    expect((await transitionRoute.POST(post({ to: "in_review", reason: "x" }), params(euCaseId))).status).toBe(404);
  });

  it("admin cannot transition (403)", async () => {
    await as(admin);
    expect((await transitionRoute.POST(post({ to: "in_review", reason: "x" }), params(euCaseId))).status).toBe(403);
  });
});

describe("transition + audit", () => {
  it("writes an audit row with before/after/reason, returned newest first", async () => {
    const kase = await prisma.kycCase.findFirstOrThrow({ where: { region: "US-WEST", status: "pending" } });
    await as(analyst);
    expect((await transitionRoute.POST(post({ to: "in_review", reason: "starting" }), params(kase.id))).status).toBe(200);
    expect((await transitionRoute.POST(post({ to: "escalated", reason: "docs unclear", escalationCategory: "identity_mismatch" }), params(kase.id))).status).toBe(200);
    expect((await transitionRoute.POST(post({ to: "approved", reason: "nope" }), params(kase.id))).status).toBe(403);
    expect((await transitionRoute.POST(post({ to: "escalated", reason: "" }), params(kase.id))).status).toBe(409);

    const res = await auditRoute.GET(new Request(`http://test/api/audit?caseId=${kase.id}`));
    const rows = (await res.json()) as { reason: string; before: unknown; after: unknown; actor: string; requestId: string }[];
    expect(rows.slice(0, 2)).toMatchObject([
      {
        actor: "analyst",
        reason: "docs unclear",
        before: { status: "in_review" },
        after: { status: "escalated", escalationCategory: "identity_mismatch" },
        requestId: "test-request",
      },
      { actor: "analyst", reason: "starting", before: { status: "pending" }, after: { status: "in_review" } },
    ]);
  });

  it("requires a valid escalationCategory to escalate, and only then", async () => {
    const kase = await prisma.kycCase.findFirstOrThrow({ where: { region: "US-WEST", status: "in_review" } });
    const before = await prisma.auditLog.count({ where: { entityId: kase.id } });
    await as(analyst);
    const attempt = (body: object) => transitionRoute.POST(post({ reason: "why", ...body }), params(kase.id));
    expect((await attempt({ to: "escalated" })).status).toBe(400);
    expect((await attempt({ to: "escalated", escalationCategory: "other" })).status).toBe(400);
    expect((await attempt({ to: "approved", escalationCategory: "fraud" })).status).toBe(400);
    expect(await prisma.auditLog.count({ where: { entityId: kase.id } })).toBe(before);
    expect(await prisma.kycCase.findUniqueOrThrow({ where: { id: kase.id } })).toMatchObject({ status: "in_review", escalationCategory: null });

    const res = await attempt({ to: "escalated", escalationCategory: "sanctions" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "escalated", escalationCategory: "sanctions" });
    expect(await prisma.kycCase.findUniqueOrThrow({ where: { id: kase.id } })).toMatchObject({ escalationCategory: "sanctions" });
    const [row] = await prisma.auditLog.findMany({ where: { entityId: kase.id }, orderBy: [{ ts: "desc" }, { id: "desc" }], take: 1 });
    expect(row).toMatchObject({ after: { status: "escalated", escalationCategory: "sanctions" }, reason: "why" });
  });

  it("rejects an empty reason without writing", async () => {
    const kase = await prisma.kycCase.findFirstOrThrow({ where: { region: "US-WEST", status: "in_review" } });
    const before = await prisma.auditLog.count({ where: { entityId: kase.id } });
    const r = await transitionCase(analyst, { id: kase.id, to: "approved", reason: "   ", requestId: "t" });
    expect(r).toMatchObject({ ok: false, status: 400 });
    expect(await prisma.auditLog.count({ where: { entityId: kase.id } })).toBe(before);
    expect((await prisma.kycCase.findUniqueOrThrow({ where: { id: kase.id } })).status).toBe("in_review");
  });
});

describe("audit_log is append-only for app_rw", () => {
  it("denies UPDATE, DELETE and TRUNCATE", async () => {
    await expect(prisma.$executeRawUnsafe("UPDATE audit_log SET reason = reason")).rejects.toThrow(/permission denied/);
    await expect(prisma.$executeRawUnsafe("DELETE FROM audit_log")).rejects.toThrow(/permission denied/);
    await expect(prisma.$executeRawUnsafe("TRUNCATE audit_log")).rejects.toThrow(/permission denied/);
    await expect(prisma.auditLog.updateMany({ data: { reason: "x" } })).rejects.toThrow();
  });
});
