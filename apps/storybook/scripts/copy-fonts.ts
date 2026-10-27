import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Only the latin subset of the three weights the tokens use (400, 500, 700). The package ships
// every subset, weight and italic (about 240 files); copying all of them would bloat the site.
const weights = [400, 500, 700];

const source = join(
  import.meta.dirname,
  "../node_modules/@fontsource/ibm-plex-mono/files",
);
const target = join(import.meta.dirname, "../public/fonts/files");

mkdirSync(target, { recursive: true });

for (const weight of weights) {
  const file = `ibm-plex-mono-latin-${weight}-normal.woff2`;
  cpSync(join(source, file), join(target, file));
}
