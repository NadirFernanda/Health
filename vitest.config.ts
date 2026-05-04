import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["src/__tests__/setup.ts"],
    testTimeout: 30_000,
    // Run test files one at a time — suites share DB connection pool
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/app/api/**/*.ts",
        "src/lib/auth.ts",
        "src/lib/api-auth.ts",
      ],
      exclude: ["src/**/*.test.ts", "src/__tests__/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
