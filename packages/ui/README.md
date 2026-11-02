# @aleixvidal/ui

React form components, checked with axe in CI: Field, Input, Textarea, Checkbox, Switch, RadioGroup, Select, Slider, TagInput, OtpInput and DatePicker. The live documentation is the Storybook at [design.aleixvidal.dev](https://design.aleixvidal.dev).

## Install (planned)

The package is not published to npm yet; the first release is planned. Once it is, install it with its peer dependencies:

```sh
pnpm add @aleixvidal/ui react react-dom
```

Peer dependencies: `react` and `react-dom` 19 (`^19.0.0`). Everything else (Radix, React Aria, input-otp and the styling helpers) is a regular dependency.

## Styles

Import the stylesheet once, at the root of your app. It has the styles of every component and the design token variables for both themes. It does not reset your page (no preflight), and you do not need Tailwind.

```tsx
import "@aleixvidal/ui/styles.css";
```

## Usage

Put every control inside a `Field`. It labels the control, links the description and the error, and sets `aria-invalid` and `aria-required` from its props.

### Text: Input, Textarea, TagInput

```tsx
import { Field, Input, TagInput, Textarea } from "@aleixvidal/ui";

export const AboutYou = ({ nameError }: { nameError?: string }) => (
  <>
    <Field required invalid={nameError !== undefined}>
      <Field.Label>Full name</Field.Label>
      <Input autoComplete="name" />
      <Field.Description>As it appears on your badge.</Field.Description>
      <Field.Error>{nameError}</Field.Error>
    </Field>
    <Field>
      <Field.Label>Short bio</Field.Label>
      <Textarea autoGrow />
    </Field>
    <Field>
      <Field.Label>Interests</Field.Label>
      <TagInput max={5} defaultValue={["Design systems"]} />
      <Field.Description>
        Press Enter or a comma after each one.
      </Field.Description>
    </Field>
  </>
);
```

### Choices: Checkbox, Switch, RadioGroup, Select

A checkbox or a switch goes in a horizontal `Field`, control first. Each radio option has its own horizontal `Field`, inside the group's `Field`.

```tsx
import { Checkbox, Field, RadioGroup, Select, Switch } from "@aleixvidal/ui";

export const Preferences = () => (
  <>
    <Field orientation="horizontal">
      <Checkbox />
      <Field.Label>I accept the terms</Field.Label>
    </Field>
    <Field orientation="horizontal">
      <Switch />
      <Field.Label>Email me about the programme</Field.Label>
    </Field>
    <Field required>
      <Field.Label>Ticket type</Field.Label>
      <RadioGroup defaultValue="standard">
        <Field orientation="horizontal">
          <RadioGroup.Item value="standard" />
          <Field.Label>Standard</Field.Label>
        </Field>
        <Field orientation="horizontal">
          <RadioGroup.Item value="online" />
          <Field.Label>Online</Field.Label>
        </Field>
      </RadioGroup>
    </Field>
    <Field>
      <Field.Label>Country</Field.Label>
      <Select placeholder="Choose a country" autoComplete="country-name">
        <Select.Item value="Spain">Spain</Select.Item>
        <Select.Item value="Portugal">Portugal</Select.Item>
      </Select>
    </Field>
  </>
);
```

### Numbers and dates: Slider, DatePicker, OtpInput

```tsx
import { Field, Slider } from "@aleixvidal/ui";
import { DatePicker } from "@aleixvidal/ui/date-picker";
import { OtpInput } from "@aleixvidal/ui/otp-input";

export const Details = () => (
  <>
    <Field>
      <Field.Label>Price per night</Field.Label>
      <Slider defaultValue={[60, 180]} min={0} max={300} showValue />
    </Field>
    <Field>
      <Field.Label>Arrival date</Field.Label>
      <DatePicker locale="en-GB" min="2027-03-13" max="2027-03-19" />
    </Field>
    <Field>
      <Field.Label>Verification code</Field.Label>
      <OtpInput length={6} />
    </Field>
  </>
);
```

Each component's props, states and keyboard behavior are documented in its Storybook page.

<!-- The scaffold-component skill adds a subpath component's import and paragraph to this section: keep the "### Entry points" heading and a "## " heading after it. -->

### Entry points

Everything is exported from `@aleixvidal/ui`, except two components that have their own entry point, so that they only cost something when you import them:

```tsx
import { OtpInput } from "@aleixvidal/ui/otp-input";
import { DatePicker } from "@aleixvidal/ui/date-picker";
```

- `OtpInput` is built on `input-otp`, which a bundler cannot tree-shake. Exporting it from the main entry made every other component larger.
- `DatePicker` is built on React Aria and weighs about 70 kB brotli: most of it is React Aria's date and calendar code, plus the translated strings of 34 locales. If your app supports only some locales, drop the others with [`@react-aria/optimize-locales-plugin`](https://react-spectrum.adobe.com/react-aria/internationalization.html) in your bundler. Its value is an ISO 8601 date string (`"2026-10-30"`).

## Server rendering and Content-Security-Policy

- **Field:** the label, description and error are wired in the first render, so server-rendered HTML is already labelled and described, as long as `Field.Label` and `Field.Description` are written as children of the `Field`. That includes fragments, arrays and conditions. A part inside a component of your own is wired after hydration.
- **DatePicker:** set `locale` when rendering on the server. Without it, React Aria renders `en-US` on the server and switches to the browser's locale after hydration, which reorders the date. React Aria adds one small `<style>` element, and on iOS a second one while the calendar is open. Under a Content-Security-Policy that forbids inline styles, add `<meta name="csp-nonce" content="...">` with your nonce. Without it the styles are blocked: the field still works, and only touch behavior is lost (no double-tap delay, no scrolling behind the calendar).
- **OtpInput:** `input-otp` adds one `<style id="input-otp-style">` element to the page when the first field mounts. Under a Content-Security-Policy that forbids inline styles, pass `nonce` to `OtpInput` and allow that nonce in `style-src`. Without it the element is blocked. The field still works, but the selection and the autofill highlight show through, and an iOS workaround is lost.

## Themes

Dark is the default. Set `data-theme` on the root element to choose one:

```html
<html lang="en" data-theme="light"></html>
```

Change the attribute at runtime to switch themes; the components follow. The package does not read `prefers-color-scheme`: choose the initial theme yourself, for example from a stored setting or a media query.

Colors, spacing, radius, typography and shadows are CSS variables named `--ds-*`. You can use them in your own CSS, for example `var(--ds-color-bg-surface)`.

## Fonts

The components use the `--ds-font-mono` stack (IBM Plex Mono, then Geist Mono, then `monospace`). The package does not load font files; load IBM Plex Mono in your app, or the fallback renders.

## Tailwind, cascade layers, `className` and global CSS

`styles.css` is compiled with Tailwind 4, but you do not need Tailwind to use it. If you use Tailwind too:

- **Your palette is not touched.** The package's Tailwind theme starts with `--color-*: initial`, so `styles.css` contains none of Tailwind's default colors and no `--color-*` variables. Its colors read the `--ds-*` token variables directly. Your own Tailwind palette and color classes come only from your own build.
- **Cascade layers.** The component rules are in the cascade layers `theme` and `utilities`, the same names Tailwind 4 uses, so your CSS can override a component without specificity fights or `!important`.

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

- **With Tailwind 4**, its layers are `theme`, `base`, `components` and `utilities`. Declare that order once, first (`@layer theme, base, components, utilities;`), so the two stylesheets share the layers. Your Tailwind utilities and ours then sit in the same `utilities` layer, and on equal specificity the one that comes later wins, so import `styles.css` before your own Tailwind stylesheet. The state styles of a component (invalid, disabled, read-only) use attribute selectors and are more specific than a plain utility class on purpose, so a utility such as `border-red-500` does not hide the invalid border.
- **Browsers**: cascade layers are supported by all current browsers (since 2022). In an older browser the layered rules are ignored and the components render unstyled.

## Known limitations

- **No read-only mode for the Radix-based controls.** Checkbox, Switch, RadioGroup, Select and Slider have no `readOnly`, because Radix offers none. Disable them instead: their value stays visible, but they leave the Tab order. Input, Textarea, TagInput, OtpInput and DatePicker support `readOnly`.
- **A partly filled DatePicker reports `null`.** While some parts of the date are empty, `onValueChange` receives `null` and the field is not marked invalid. Your form's `required` rule catches it; use one message for an empty and an incomplete date.
- **Slider:** horizontal only, with no marks or ticks.

The accessibility audit, with what has been verified and what has not, is in [docs/accessibility.md](https://github.com/thorgotothegym/design-system/blob/main/docs/accessibility.md).

## Development

- `pnpm --filter @aleixvidal/ui build` builds `dist/index.js`, the type declarations and `dist/styles.css`. Tailwind compiles `src/styles.css`, and the token variables come from the private `@aleixvidal/tokens` package at build time.
- `pnpm size` checks the size budgets in `package.json` (`size-limit`): one per exported component, measured after tree-shaking with React excluded, and one for `styles.css`. To give a new component its own budget, add one entry to the `size-limit` array with `"import": "{ MyComponent }"`; the other entries are not touched.
- `pnpm test:consumer` packs the package, installs it in a clean temporary app, builds that app with Vite and checks the result in Google Chrome: the styles use the token values, and `data-theme` switches the theme. It needs network access and Chrome installed (set `SMOKE_BROWSER_CHANNEL` to use another Playwright channel). It is not part of `pnpm test`, which stays offline and fast.
