import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.db.test.ts", "node_modules/**"],
        },
      },
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "db",
          environment: "node",
          include: ["src/**/*.db.test.ts"],
          fileParallelism: false,
          setupFiles: ["src/test/dbSetup.ts"],
        },
      },
    ],
  },
});
