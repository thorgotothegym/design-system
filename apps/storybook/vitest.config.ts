import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { TestProjectInlineConfiguration } from "vitest/config";

const configDir = fileURLToPath(new URL(".storybook", import.meta.url));

/**
 * Every story as a test in a real browser (Chromium through Playwright): it renders, its `play`
 * function passes and axe finds no violation (`a11y.test: "error"` in preview.tsx). One project
 * per theme, because the theme is a Storybook global and axe must pass in both, and one that
 * emulates forced colors (Windows high contrast) and runs only the stories tagged
 * `forced-colors`, which the theme projects leave out.
 */
const storiesIn = (
  theme: "dark" | "light" | "forced-colors",
): TestProjectInlineConfiguration => ({
  extends: true,
  plugins: [
    storybookTest({
      configDir,
      initialGlobals: { theme: theme === "light" ? "light" : "dark" },
      tags:
        theme === "forced-colors"
          ? { include: ["forced-colors"] }
          : { exclude: ["forced-colors"] },
    }),
  ],
  test: {
    name: `storybook-${theme}`,
    // Fails a story that logs console.error or console.warn (React warnings included).
    setupFiles: ["./.storybook/vitest.setup.ts"],
    // The demo play functions run at a readable pace unless STORYBOOK_PLAY_DELAY is 0 (as in CI);
    // a whole form at that pace takes longer than Vitest's default 15 seconds.
    testTimeout: 60_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(
        theme === "forced-colors"
          ? { contextOptions: { forcedColors: "active" } }
          : {},
      ),
      instances: [{ browser: "chromium" }],
    },
  },
});

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/**/*.test.ts",
            "scripts/**/*.test.ts",
            ".storybook/**/*.test.ts",
          ],
        },
      },
      storiesIn("dark"),
      storiesIn("light"),
      storiesIn("forced-colors"),
    ],
  },
});
