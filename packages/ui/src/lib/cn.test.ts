import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("should join class names and skip falsy values", () => {
    expect(cn("a", false, undefined, "b", null, "c")).toBe("a b c d");
  });

  it("should accept conditional objects and arrays", () => {
    expect(cn(["a", { b: true, c: false }])).toBe("a b");
  });

  it("should let the last conflicting Tailwind utility win", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });
});
