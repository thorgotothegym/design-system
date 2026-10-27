import { describe, expect, it } from "vitest";
import { toHex, toPx } from "./css-values";

describe("toHex", () => {
  it("should convert white and black", () => {
    expect(toHex("oklch(1 0 0)")).toBe("#ffffff");
    expect(toHex("oklch(0 0 0)")).toBe("#000000");
  });

  it("should convert neutral mid grey to #636363", () => {
    expect(toHex("oklch(0.5 0 0)")).toBe("#636363");
  });

  it("should pad single-digit channels", () => {
    expect(toHex("oklch(0.08 0 0)")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("should reject values that are not oklch()", () => {
    expect(() => toHex("#ffffff")).toThrow();
  });
});

describe("toPx", () => {
  it("should convert rem at 16px", () => {
    expect(toPx("0.25rem")).toBe(4);
    expect(toPx("1rem")).toBe(16);
  });

  it("should keep pixel values and unitless zero", () => {
    expect(toPx("2px")).toBe(2);
    expect(toPx("0")).toBe(0);
  });

  it("should reject anything that is not a length", () => {
    expect(() => toPx("calc(1rem + 2px)")).toThrow();
  });
});
