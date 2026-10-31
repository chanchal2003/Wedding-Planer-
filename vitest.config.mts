import { defineConfig } from "vitest/config";

// Tests check server rules only (lib/access, lib/import), so no browser
// environment is needed. They share one database, so test files run one
// after the other.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
  },
});
