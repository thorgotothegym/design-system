import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Only tests, stories and test helpers are excluded, so a new file with no test still counts.
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/test/**",
      ],
      // Starting point from AGENTS.md section 9. Never lower these to pass; raise them when coverage allows.
      thresholds: { lines: 80, branches: 80 },
    },
  },
});
