# @aleixvidal/ui

React components for the design system. Requires React 19.

## Install

```sh
pnpm add @aleixvidal/ui react react-dom
```

## Use

Import the stylesheet once, at the root of your app. It has the styles of every component and the design token variables for both themes. It does not reset your page (no preflight), and you do not need Tailwind.

```tsx
import "@aleixvidal/ui/styles.css";
import { Field, Input } from "@aleixvidal/ui";

export const NameField = () => (
  <Field required>
    <Field.Label>Name</Field.Label>
    <Field.Description>As it appears on your badge.</Field.Description>
    <Input placeholder="Ada Lovelace" />
    <Field.Error />
  </Field>
);
```

## Themes

Dark is the default. Set `data-theme` on the root element to choose one:

```html
<html lang="en" data-theme="light"></html>
```

Change the attribute at runtime to switch themes; the components follow. The package does not read `prefers-color-scheme`: choose the initial theme yourself, for example from a stored setting or a media query.

Colors, spacing, radius, typography and shadows are CSS variables named `--ds-*`. You can use them in your own CSS, for example `var(--ds-color-bg-surface)`.

## Fonts

The components use the `--ds-font-mono` stack (IBM Plex Mono, then Geist Mono, then `monospace`). The package does not load font files; load IBM Plex Mono in your app, or the fallback renders.

## Overriding styles

`styles.css` puts its rules in CSS cascade layers (`theme` and `utilities`). Your own unlayered CSS wins over them, whatever the order of the imports. If you use Tailwind in the same app, declare the layer order once at the top of your stylesheet, for example `@layer theme, base, components, utilities;`.

## Development

- `pnpm --filter @aleixvidal/ui build` builds `dist/index.js`, the type declarations and `dist/styles.css` (Tailwind compiles `src/styles.css`; the token variables come from the private `@aleixvidal/tokens` package at build time).
- `pnpm size` checks the size budgets in `package.json` (`size-limit`) for the JS entry point and `styles.css`.
- `pnpm test:consumer` packs the package, installs it in a clean temporary app, builds that app with Vite and checks the result in Google Chrome: the styles use the token values and `data-theme` switches the theme. It needs network access and Chrome installed (set `SMOKE_BROWSER_CHANNEL` to use another Playwright channel). It is not part of `pnpm test`, which stays offline and fast.
