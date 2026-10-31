/**
 * Generates the site's favicon (public/favicon.svg) and Open Graph image (public/og-image.png,
 * 1200 × 630) from the name constants (src/site.ts) and the dark theme tokens. Both files are
 * committed; run this again after renaming the site or changing a token:
 *
 *   pnpm --filter @aleixvidal/storybook brand-assets
 *
 * The image is an HTML page in the terminal style of DESIGN.md, rendered by Playwright's Chromium
 * (already a dev dependency here, for the Storybook tests) with the self-hosted IBM Plex Mono.
 * It is not part of the build, so deploying needs no browser.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { themeValues } from "@aleixvidal/tokens";
import { chromium } from "playwright";
import { toHex } from "../src/lib/css-values.ts";
import { OG_IMAGE, SITE } from "../src/site.ts";

const publicDir = new URL("../public/", import.meta.url);
const fontsDir = new URL("../public/fonts/files/", import.meta.url);
const colors = themeValues.dark;
const hex = (token: keyof typeof colors) => toHex(colors[token]);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** A prompt chevron and a cursor: ">_" in the brand green on the page background. */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="${hex("bg.base")}"/>
  <path d="M7 9.5 13.5 16 7 22.5" fill="none" stroke="${hex("brand.primary")}" stroke-width="3.5" stroke-linecap="square"/>
  <rect x="16" y="20" width="10" height="3.5" fill="${hex("brand.primary")}"/>
</svg>
`;

const fontFace = (weight: number) => `@font-face {
  font-family: "IBM Plex Mono";
  font-weight: ${weight};
  src: url("${new URL(`ibm-plex-mono-latin-${weight}-normal.woff2`, fontsDir).href}") format("woff2");
}`;

const ogPage = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
${[400, 500, 700].map(fontFace).join("\n")}
* { box-sizing: border-box; margin: 0; }
body {
  width: ${OG_IMAGE.width}px; height: ${OG_IMAGE.height}px; padding: 56px 64px;
  background: ${hex("bg.base")}; color: ${hex("text.default")};
  font-family: "IBM Plex Mono", monospace; display: flex; flex-direction: column;
  border: 2px solid ${hex("border.decorative")};
}
.prompt { font-size: 26px; color: ${hex("text.muted")}; }
.prompt b { color: ${hex("brand.primary")}; font-weight: 500; }
.main { flex: 1; display: flex; align-items: center; gap: 56px; }
.text { flex: 1; display: flex; flex-direction: column; gap: 20px; }
h1 { font-size: 92px; line-height: 1; font-weight: 700; color: ${hex("brand.primary")}; letter-spacing: -2px; }
.cursor { display: inline-block; width: 0.55em; height: 0.12em; margin-left: 6px; background: ${hex("brand.primary")}; }
.tagline { font-size: 38px; font-weight: 500; }
.byline { font-size: 28px; color: ${hex("text.muted")}; }
.form { width: 400px; display: flex; flex-direction: column; gap: 12px; }
.label { font-size: 22px; font-weight: 500; }
.label i { color: ${hex("text.danger")}; font-style: normal; }
.input {
  height: 60px; padding: 0 18px; display: flex; align-items: center; font-size: 24px;
  background: ${hex("bg.input")}; border: 2px solid ${hex("border.control")}; border-radius: 6px;
  outline: 3px solid ${hex("focus.ring")}; outline-offset: 4px;
}
.caret { width: 2px; height: 30px; margin-left: 2px; background: ${hex("text.default")}; }
.hint { font-size: 18px; color: ${hex("text.muted")}; }
.check { margin-top: 18px; display: flex; align-items: center; gap: 14px; font-size: 22px; }
.box {
  width: 28px; height: 28px; border-radius: 6px; background: ${hex("brand.primary")};
  display: flex; align-items: center; justify-content: center;
}
.footer { display: flex; justify-content: space-between; font-size: 22px; color: ${hex("text.muted")}; }
</style>
</head>
<body>
  <p class="prompt"><b>$</b> open ${escapeHtml(SITE.url.replace("https://", ""))}</p>
  <div class="main">
    <div class="text">
      <h1>${escapeHtml(SITE.name)}<span class="cursor"></span></h1>
      <p class="tagline">${escapeHtml(SITE.tagline)}</p>
      <p class="byline">${escapeHtml(SITE.byline)}</p>
    </div>
    <div class="form" aria-hidden="true">
      <p class="label">Email <i>*</i></p>
      <div class="input">ada@example.com<span class="caret"></span></div>
      <p class="hint">Labelled, described and validated.</p>
      <div class="check">
        <span class="box">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke="${hex("text.on-primary")}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        Keyboard first
      </div>
    </div>
  </div>
  <p class="footer"><span>React · Radix · React Aria · Storybook</span><span>Light and dark themes</span></p>
</body>
</html>
`;

writeFileSync(new URL("favicon.svg", publicDir), favicon);

const workDir = mkdtempSync(join(tmpdir(), "brand-assets-"));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
  const htmlPath = join(workDir, "og.html");
  writeFileSync(htmlPath, ogPage);
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() =>
    [400, 500, 700].filter(
      (weight) => !document.fonts.check(`${weight} 16px "IBM Plex Mono"`),
    ),
  );
  if (missing.length > 0) {
    throw new Error(
      `IBM Plex Mono ${missing.join(", ")} did not load: run scripts/copy-fonts.ts first`,
    );
  }
  await page.screenshot({ path: new URL("og-image.png", publicDir).pathname });
} finally {
  await browser.close();
  rmSync(workDir, { recursive: true, force: true });
}

console.log("Wrote public/favicon.svg and public/og-image.png");
