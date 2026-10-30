# DESIGN.md

Visual direction for the design system. Read this together with AGENTS.md before creating or styling any component.
If this file and a component disagree, this file wins. If this file is wrong or incomplete, say so in the PR; do not improvise a new look.

## 1. Direction

The system extends the visual identity of aleixvidal.dev: a **terminal / console** aesthetic, refined for real form usage.

Adjectives (proposed, adjust freely): **technical, precise, calm, high-contrast**.

Principle: the terminal personality lives in the **details** (monospace type, accent glow on focus, prompt-style prefixes, square-ish corners). The base components stay plain, legible and fully accessible. Decoration never reduces readability.

Sources of truth derived from the personal site: green hue 145 in OKLCH, near-black backgrounds, IBM Plex Mono (fallback Geist Mono), base radius 0.25rem.

## 2. Color

All colors are authored in **OKLCH**. Components use semantic tokens only (see AGENTS.md section 6).
Contrast ratios below are WCAG 2.x, computed with a script from these exact OKLCH values. Re-verify in the browser and with the Storybook a11y addon; they are not a substitute for it.

### 2.1 Dark theme (default, matches the site)

| Semantic token | OKLCH | Notes |
| --- | --- | --- |
| `bg.base` | `oklch(0.08 0 0)` | page background |
| `bg.surface` | `oklch(0.10 0 0)` | cards, popovers |
| `bg.subtle` | `oklch(0.12 0 0)` | muted areas |
| `bg.input` | `oklch(0.15 0 0)` | field background, secondary surfaces |
| `text.default` | `oklch(0.75 0.15 145)` | 9.82:1 on `bg.base` |
| `text.muted` | `oklch(0.62 0.09 145)` | 5.94:1 on `bg.base` |
| `text.placeholder` | `oklch(0.58 0.08 145)` | 4.76:1 on `bg.input` |
| `brand.primary` | `oklch(0.70 0.18 145)` | 8.29:1 on `bg.base` |
| `text.on-primary` | `oklch(0.08 0 0)` | 8.29:1 on `brand.primary` |
| `text.danger` | `oklch(0.70 0.19 25)` | 7.15:1 on `bg.base` |
| `border.decorative` | `oklch(0.20 0.05 145)` | 1.16:1. Decoration only (cards, dividers). Never as the only boundary of a control |
| `border.danger` | `oklch(0.70 0.19 25)` | 7.15:1 on `bg.base`, 6.79:1 on `bg.input` (min 3:1). Same value as `text.danger`. Border of a control in the invalid state |
| `border.control` | `oklch(0.50 0.10 145)` | 3.62:1 on `bg.base`, 3.43:1 on `bg.input`, 3.60:1 on `bg.surface` (min 3:1) |
| `focus.ring` | `oklch(0.70 0.18 145)` | 8.29:1 on `bg.base`, 8.24:1 on `bg.surface`, 8.10:1 on `bg.subtle` (the highlighted option of a popup) |

Differences from the personal site, on purpose (the site values failed AA):
- Muted text was `oklch(0.50 0.08 145)` at 3.59:1. Raised.
- Placeholder was `oklch(0.40 0.08 145)` at 2.21:1. Raised.
- Danger text (root theme) was `oklch(0.577 0.245 27.325)` at 4.36:1, and sits outside sRGB so it gets clipped. Replaced.
- Control borders were the decorative border at about 1.1:1. Controls now use `border.control`.

### 2.2 Light theme (new, derived from the same hue)

| Semantic token | OKLCH | Notes |
| --- | --- | --- |
| `bg.base` | `oklch(0.98 0.01 145)` | |
| `bg.surface` / `bg.input` | `oklch(1 0 0)` | |
| `bg.subtle` | `oklch(0.95 0.015 145)` | 1.09:1 against `bg.base`. 14.91:1 with `text.default` and 6.29:1 with `text.muted` on top of it |
| `text.default` | `oklch(0.22 0.04 145)` | 16.23:1 on `bg.base` |
| `text.muted` | `oklch(0.45 0.05 145)` | 6.85:1 on `bg.base` |
| `text.placeholder` | `oklch(0.50 0.05 145)` | 5.87:1 on `bg.input` |
| `brand.primary` | `oklch(0.45 0.14 145)` | 6.61:1 on `bg.base`. Also valid for links |
| `text.on-primary` | `oklch(0.98 0.01 145)` | 6.61:1 on `brand.primary` |
| `text.danger` | `oklch(0.50 0.20 27)` | 6.27:1 on `bg.base` |
| `border.decorative` | `oklch(0.90 0.03 145)` | 1.26:1 on `bg.base`. Decoration only, same rule as in dark: never the only boundary of a control |
| `border.danger` | `oklch(0.50 0.20 27)` | 6.27:1 on `bg.base`, 6.64:1 on `bg.input` (min 3:1). Same value as `text.danger`. Border of a control in the invalid state |
| `border.control` | `oklch(0.60 0.07 145)` | 3.60:1 on `bg.base`, 3.81:1 on `bg.surface` |
| `focus.ring` | `oklch(0.45 0.14 145)` | same value as `brand.primary`: 6.61:1 on `bg.base`, 7.00:1 on `bg.input` and `bg.surface`, 6.07:1 on `bg.subtle` (the highlighted option of a popup) |

### 2.3 Rules

