/**
 * Fails when a scaffold placeholder is still in the code or in a changeset. Run by hand with
 * `pnpm check:placeholders`; it is not part of `pnpm test`, so a freshly scaffolded component
 * still builds while it is being finished.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const MARKER = "SCAFFOLD-PLACEHOLDER";
const ROOT = new URL("../", import.meta.url).pathname;
const FOLDERS = ["packages/ui/src", ".changeset"];
/** The `subpath` variant also leaves a marker in the README paragraph about its entry point. */
const FILES = ["packages/ui/README.md"];

const listFiles = (folder: string): string[] =>
  readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(folder, entry.name))
      : [join(folder, entry.name)],
  );

const found = [
  ...FOLDERS.flatMap((folder) => listFiles(join(ROOT, folder))),
  ...FILES.map((file) => join(ROOT, file)),
]
  .map((file) => ({
    file: relative(ROOT, file),
    lines: readFileSync(file, "utf8")
      .split("\n")
      .flatMap((text, index) => (text.includes(MARKER) ? [index + 1] : [])),
  }))
  .filter(({ lines }) => lines.length > 0);

if (found.length > 0) {
  console.error(
    `${MARKER} is still present. Replace each one with real content (see .claude/skills/scaffold-component/SKILL.md):\n`,
  );
  for (const { file, lines } of found) {
    console.error(`  ${file}:${lines.join(", ")}`);
  }
  process.exit(1);
}

console.log(`No ${MARKER} left in ${[...FOLDERS, ...FILES].join(", ")}.`);
