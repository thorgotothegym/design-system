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
| `text.default` | `oklch(0.75 0.15 145)` | 9.87:1 on `bg.base` |
| `text.muted` | `oklch(0.62 0.09 145)` | 5.93:1 on `bg.base` |
| `text.placeholder` | `oklch(0.58 0.08 145)` | 4.75:1 on `bg.input` |
| `brand.primary` | `oklch(0.70 0.18 145)` | 8.33:1 on `bg.base` |
| `text.on-primary` | `oklch(0.08 0 0)` | 8.33:1 on `brand.primary` |
| `text.danger` | `oklch(0.70 0.19 25)` | 7.14:1 on `bg.base` |
| `border.decorative` | `oklch(0.20 0.05 145)` | 1.16:1. Decoration only (cards, dividers). Never as the only boundary of a control |
| `border.control` | `oklch(0.50 0.10 145)` | 3.62:1 on `bg.base`, 3.43:1 on `bg.input` (min 3:1) |
| `focus.ring` | `oklch(0.70 0.18 145)` | 8.33:1 on `bg.base` |

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
| `text.default` | `oklch(0.22 0.04 145)` | 16.23:1 on `bg.base` |
| `text.muted` | `oklch(0.45 0.05 145)` | 6.89:1 on `bg.base` |
| `text.placeholder` | `oklch(0.50 0.05 145)` | 5.86:1 on `bg.input` |
| `brand.primary` | `oklch(0.45 0.14 145)` | 6.64:1 on `bg.base`. Also valid for links |
| `text.on-primary` | `oklch(0.98 0.01 145)` | 6.64:1 on `brand.primary` |
| `text.danger` | `oklch(0.50 0.20 27)` | 6.31:1 on `bg.base` |
| `border.control` | `oklch(0.60 0.07 145)` | 3.63:1 on `bg.base` |
| `focus.ring` | `oklch(0.45 0.14 145)` | at least as dark as the 5.33:1 value that was checked |

### 2.3 Rules

- Text needs 4.5:1, large text and control boundaries need 3:1, in BOTH themes.
- Every new semantic color needs a light and a dark value and a measured ratio in this table.
- A contrast script must run in CI over the token files and fail the build on any pair below its minimum. Do not lower a minimum to pass.
- Keep colors inside sRGB, or provide an sRGB-safe value. Out-of-gamut values are silently clipped and the measured ratio stops being true.
- The `.dark` / `:root` duplication on the personal site is not carried over: tokens have a single source and the theme is switched by one attribute or class.

## 3. Typography

- Family: IBM Plex Mono, fallback Geist Mono, then `monospace`.
- Monospace is the identity. Use it for labels, values, buttons, code and headings.
- **Open decision:** whether helper text and long-form copy use a proportional sans (`font.sans` token) for readability. Until decided, everything is mono and the token exists so it can change in one place.
- The type scale, weights and line heights are tokens. Define them once, document them in a Storybook story, and never hardcode sizes.

## 4. Shape and spacing

- Base radius `0.25rem`. Derived scale: `sm` = base - 4px (0), `md` = base - 2px (2px), `lg` = base (4px), `xl` = base + 4px (8px). Corners stay tight; this is part of the look.
- Spacing is a token scale on a 4px grid. No arbitrary pixel values in components.

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