- Text needs 4.5:1, large text and control boundaries need 3:1, in BOTH themes.
- A state indicator (focus, highlighted, selected, invalid) needs 3:1 against its adjacent colors. A fill that differs from its surroundings by about 1.1:1 (`bg.subtle` on `bg.surface`) is not an indicator on its own: add an inset `focus.ring` outline, a border or an icon.
- Every new semantic color needs a light and a dark value and a measured ratio in this table.
- A contrast script must run in CI over the token files and fail the build on any pair below its minimum. Do not lower a minimum to pass.
  - Implemented in `packages/tokens/scripts/contrast` (`pnpm --filter @aleixvidal/tokens contrast`, also part of `pnpm test`). The pairs are declared in `pairs.ts`; a semantic color that no pair mentions fails the script.
  - The ratios in the tables above are the ones the script prints. It measures the 8-bit colors a browser paints (what axe and devtools report), not unrounded values. When a token changes, re-run it and update the tables.
- Keep colors inside sRGB, or provide an sRGB-safe value. Out-of-gamut values are silently clipped and the measured ratio stops being true.
- The `.dark` / `:root` duplication on the personal site is not carried over: tokens have a single source and the theme is switched by one attribute or class.

## 3. Typography

- Family: IBM Plex Mono, fallback Geist Mono, then `monospace`.
- Monospace is the identity. Use it for labels, values, buttons, code and headings.
- **Open decision:** whether helper text and long-form copy use a proportional sans (`font.sans` token) for readability. Until decided, everything is mono and the token exists so it can change in one place.
- The type scale, weights and line heights are tokens. Define them once, document them in a Storybook story, and never hardcode sizes.

Defined values (T01). `font.sans` currently resolves to the same stack as `font.mono`.

| Token | Size | Line height |
| --- | --- | --- |
| `text.xs` | `0.75rem` | `1rem` |
| `text.sm` | `0.875rem` | `1.25rem` |
| `text.md` | `1rem` | `1.5rem` |
| `text.lg` | `1.125rem` | `1.75rem` |
| `text.xl` | `1.25rem` | `1.75rem` |
| `text.2xl` | `1.5rem` | `2rem` |
| `text.3xl` | `1.875rem` | `2.25rem` |

- Weights: `regular` 400, `medium` 500, `bold` 700.
- Line heights (unitless, for text that is not paired with a size): `tight` 1.25, `normal` 1.5, `relaxed` 1.75.
- Font files are not loaded by the tokens package. Until a font is loaded by the consumer, the `monospace` fallback renders.

## 4. Shape and spacing

- Base radius `0.25rem`. Derived scale: `sm` = base - 4px (0), `md` = base - 2px (2px), `lg` = base (4px), `xl` = base + 4px (8px). Corners stay tight; this is part of the look.
- Spacing is a token scale on a 4px grid. No arbitrary pixel values in components.
- Tailwind only generates the declared steps (see below): a class such as `pl-7` or `w-11` produces no style, and a test in `packages/ui` fails on it.

Defined spacing steps (T01). Each step is `n * 0.25rem` (4px at the default root size; rem so it follows the user's font size): `0`, `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`.

Defined elevation (T01), four levels, no glow. These are shadows, not semantic colors, so they have no contrast pair. On the near-black dark theme they are subtle by design; do not rely on shadow alone to separate surfaces, pair it with `border.decorative`.

| Token | Value |
| --- | --- |
| `shadow.none` | `none` |
| `shadow.sm` | `0 1px 2px 0 oklch(0 0 0 / 0.4)` |
| `shadow.md` | `0 4px 8px -2px oklch(0 0 0 / 0.5)` |
| `shadow.lg` | `0 12px 24px -4px oklch(0 0 0 / 0.6)` |

Defined stacking (T14), one level, added with the first component that needed it. Add a level only when a component needs it.

| Token | Value | Used for |
| --- | --- | --- |
| `z.dropdown` | `1000` | popups that open over the page from a trigger (Select) |

Tailwind v4 has no theme namespace for z-index, so components read the variable: `z-(--ds-z-dropdown)`.

## 5. Effects (terminal flair)

The personal site uses CRT scanlines, a grid overlay, a vignette, text glow, a blinking cursor and glowing panel borders. In the design system these are **optional flair**, not part of base components:

- Allowed by default: a subtle glow on `focus.ring` and on the primary action; a prompt-style prefix (`$`, `>`) in helper text or labels where it adds meaning.
- Opt-in only (separate documented utilities or a theme addon): scanlines, grid, vignette, panel glow.
- Never apply glow or text-shadow to body text or to text that must meet contrast.
- Every animation (blink, pulse, typewriter, fade) must respect `prefers-reduced-motion` and be disabled under it.
- Overlays must not capture pointer events or sit above interactive content.

## 6. Storybook look

- Custom Storybook theme (via the theming package in `.storybook/manager.ts`) using the dark tokens, the mono font and the brand green. Light and dark switch available in the toolbar.
- A welcome page in MDX that states the purpose, the design principles above and links to the GitHub repo and aleixvidal.dev.
- Token stories (color, typography, spacing, radius, elevation) are generated from the token files and show the contrast ratio next to each color pair.
- Sidebar order: Introduction, Foundations (tokens), Form components, Patterns (realistic form).

## 7. Open decisions

- [ ] Proportional sans for long-form text, or mono everywhere
- [ ] Final adjectives and any reference sites to calibrate the feel
- [ ] Whether opt-in flair (scanlines, grid) ships in the package or only in Storybook
