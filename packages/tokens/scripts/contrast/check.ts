import {
  isInSrgbGamut,
  linearSrgbToRgb8,
  oklchToLinearSrgb,
  parseOklch,
} from "./oklch.ts";
import type { Rgb } from "./oklch.ts";
import type { Pair } from "./pairs.ts";
import { contrastRatio } from "./wcag.ts";

export type ThemeValues = Record<string, Record<string, string>>;

export type PairResult = {
  theme: string;
  fg: string;
  bg: string;
  ratio: number;
  min: number | null;
  passed: boolean;
  source: Pair["source"];
};

export type Report = {
  results: PairResult[];
  /** Everything that makes the gate fail other than a low ratio. */
  problems: string[];
  ok: boolean;
};

type Resolved = { rgb: Rgb; inGamut: boolean };

const resolve = (value: string): Resolved => {
  const linear = oklchToLinearSrgb(parseOklch(value));
  return { rgb: linearSrgbToRgb8(linear), inGamut: isInSrgbGamut(linear) };
};

/**
 * Checks every declared pair in every theme. Fails on: a ratio below its minimum, a color
 * outside sRGB, a pair that names a token a theme does not define, and a semantic token that
 * no pair mentions (so a new color cannot skip the check).
 */
export const checkContrast = (
  values: ThemeValues,
  pairs: readonly Pair[],
): Report => {
  const results: PairResult[] = [];
  const problems: string[] = [];

  for (const [theme, tokens] of Object.entries(values)) {
    const resolved = new Map<string, Resolved>();
    for (const [name, value] of Object.entries(tokens)) {
      const color = resolve(value);
      resolved.set(name, color);
      if (!color.inGamut)
        problems.push(`${theme}: ${name} (${value}) is outside sRGB`);
    }

    const covered = new Set<string>();
    for (const pair of pairs.filter((candidate) =>
      candidate.themes.some((name) => name === theme),
    )) {
      const fg = resolved.get(pair.fg);
      const bg = resolved.get(pair.bg);
      if (fg === undefined || bg === undefined) {
        problems.push(
          `${theme}: pair ${pair.fg} on ${pair.bg} names a token that does not exist`,
        );
        continue;
      }
      covered.add(pair.fg).add(pair.bg);
      const ratio = contrastRatio(fg.rgb, bg.rgb);
      results.push({
        theme,
        fg: pair.fg,
        bg: pair.bg,
        ratio,
        min: pair.min,
        passed: pair.min === null || ratio >= pair.min,
        source: pair.source,
      });
    }

    for (const name of Object.keys(tokens)) {
      if (!covered.has(name)) {
        problems.push(
          `${theme}: ${name} has no declared contrast pair (add one in pairs.ts)`,
        );
      }
    }
  }

  return {
    results,
    problems,
    ok: problems.length === 0 && results.every((r) => r.passed),
  };
};

export const formatReport = (report: Report): string => {
  const rows = report.results.map((r) => [
    r.theme,
    `${r.fg} on ${r.bg}`,
    `${r.ratio.toFixed(2)}:1`,
    r.min === null ? "decorative" : `min ${r.min}:1`,
    r.min === null ? "info" : r.passed ? "PASS" : "FAIL",
    r.source,
  ]);
  const widths = [0, 1, 2, 3, 4, 5].map((i) =>
    Math.max(...rows.map((row) => row[i]?.length ?? 0)),
  );
  const lines = rows.map((row) =>
    row.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  "),
  );
  for (const problem of report.problems) lines.push(`PROBLEM  ${problem}`);
  lines.push(report.ok ? "Contrast gate: OK" : "Contrast gate: FAILED");
  return lines.join("\n");
};
