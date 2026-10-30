// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findOutlineRemoval } from "./outline-removal";

describe("findOutlineRemoval", () => {
  it.each([
    "outline-hidden",
    "outline-none",
    "focus:outline-none",
    "focus-visible:outline-hidden",
    "data-[state=open]:outline-none",
    "has-[input:focus-visible]:outline-hidden",
    "!outline-none",
    "outline-hidden!",
  ])("should report %s", (name) => {
    expect(findOutlineRemoval(`<div className="${name}" />`)).toEqual([name]);
  });

  it.each([
    "outline",
    "outline-2",
    "outline-solid",
    "outline-transparent",
    "outline-offset-2",
    "-outline-offset-2",
    "outline-focus-ring",
    "focus-visible:outline-solid",
    "outline-hidden-x",
    "my-outline-none",
  ])("should allow %s", (name) => {
    expect(findOutlineRemoval(`<div className="${name}" />`)).toEqual([]);
  });

  it("should report each offender once, among valid classes", () => {
    const source =
      'cn("flex outline-none", cond && "outline-none p-4", `focus:outline-hidden`)';

    expect(findOutlineRemoval(source)).toEqual([
      "outline-none",
      "focus:outline-hidden",
    ]);
  });
});

const SOURCE_FILE = /\.(tsx?|mdx|css|tpl)$/;
const roots = [
  fileURLToPath(new URL("..", import.meta.url)),
  fileURLToPath(new URL("../../../../apps/storybook/src", import.meta.url)),
  fileURLToPath(
    new URL("../../../../apps/storybook/.storybook", import.meta.url),
  ),
  fileURLToPath(
    new URL(
      "../../../../.claude/skills/scaffold-component/templates",
      import.meta.url,
    ),
  ),
];
const thisFolder = fileURLToPath(new URL(".", import.meta.url));

describe("outline removal in the sources", () => {
  it("should not use outline-hidden or outline-none in packages/ui, apps/storybook or the scaffold templates", () => {
    const offenders: string[] = [];

    for (const root of roots) {
      for (const entry of readdirSync(root, { recursive: true })) {
        const path = join(root, String(entry));
        // This folder holds the examples of offenders for the tests above.
        if (!SOURCE_FILE.test(path) || path.startsWith(thisFolder)) continue;
        for (const name of findOutlineRemoval(readFileSync(path, "utf8"))) {
          offenders.push(`${path}: ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
