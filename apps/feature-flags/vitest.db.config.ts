import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests against Postgres as app_rw. Needs a migrated + seeded DB (`pnpm dev` or `pnpm db:setup`).
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["test/**/*.db.test.ts"], fileParallelism: false },
});
