import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Tests, stories and barrel files hold no logic of their own.
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.stories.tsx",
        "src/**/index.ts",
      ],
      // Starting point from AGENTS.md section 9. Never lower these to pass; raise them when coverage allows.
      thresholds: { lines: 80, branches: 80 },
    },
  },
});
