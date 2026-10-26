import StyleDictionary from "style-dictionary";
import { cssFormat, tailwindFormat, tsFormat } from "./formats.ts";

const styleDictionary = new StyleDictionary({
  source: ["tokens/*.json"],
  log: { verbosity: "silent", warnings: "error" },
  hooks: {
    formats: {
      "ds/css": cssFormat,
      "ds/tailwind": tailwindFormat,
      "ds/ts": tsFormat,
    },
  },
  platforms: {
    css: {
      // Full-path names keep dark and light tokens from being reported as collisions.
      transforms: ["name/kebab"],
      buildPath: "generated/",
      files: [
        { destination: "tokens.css", format: "ds/css" },
        { destination: "tailwind.css", format: "ds/tailwind" },
      ],
    },
    ts: {
      transforms: ["name/kebab"],
      buildPath: "src/generated/",
      files: [{ destination: "tokens.ts", format: "ds/ts" }],
    },
  },
});

await styleDictionary.buildAllPlatforms();
