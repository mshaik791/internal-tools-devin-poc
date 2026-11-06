import { afterEach, describe, expect, it, vi } from "vitest";
import { MOCK_USERS, createMockAuth, getAuthAdapter, verifySession, type User } from "../src/auth";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { value: jar.get(n) } : undefined),
    set: (n: string, v: string) => void jar.set(n, v),
    delete: (n: string) => void jar.delete(n),
  }),
  headers: async () => new Headers(),
}));
const { signIn } = await import("../src/auth/server");

const engineer: User = { sub: "engineer", name: "Eve Engineer", email: "engineer@example.test", role: "engineer", regions: ["*"] };
const viewer: User = { sub: "viewer", name: "Vic Viewer", email: "viewer@example.test", role: "viewer", regions: ["*"] };

afterEach(() => {
  vi.unstubAllEnvs();
  jar.clear();
});

describe("createMockAuth", () => {
  it("defaults to the three MOCK_USERS", async () => {
    expect(await createMockAuth().listUsers()).toEqual(MOCK_USERS);
    expect((await createMockAuth().listUsers()).map((u) => u.role)).toEqual(["analyst", "senior_reviewer", "admin"]);
  });

  it("uses only the app-supplied users", async () => {
    const auth = createMockAuth({ users: [engineer, viewer] });
    expect(await auth.listUsers()).toEqual([engineer, viewer]);
    expect(await auth.getUser("engineer")).toEqual(engineer);
    expect(await auth.getUser("analyst")).toBeNull();
    expect(await auth.getUser("nobody")).toBeNull();
  });

  it("returns copies, so callers cannot mutate the user list", async () => {
    const users = [{ ...engineer, regions: ["US-WEST"] }];
    const auth = createMockAuth({ users });
    users[0]!.role = "admin";
    const u = (await auth.getUser("engineer"))!;
    u.regions.push("EU");
    expect(await auth.getUser("engineer")).toMatchObject({ role: "engineer", regions: ["US-WEST"] });
  });

  it("rejects duplicate or empty subs", () => {
    expect(() => createMockAuth({ users: [engineer, engineer] })).toThrow(/duplicate sub/);
    expect(() => createMockAuth({ users: [{ ...engineer, sub: "" }] })).toThrow(/without sub/);
  });

  it("refuses to resolve users in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(createMockAuth({ users: [engineer] }).getUser("engineer")).rejects.toThrow(/not allowed in production/);
    await expect(createMockAuth().listUsers()).rejects.toThrow(/not allowed in production/);
  });
});

describe("getAuthAdapter", () => {
  it("passes app users to the mock adapter and defaults to MOCK_USERS", async () => {
    vi.stubEnv("AUTH_PROVIDER", "mock");
    expect(await getAuthAdapter({ users: [viewer] }).listUsers()).toEqual([viewer]);
    expect(await getAuthAdapter().listUsers()).toEqual(MOCK_USERS);
  });

  it("refuses mock in production and unknown providers", () => {
    vi.stubEnv("AUTH_PROVIDER", "mock");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getAuthAdapter({ users: [viewer] })).toThrow(/not allowed in production/);
    vi.stubEnv("AUTH_PROVIDER", "okta");
    expect(() => getAuthAdapter()).toThrow(/Unsupported AUTH_PROVIDER/);
  });
});

describe("signIn", () => {
  it("signs in an app-supplied user via the given adapter", async () => {
    vi.stubEnv("AUTH_PROVIDER", "mock");
    await signIn("engineer", getAuthAdapter({ users: [engineer] }));
    expect(await verifySession(jar.get("it_session"))).toEqual(engineer);
  });

  it("defaults to MOCK_USERS: unknown to the default adapter", async () => {
    vi.stubEnv("AUTH_PROVIDER", "mock");
    await expect(signIn("engineer")).rejects.toThrow(/Unknown user/);
    await signIn("admin");
    expect((await verifySession(jar.get("it_session")))?.role).toBe("admin");
  });
});
