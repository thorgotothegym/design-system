import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import { configure } from "storybook/test";
import "./preview.css";
import { ThemedDocsContainer } from "./themed-docs-container";

// The same convention as the unit tests (packages/ui/src/test/setup.ts): `getByTestId` reads the
// permanent `data-slot` hook, since component roots have no accessible role.
configure({ testIdAttribute: "data-slot" });

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
    docs: { container: ThemedDocsContainer },
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
