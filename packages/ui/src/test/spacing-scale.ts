/**
 * Finds Tailwind spacing classes that are not on the token scale.
 *
 * The Tailwind theme only defines the declared spacing steps, so `pl-7` or `w-11` is not an error
 * to Tailwind: it silently generates no style. This check is what turns that into a failure.
 */

/** Utilities whose number is a spacing step. */
const SPACING_UTILITIES = [
  "p",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "ps",
  "pe",
  "m",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "ms",
  "me",
  "gap",
  "gap-x",
  "gap-y",
  "space-x",
  "space-y",
  "size",
  "w",
  "h",
  "min-w",
  "min-h",
  "max-w",
  "max-h",
  "inset",
  "inset-x",
  "inset-y",
  "top",
  "right",
  "bottom",
  "left",
  "start",
  "end",
  "translate-x",
  "translate-y",
  "basis",
  "indent",
];

// Longest names first, so `gap-x` is not read as `gap` with the value `x-13`.
const UTILITY = new RegExp(
  `^(${[...SPACING_UTILITIES].sort((a, b) => b.length - a.length).join("|")})-(.+)$`,
);
const NUMBER = /^\d+(\.\d+)?$/;
/** A fixed length in an arbitrary value: `[7px]`, `[0.5rem]`, `[calc(100%-4px)]`. */
const FIXED_LENGTH = /-?\d*\.?\d+(px|rem|em)\b/;

/** Removes the variants (`md:`, `data-[state=checked]:`) and the important and negative marks. */
const withoutVariants = (token: string): string => {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < token.length; index += 1) {
    const character = token[index];
    if (character === "[" || character === "(") depth += 1;
    else if (character === "]" || character === ")") depth -= 1;
    else if (character === ":" && depth === 0) start = index + 1;
  }
  return token.slice(start).replace(/^!/, "").replace(/^-/, "");
};

const isOffScale = (token: string, steps: readonly string[]): boolean => {
  const match = UTILITY.exec(withoutVariants(token));
  const value = match?.[2];
  if (value === undefined) return false;
  if (NUMBER.test(value)) return !steps.includes(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    return FIXED_LENGTH.test(value);
  }
  // `px`, `full`, `auto`, `1/2`, `(--var)` and the like are not spacing steps.
  return false;
};

/** The classes in `source` that use a spacing value outside `steps`. */
export const findOffScaleSpacing = (
  source: string,
  steps: readonly string[],
): string[] => {
  const tokens = source
    .split(/[\s"'`,{}]+/)
    .map((token) => token.replace(/[.;)]+$/, ""))
    .filter((token) => token !== "");

  return [...new Set(tokens.filter((token) => isOffScale(token, steps)))];
};
