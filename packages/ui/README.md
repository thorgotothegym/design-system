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

## Cascade layers, `className` and global CSS

`styles.css` puts the component rules in CSS cascade layers (`theme` and `utilities`, the same names Tailwind 4 uses). It does this so your CSS can override a component without specificity fights or `!important`.

The rule that matters: **CSS outside any layer beats CSS inside a layer**, whatever the specificity and the order of the files. Between layers, the layer declared last wins.

What that means for you:

- **Your `className` and your own stylesheet win.** `<Input className="my-input" />` with `.my-input { height: 56px; }` in a normal (unlayered) stylesheet overrides the component's height. `className` goes to the box around the input (the element with the border), not to the `<input>`.
- **Your global CSS wins too, which can surprise you.** A global rule such as `p { margin: 1rem }`, `* { padding: 0 }` or `input { border: 0 }` is unlayered, so it overrides the component's own layered rules, for example the margin of `Field.Description`. Either scope global element rules to your own containers, or put them in a layer that is declared before ours (next point).
- **To make the library win over your global styles**, declare your layer order before you import `styles.css`. Only `@layer` statements and `@charset` may come before an `@import`:

  ```css
  @layer base, theme, utilities;
  @import "@aleixvidal/ui/styles.css";

  @layer base {
    p {
      margin: 1rem;
    }
  }
  ```

  Rules in `base` now lose to the components, and anything you leave unlayered still wins over both.

- **If you also use Tailwind 4**, its layers are `theme`, `base`, `components` and `utilities`. Declare that order once, first (`@layer theme, base, components, utilities;`), so the two stylesheets share the layers. Your Tailwind utilities and ours then sit in the same `utilities` layer: on equal specificity the one that comes later wins, so import `styles.css` before your own Tailwind stylesheet. The state styles of a component (invalid, disabled, read-only) use attribute selectors and are more specific than a plain utility class on purpose, so a utility such as `border-red-500` does not hide the invalid border.
- **Browsers**: cascade layers are supported by all current browsers (since 2022). In an older browser the layered rules are ignored and the components render unstyled.

## Development

- `pnpm --filter @aleixvidal/ui build` builds `dist/index.js`, the type declarations and `dist/styles.css` (Tailwind compiles `src/styles.css`; the token variables come from the private `@aleixvidal/tokens` package at build time).
- `pnpm size` checks the size budgets in `package.json` (`size-limit`): one per exported component, measured after tree-shaking with React excluded, and one for `styles.css`. To give a new component its own budget, add one entry to the `size-limit` array with `"import": "{ MyComponent }"`; the other entries are not touched.
- `pnpm test:consumer` packs the package, installs it in a clean temporary app, builds that app with Vite and checks the result in Google Chrome: the styles use the token values and `data-theme` switches the theme. It needs network access and Chrome installed (set `SMOKE_BROWSER_CHANNEL` to use another Playwright channel). It is not part of `pnpm test`, which stays offline and fast.
