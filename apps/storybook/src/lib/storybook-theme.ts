import { scaleValues, themeValues } from "@aleixvidal/tokens";
import type { Theme } from "@aleixvidal/tokens";
import { create } from "storybook/theming";
import { toHex, toPx } from "./css-values";

/**
 * A Storybook UI/docs theme built from the semantic tokens of one theme. Nothing is typed by
 * hand: every color is a token value converted to hex, the fonts and radius come from the scales.
 */
export const createStorybookTheme = (mode: Theme, brandTitle?: string) => {
  const colors = themeValues[mode];
  const hex = (token: keyof typeof colors) => toHex(colors[token]);

  return create({
    base: mode,
    brandTitle,
    brandUrl: "https://aleixvidal.dev",
    brandTarget: "_blank",

    colorPrimary: hex("brand.primary"),
    colorSecondary: hex("brand.primary"),

    appBg: hex("bg.base"),
    appContentBg: hex("bg.surface"),
    appPreviewBg: hex("bg.base"),
    appHoverBg: hex("bg.subtle"),
    appBorderColor: hex("border.decorative"),
    appBorderRadius: toPx(scaleValues.radius.lg),

    fontBase: scaleValues.font.mono,
    fontCode: scaleValues.font.mono,

    textColor: hex("text.default"),
    textInverseColor: hex("text.on-primary"),
    textMutedColor: hex("text.muted"),

    barTextColor: hex("text.muted"),
    barHoverColor: hex("brand.primary"),
    barSelectedColor: hex("brand.primary"),
    barBg: hex("bg.surface"),

    buttonBg: hex("bg.input"),
    buttonBorder: hex("border.control"),
    booleanBg: hex("bg.input"),
    booleanSelectedBg: hex("brand.primary"),

    inputBg: hex("bg.input"),
    inputBorder: hex("border.control"),
    inputTextColor: hex("text.default"),
    inputBorderRadius: toPx(scaleValues.radius.lg),
  });
};
