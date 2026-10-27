import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "./wcag.ts";

const grey = (value: number) => ({ r: value, g: value, b: value });
const white = grey(255);
const black = grey(0);

describe("relativeLuminance", () => {
  it("should be 1 for white and 0 for black", () => {
    expect(relativeLuminance(white)).toBeCloseTo(1, 10);
    expect(relativeLuminance(black)).toBe(0);
  });

  it("should weight the channels as WCAG 2.x defines", () => {
    expect(relativeLuminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 10);
    expect(relativeLuminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(0.7152, 10);
    expect(relativeLuminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(0.0722, 10);
  });
});

describe("contrastRatio (WCAG 2.x reference values)", () => {
  it("should be 21:1 for black on white and 1:1 for identical colors", () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 10);
    expect(contrastRatio(white, white)).toBe(1);
  });

  it("should be independent of argument order", () => {
    expect(contrastRatio(grey(0x76), white)).toBe(
      contrastRatio(white, grey(0x76)),
    );
  });

  it("should match the well-known #767676 (4.54:1, passes AA) and #777777 (4.48:1, fails AA) on white", () => {
    expect(contrastRatio(grey(0x76), white)).toBeCloseTo(4.54, 2);
    expect(contrastRatio(grey(0x77), white)).toBeCloseTo(4.48, 2);
  });
});
