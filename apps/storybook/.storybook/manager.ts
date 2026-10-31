import { addons } from "storybook/manager-api";
import { createStorybookTheme } from "../src/lib/storybook-theme";
import { SITE, SITE_TITLE } from "../src/site";

// The manager (sidebar, toolbar, panels) is always dark, built from the dark tokens
// (DESIGN.md section 6). The toolbar theme switch changes the canvas and the docs pages.
addons.setConfig({
  theme: createStorybookTheme(
    "dark",
    `${SITE.name}<span class="ds-cursor">_</span>`,
  ),
});

/**
 * Storybook 10 writes the tab title as "<page> ⋅ Storybook" on every navigation, with no option
 * to change the suffix, so it is replaced here as soon as it is written: "Introduction - Docs ⋅
 * Console Forms - by Aleix Vidal".
 */
const brandTabTitle = () => {
  const branded = document.title
    .replace(/ ⋅ Storybook$/, ` ⋅ ${SITE_TITLE}`)
    .replace(/^Storybook$/, SITE_TITLE);
  if (branded !== document.title) document.title = branded;
};

brandTabTitle();
new MutationObserver(brandTabTitle).observe(document.head, {
  subtree: true,
  childList: true,
  characterData: true,
});
