import type { ColorToken, Theme } from "../../src/generated/tokens.ts";

export type Pair = {
  /** Foreground token (text, border or ring). */
  fg: ColorToken;
  /** Background it is drawn on. */
  bg: ColorToken;
  /** Minimum WCAG 2.x ratio, or `null` for decoration, which has no minimum. */
  min: 4.5 | 3 | null;
  /** Themes the pair applies to. */
  themes: readonly Theme[];
  /** Where the pair comes from. */
  source: "DESIGN.md" | "derived";
};

const both = ["dark", "light"] as const;

/** Text, and links (`brand.primary`): WCAG AA for normal text. */
const text = (
  fg: ColorToken,
  bg: ColorToken,
  themes: readonly Theme[] = both,
  source: Pair["source"] = "derived",
): Pair => ({ fg, bg, min: 4.5, themes, source });

/** Control boundaries and the focus ring: WCAG 1.4.11 non-text contrast. */
const control = (
  fg: ColorToken,
  bg: ColorToken,
  themes: readonly Theme[] = both,
  source: Pair["source"] = "derived",
): Pair => ({ fg, bg, min: 3, themes, source });

/** Reported but never failed: decoration has no contrast minimum. */
const decorative = (
  fg: ColorToken,
  bg: ColorToken,
  themes: readonly Theme[] = both,
  source: Pair["source"] = "derived",
): Pair => ({ fg, bg, min: null, themes, source });

/**
 * Every foreground/background pair that is checked.
 *
 * `DESIGN.md` pairs are declared in sections 2.1 and 2.2. `derived` pairs apply the same rules
 * to backgrounds DESIGN.md does not pair explicitly, so that every background token is
 * exercised by every text color that can appear on it.
 *
 * Adding a semantic color token makes the gate fail until it appears here, as `fg` or `bg`.
 */
export const pairs: readonly Pair[] = [
  text("text.default", "bg.base", both, "DESIGN.md"),
  text("text.muted", "bg.base", both, "DESIGN.md"),
  text("text.placeholder", "bg.input", both, "DESIGN.md"),
  text("brand.primary", "bg.base", both, "DESIGN.md"),
  text("text.on-primary", "brand.primary", both, "DESIGN.md"),
  text("text.danger", "bg.base", both, "DESIGN.md"),
  text("text.default", "bg.subtle", ["light"], "DESIGN.md"),
  text("text.muted", "bg.subtle", ["light"], "DESIGN.md"),
  control("border.control", "bg.base", both, "DESIGN.md"),
  control("border.control", "bg.input", ["dark"], "DESIGN.md"),
  control("focus.ring", "bg.base", both, "DESIGN.md"),
  control("focus.ring", "bg.input", ["light"], "DESIGN.md"),
  decorative("border.decorative", "bg.base", both, "DESIGN.md"),

  // text.default and text.muted on the backgrounds DESIGN.md leaves unpaired.
  text("text.default", "bg.surface"),
  text("text.muted", "bg.surface"),
  text("text.default", "bg.subtle", ["dark"]),
  text("text.muted", "bg.subtle", ["dark"]),
  text("text.default", "bg.input"),
  text("text.muted", "bg.input"),

  // Danger, primary and placeholder text against every background.
  text("text.danger", "bg.surface"),
  text("text.danger", "bg.subtle"),
  text("text.danger", "bg.input"),
  text("brand.primary", "bg.surface"),
  text("brand.primary", "bg.subtle"),
  text("brand.primary", "bg.input"),
  text("text.placeholder", "bg.base"),
  text("text.placeholder", "bg.surface"),
  text("text.placeholder", "bg.subtle"),

  control("border.control", "bg.input", ["light"]),
  control("focus.ring", "bg.input", ["dark"]),
  decorative("bg.subtle", "bg.base", ["light"]),
];
