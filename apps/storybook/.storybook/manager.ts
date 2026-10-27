import { addons } from "storybook/manager-api";
import { createStorybookTheme } from "../src/lib/storybook-theme";

// The manager (sidebar, toolbar, panels) is always dark, built from the dark tokens
// (DESIGN.md section 6). The toolbar theme switch changes the canvas and the docs pages.
addons.setConfig({
  theme: createStorybookTheme(
    "dark",
    'design-system<span class="ds-cursor">_</span>',
  ),
});
