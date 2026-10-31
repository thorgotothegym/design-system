import { themes } from "@aleixvidal/tokens";
import { describe, expect, it } from "vitest";
import { pairKey, report, roleOf } from "./contrast-report";

describe("pairKey", () => {
  it("should give every row of the contrast table its own key", () => {
    const keys = report.results.map(pairKey);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("should keep apart the same colors checked as text and as an indicator", () => {
    const rows = report.results.filter(
      (result) =>
        result.theme === "dark" &&
        result.fg === "brand.primary" &&
        result.bg === "bg.surface",
    );

    expect(rows.map((row) => roleOf(row.min)).sort()).toEqual([
      "non-text",
      "text",
    ]);
    expect(new Set(rows.map(pairKey)).size).toBe(2);
  });

  it("should have rows for both themes", () => {
    for (const theme of themes) {
      expect(
        report.results.filter((result) => result.theme === theme).length,
      ).toBeGreaterThan(0);
    }
  });
});
