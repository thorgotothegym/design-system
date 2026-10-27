import {
  linearSrgbToRgb8,
  oklchToLinearSrgb,
  parseOklch,
} from "@aleixvidal/tokens/contrast";

const toHexPair = (channel: number): string =>
  channel.toString(16).padStart(2, "0");

/**
 * The `#rrggbb` a browser paints for an `oklch()` token value. Storybook's theme API manipulates
 * colors with a library that does not understand OKLCH, so theme variables need hex.
 */
export const toHex = (oklch: string): string => {
  const { r, g, b } = linearSrgbToRgb8(oklchToLinearSrgb(parseOklch(oklch)));
  return `#${toHexPair(r)}${toHexPair(g)}${toHexPair(b)}`;
};

/** `0.25rem` or `4px` to a number of pixels (1rem = 16px), for APIs that want a number. */
export const toPx = (length: string): number => {
  const match = /^(-?[\d.]+)(rem|px)?$/.exec(length);
  if (match === null) throw new Error(`Not a length: "${length}"`);
  const value = Number(match[1]);
  return match[2] === "rem" ? value * 16 : value;
};
