import { describe, expect, it } from "vitest";
import { audit } from "../src/audit";

describe("audit", () => {
  it("inserts one row with JSON before/after", async () => {
    const calls: unknown[][] = [];
    const db = { $executeRawUnsafe: async (...args: unknown[]) => (calls.push(args), 1) };
    await audit(
      { actor: "u1", action: "case.transition", entity: "KycCase", entityId: "c1", before: { status: "a" }, after: { status: "b" }, reason: "why", requestId: "r1" },
      db,
    );
    expect(calls).toHaveLength(1);
    const [sql, ...params] = calls[0]!;
    expect(sql).toMatch(/^INSERT INTO audit_log/);
    expect(sql).not.toMatch(/RETURNING/i);
    expect(params).toEqual(["u1", "case.transition", "KycCase", "c1", '{"status":"a"}', '{"status":"b"}', "why", "r1"]);
  });

  it("rejects entries without an actor", async () => {
    const db = { $executeRawUnsafe: async () => 1 };
    await expect(audit({ actor: " ", action: "a", entity: "e", entityId: "1", requestId: "r" }, db)).rejects.toThrow(/actor/);
  });
});
