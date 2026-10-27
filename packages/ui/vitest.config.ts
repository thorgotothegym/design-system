import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Only tests and stories are excluded, so a new file with no test still counts.
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.stories.{ts,tsx}"],
      // Starting point from AGENTS.md section 9. Never lower these to pass; raise them when coverage allows.
      thresholds: { lines: 80, branches: 80 },
    },
  },
});
