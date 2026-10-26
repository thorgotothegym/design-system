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

const TEXT = 4.5;
const CONTROL = 3;

/**
 * Every foreground/background pair that is checked.
 *
 * `DESIGN.md` pairs are declared in sections 2.1 and 2.2. `derived` pairs apply the same 4.5:1
 * text rule to the backgrounds DESIGN.md does not pair explicitly (`bg.surface`, `bg.subtle`,
 * `bg.input`), so that every background token is exercised by a real text color.
 *
 * Adding a semantic color token makes the gate fail until it appears here, as `fg` or `bg`.
 */
export const pairs: readonly Pair[] = [
  {
    fg: "text.default",
    bg: "bg.base",
    min: TEXT,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "text.muted",
    bg: "bg.base",
    min: TEXT,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "text.placeholder",
    bg: "bg.input",
    min: TEXT,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "brand.primary",
    bg: "bg.base",
    min: TEXT,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "text.on-primary",
    bg: "brand.primary",
    min: TEXT,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "text.danger",
    bg: "bg.base",
    min: TEXT,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "text.default",
    bg: "bg.subtle",
    min: TEXT,
    themes: ["light"],
    source: "DESIGN.md",
  },
  {
    fg: "text.muted",
    bg: "bg.subtle",
    min: TEXT,
    themes: ["light"],
    source: "DESIGN.md",
  },
  {
    fg: "border.control",
    bg: "bg.base",
    min: CONTROL,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "border.control",
    bg: "bg.input",
    min: CONTROL,
    themes: ["dark"],
    source: "DESIGN.md",
  },
  {
    fg: "focus.ring",
    bg: "bg.base",
    min: CONTROL,
    themes: both,
    source: "DESIGN.md",
  },
  {
    fg: "focus.ring",
    bg: "bg.input",
    min: CONTROL,
    themes: ["light"],
    source: "DESIGN.md",
  },
  {
    fg: "border.decorative",
    bg: "bg.base",
    min: null,
    themes: both,
    source: "DESIGN.md",
  },

  {
    fg: "text.default",
    bg: "bg.surface",
    min: TEXT,
    themes: both,
    source: "derived",
  },
  {
    fg: "text.muted",
    bg: "bg.surface",
    min: TEXT,
    themes: both,
    source: "derived",
  },
  {
    fg: "text.default",
    bg: "bg.subtle",
    min: TEXT,
    themes: ["dark"],
    source: "derived",
  },
  {
    fg: "text.muted",
    bg: "bg.subtle",
    min: TEXT,
    themes: ["dark"],
    source: "derived",
  },
  {
    fg: "text.default",
    bg: "bg.input",
    min: TEXT,
    themes: both,
    source: "derived",
  },
  {
    fg: "text.muted",
    bg: "bg.input",
    min: TEXT,
    themes: both,
    source: "derived",
  },
  {
    fg: "border.control",
    bg: "bg.input",
    min: CONTROL,
    themes: ["light"],
    source: "derived",
  },
  {
    fg: "focus.ring",
    bg: "bg.input",
    min: CONTROL,
    themes: ["dark"],
    source: "derived",
  },
];
