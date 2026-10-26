import { describe, expect, it } from "vitest";
import {
  isInSrgbGamut,
  linearSrgbToRgb8,
  oklchToLinearSrgb,
  parseOklch,
} from "./oklch.ts";

const toRgb8 = (source: string) =>
  linearSrgbToRgb8(oklchToLinearSrgb(parseOklch(source)));

/** Allows the +/-1 per channel that rounding the published reference values can cause. */
function expectRgbClose(
  actual: { r: number; g: number; b: number },
  r: number,
  g: number,
  b: number,
) {
  expect(Math.abs(actual.r - r)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.g - g)).toBeLessThanOrEqual(1);
  expect(Math.abs(actual.b - b)).toBeLessThanOrEqual(1);
}

describe("parseOklch", () => {
  it("reads plain numbers", () => {
    expect(parseOklch("oklch(0.75 0.15 145)")).toEqual({
      l: 0.75,
      c: 0.15,
      h: 145,
    });
    expect(parseOklch("oklch(1 0 0)")).toEqual({ l: 1, c: 0, h: 0 });
  });

  it.each([
    "oklch(0.5 0.1 145 / 0.5)",
    "oklch(50% 0.1 145)",
    "#ffffff",
    "oklch(0.5 0.1 145deg)",
  ])("rejects %s instead of guessing", (source) => {
    expect(() => parseOklch(source)).toThrow();
  });
});

describe("OKLCH to sRGB (CSS Color 4 reference values)", () => {
  it("maps white and black", () => {
    expect(toRgb8("oklch(1 0 0)")).toEqual({ r: 255, g: 255, b: 255 });
    expect(toRgb8("oklch(0 0 0)")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("maps neutral mid grey to #636363", () => {
    expect(toRgb8("oklch(0.5 0 0)")).toEqual({ r: 99, g: 99, b: 99 });
  });

  it("maps the sRGB primaries", () => {
    expectRgbClose(
      toRgb8("oklch(0.6279553606 0.2576833077 29.2338851923)"),
      255,
      0,
      0,
    );
    expectRgbClose(
      toRgb8("oklch(0.8664396115 0.2948272403 142.4953450414)"),
      0,
      255,
      0,
    );
    expectRgbClose(
      toRgb8("oklch(0.4520137184 0.3131362577 264.0520206)"),
      0,
      0,
      255,
    );
  });
});

describe("isInSrgbGamut", () => {
  it("accepts colors inside sRGB, including the primaries on the boundary", () => {
    expect(
      isInSrgbGamut(oklchToLinearSrgb(parseOklch("oklch(0.75 0.15 145)"))),
    ).toBe(true);
    expect(
      isInSrgbGamut(
        oklchToLinearSrgb(
          parseOklch("oklch(0.6279553606 0.2576833077 29.2338851923)"),
        ),
      ),
    ).toBe(true);
  });

  it("rejects the personal site's old danger color, which DESIGN.md says is outside sRGB", () => {
    expect(
      isInSrgbGamut(oklchToLinearSrgb(parseOklch("oklch(0.577 0.245 27.325)"))),
    ).toBe(false);
  });

  it("rejects an impossible chroma", () => {
    expect(
      isInSrgbGamut(oklchToLinearSrgb(parseOklch("oklch(0.7 0.4 145)"))),
    ).toBe(false);
  });
});
