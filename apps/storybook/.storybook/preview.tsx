import * as addonDocs from "@storybook/addon-docs";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import { configure } from "storybook/test";
import { wrapDocsRenderer } from "./docs-renderer";
import "./preview.css";
import { ThemedDocsContainer } from "./themed-docs-container";

// The same convention as the unit tests (packages/ui/src/test/setup.ts): `getByTestId` reads the
// permanent `data-slot` hook, since component roots have no accessible role.
configure({ testIdAttribute: "data-slot" });

// A theme switch must not remount the docs page (docs-renderer.ts). If an upstream change makes
// the renderer impossible to wrap, Storybook's default renderer stays and the docs still work.
const docsRenderer = wrapDocsRenderer(addonDocs.DocsRenderer);
if (docsRenderer === undefined)
  console.warn(
    "docs-renderer.ts could not wrap DocsRenderer: using Storybook's default renderer, so a theme switch remounts docs pages. See docs/theme-switch.md.",
  );

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [
    withThemeByDataAttribute({
      themes: { dark: "dark", light: "light" },
      defaultTheme: "dark",
      attributeName: "data-theme",
      parentSelector: "html",
    }),
  ],
  parameters: {
    // The tokens set the page background; a second background switcher would only fight them.
    backgrounds: { disabled: true },
    a11y: { test: "error" },
    // Chromatic captures every story once per mode: one per theme, through the same `theme`
    // global as the toolbar (theme.ts, preview-head.html). A few layout stories add a narrow
    // viewport mode of their own. Baselines are keyed to these names: renaming one starts a new
    // baseline.
    chromatic: {
      modes: {
        dark: { theme: "dark" },
        light: { theme: "light" },
      },
    },
    docs: {
      container: ThemedDocsContainer,
      ...(docsRenderer && { renderer: async () => docsRenderer }),
    },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Foundations",
          ["Color", "Typography", "Spacing", "Radius", "Elevation"],
          "Form components",
          "Patterns",
        ],
      },
    },
  },
};

// Storybook reads the preview from the default export (allowed exception, see main.ts).
export default preview;
