import type { Rgb } from "./oklch.ts";

const linearize = (channel8: number): number => {
  const value = channel8 / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.x relative luminance of an 8-bit sRGB color. */
export const relativeLuminance = ({ r, g, b }: Rgb): number => {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

/** WCAG 2.x contrast ratio, always >= 1 regardless of argument order. */
export const contrastRatio = (first: Rgb, second: Rgb): number => {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
