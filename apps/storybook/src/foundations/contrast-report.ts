import { themeValues } from "@aleixvidal/tokens";
import { checkContrast, pairs } from "@aleixvidal/tokens/contrast";
import type { PairResult } from "@aleixvidal/tokens/contrast";

/** Every declared pair in both themes, computed by the same code as the contrast gate. */
export const report = checkContrast(themeValues, pairs);

/**
 * What the pair is checked as. The same colors can be checked twice: `brand.primary` on
 * `bg.surface` is text (4.5:1, a link) and a non-text indicator (3:1, the selected day of a
 * calendar), so a row is identified by its theme, its colors and its minimum.
 */
export const roleOf = (min: PairResult["min"]): string => {
  if (min === 4.5) return "text";
  if (min === 3) return "non-text";
  return "decorative";
};

/** Unique and stable for a row: see `roleOf`. */
export const pairKey = (result: PairResult): string =>
  `${result.theme}:${result.fg}:${result.bg}:${result.min ?? "none"}`;
