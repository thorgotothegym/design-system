// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { scaleValues } from "@aleixvidal/tokens";
import { describe, expect, it } from "vitest";
import { findOffScaleSpacing } from "./spacing-scale";

const steps = Object.keys(scaleValues.space);

describe("findOffScaleSpacing", () => {
  it.each([
    "pl-7",
    "w-11",
    "p-0.5",
    "size-4.5",
    "gap-x-13",
    "max-h-64",
    "-mt-7",
    "md:p-7",
    "hover:not-data-disabled:w-11",
    "data-[state=checked]:translate-x-7",
    "!pl-13",
    "p-[7px]",
    "w-[44px]",
    "gap-[0.5rem]",
    "min-h-[calc(100%-4px)]",
  ])("should report %s as off the scale", (name) => {
    expect(findOffScaleSpacing(`<div className="${name}" />`, steps)).toEqual([
      name,
    ]);
  });

  it.each([
    "p-4",
    "pl-8",
    "gap-2",
    "gap-x-2",
    "size-5",
    "h-24",
    "m-0",
    "-mt-4",
    "md:p-4",
    "data-[state=checked]:translate-x-6",
    "p-px",
    "h-px",
    "w-full",
    "w-1/2",
    "mx-auto",
    "min-h-(--ds-text-sm-line-height)",
    "grid-cols-[auto_1fr]",
    "max-h-[10lh]",
    "w-[calc(100%-var(--ds-space-4))]",
    "text-sm",
    "font-medium",
    "outline-2",
    "outline-offset-2",
    "border-2",
    "col-start-2",
    "translate-x-[50%]",
  ])("should allow %s", (name) => {
    expect(findOffScaleSpacing(`<div className="${name}" />`, steps)).toEqual(
      [],
    );
  });

  it("should report each offender once, among valid classes", () => {
    const source = 'cn("flex gap-2 pl-7", cond && "pl-7 p-4", `w-11`)';

    expect(findOffScaleSpacing(source, steps)).toEqual(["pl-7", "w-11"]);
  });
});

const SOURCE_FILE = /\.(tsx?|mdx|css)$/;
const roots = [
  fileURLToPath(new URL("..", import.meta.url)),
  fileURLToPath(new URL("../../../../apps/storybook/src", import.meta.url)),
  fileURLToPath(
    new URL("../../../../apps/storybook/.storybook", import.meta.url),
  ),
];
const thisFolder = fileURLToPath(new URL(".", import.meta.url));

describe("spacing scale in the sources", () => {
  it("should only use the declared spacing steps in packages/ui and apps/storybook", () => {
    const offenders: string[] = [];

    for (const root of roots) {
      for (const entry of readdirSync(root, { recursive: true })) {
        const path = join(root, String(entry));
        // This folder holds the examples of offenders for the tests above.
        if (!SOURCE_FILE.test(path) || path.startsWith(thisFolder)) continue;
        for (const name of findOffScaleSpacing(
          readFileSync(path, "utf8"),
          steps,
        )) {
          offenders.push(`${path}: ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
