import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Both pages are served from the same root, and `staticDirs` copies public/ there unchanged, so
// a preload and an @font-face only share one download when they resolve to the same URL.
const root = "https://storybook.test/";
const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const preloads = (html: string) =>
  [...html.matchAll(/<link\s[^>]*rel="preload"[^>]*>/g)].map(([tag]) => {
    const href = /href="([^"]+)"/.exec(tag)?.[1] ?? "";
    return { tag, url: new URL(href, root).href };
  });

const fontsCss = read("../public/fonts/fonts.css");
const faces = [...fontsCss.matchAll(/@font-face\s*{[^}]*}/g)].map(
  ([face]) => face,
);
const faceUrls = faces.flatMap((face) =>
  [...face.matchAll(/url\("([^"]+)"\)/g)].map(
    ([, src]) => new URL(src ?? "", new URL("fonts/fonts.css", root)).href,
  ),
);

describe.each(["preview-head.html", "manager-head.html"])("%s", (file) => {
  const links = preloads(read(`../.storybook/${file}`));

  it("should preload only files that an @font-face in fonts.css requests", () => {
    expect(links.map(({ url }) => url)).not.toEqual([]);

    for (const { url } of links) expect(faceUrls).toContain(url);
  });

  it("should mark every font preload as a crossorigin woff2", () => {
    for (const { tag } of links) {
      expect(tag).toMatch(/as="font"/);
      expect(tag).toMatch(/type="font\/woff2"/);
      expect(tag).toMatch(/\scrossorigin[\s/>]/);
    }
  });
});

describe("fonts.css", () => {
  it("should set font-display on every @font-face", () => {
    for (const face of faces) expect(face).toMatch(/font-display:\s*swap/);
  });

  it("should only request files that @fontsource/ibm-plex-mono ships", () => {
    for (const url of faceUrls) {
      const file = url.split("/").pop() ?? "";

      expect(
        existsSync(
          new URL(
            `../node_modules/@fontsource/ibm-plex-mono/files/${file}`,
            import.meta.url,
          ),
        ),
      ).toBe(true);
    }
  });
});
