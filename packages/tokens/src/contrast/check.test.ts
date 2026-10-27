import { describe, expect, it } from "vitest";
import { themeValues } from "../generated/tokens.ts";
import { checkContrast, formatReport } from "./check.ts";
import type { ThemeValues } from "./check.ts";
import { pairs } from "./pairs.ts";
import type { Pair } from "./pairs.ts";

const values: ThemeValues = {
  light: { "bg.base": "oklch(1 0 0)", "text.default": "oklch(0.2 0 0)" },
};
const textOnBase: Pair = {
  fg: "text.default",
  bg: "bg.base",
  min: 4.5,
  themes: ["light"],
  source: "DESIGN.md",
};

describe("checkContrast", () => {
  it("should pass when every token is paired and every ratio meets its minimum", () => {
    const report = checkContrast(values, [textOnBase]);
    expect(report.ok).toBe(true);
    expect(report.results[0]?.ratio).toBeGreaterThan(4.5);
  });

  it("should fail a pair below its minimum", () => {
    const low = {
      light: { "bg.base": "oklch(1 0 0)", "text.default": "oklch(0.8 0 0)" },
    };
    const report = checkContrast(low, [textOnBase]);
    expect(report.ok).toBe(false);
    expect(report.results[0]?.passed).toBe(false);
    expect(formatReport(report)).toContain("FAIL");
  });

  it("should fail when a semantic color is added without a declared pair", () => {
    const withNew = {
      light: {
        "bg.base": "oklch(1 0 0)",
        "text.default": "oklch(0.2 0 0)",
        "text.new-token": "oklch(0.3 0 0)",
      },
    };
    const report = checkContrast(withNew, [textOnBase]);
    expect(report.ok).toBe(false);
    expect(report.problems).toEqual([
      "light: text.new-token has no declared contrast pair (add one in pairs.ts)",
    ]);
  });

  it("should fail on a color outside sRGB", () => {
    const outside = {
      light: {
        "bg.base": "oklch(1 0 0)",
        "text.default": "oklch(0.577 0.245 27.325)",
      },
    };
    const report = checkContrast(outside, [textOnBase]);
    expect(report.ok).toBe(false);
    expect(report.problems.join("\n")).toContain("outside sRGB");
  });

  it("should fail when a pair names a token the theme does not define", () => {
    const report = checkContrast({ light: { "bg.base": "oklch(1 0 0)" } }, [
      textOnBase,
    ]);
    expect(report.ok).toBe(false);
    expect(report.problems.join("\n")).toContain("does not exist");
  });

  it("should apply a pair only to the themes it lists", () => {
    const report = checkContrast(
      { dark: { "bg.base": "oklch(1 0 0)", "text.default": "oklch(0.2 0 0)" } },
      [textOnBase],
    );
    expect(report.results).toEqual([]);
    expect(report.ok).toBe(false);
  });

  it("should not hold decorative pairs to a minimum", () => {
    const decorative: Pair = { ...textOnBase, min: null };
    const faint = {
      light: { "bg.base": "oklch(1 0 0)", "text.default": "oklch(0.95 0 0)" },
    };
    expect(checkContrast(faint, [decorative]).ok).toBe(true);
  });
});

describe("the real tokens", () => {
  const report = checkContrast(themeValues, pairs);

  it("should pass every declared pair and cover every semantic color in both themes", () => {
    expect(report.problems).toEqual([]);
    expect(report.results.filter((result) => !result.passed)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("should check each theme", () => {
    expect(new Set(report.results.map((result) => result.theme))).toEqual(
      new Set(["dark", "light"]),
    );
  });
});
