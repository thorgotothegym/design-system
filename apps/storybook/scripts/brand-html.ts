/**
 * Runs after `storybook build`. Storybook writes the manager's `<title>` as "<name> - Storybook"
 * and the preview's as "Storybook", with no option to change them, and that HTML is what link
 * previews and crawlers that do not run JavaScript read. This sets both to the site title from
 * src/site.ts. In the running manager, manager.ts keeps the tab title branded.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { SITE, SITE_TITLE } from "../src/site.ts";

const outputDir = new URL("../storybook-static/", import.meta.url);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

for (const file of ["index.html", "iframe.html"]) {
  const path = new URL(file, outputDir);
  const html = readFileSync(path, "utf8");
  if (!/<title>[^<]*<\/title>/.test(html)) {
    throw new Error(`brand-html: no <title> in storybook-static/${file}`);
  }
  writeFileSync(
    path,
    html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(SITE_TITLE)}</title>`,
    ),
  );
}

// The canonical address comes from managerHead (.storybook/main.ts); fail loudly if it is gone.
if (
  !readFileSync(new URL("index.html", outputDir), "utf8").includes(SITE.url)
) {
  throw new Error(
    "brand-html: the canonical and social tags are missing from index.html",
  );
}

console.log(`Set the page title to "${SITE_TITLE}"`);
