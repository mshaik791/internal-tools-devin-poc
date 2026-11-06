import { describe, expect, it } from "vitest";
import { MOCK_USERS, signSession, verifySession } from "../src/auth";

describe("session token", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession(MOCK_USERS[0]!);
    expect(await verifySession(token)).toEqual(MOCK_USERS[0]);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(MOCK_USERS[0]!);
    const [h, p, s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p!, "base64url").toString()), role: "admin" })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});
