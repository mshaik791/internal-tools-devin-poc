import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    env: { SESSION_SECRET: "test-secret-test-secret-test-secret-0000" },
  },
});
