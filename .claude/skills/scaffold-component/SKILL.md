---
name: scaffold-component
description: Scaffold a new component in packages/ui (folder, component, stories, tests, index, package export or own entry point, changeset, size-limit budget, checklist of the rules) following the conventions of Input, Textarea, Checkbox, Switch, RadioGroup, Select and OtpInput. Use whenever a task adds a component to the design system.
argument-hint: <kebab-case-name> [native|radix|group|popover|subpath]
---

# scaffold-component

Creates the files of a new component so that it starts from the same structure as the merged ones, then you finish it. The generated code is a starting point that already passes lint, typecheck, tests and `pnpm size`; it is not a finished component.

Read AGENTS.md (sections 5 to 10) and the BACKLOG.md task first. The templates are in `templates/` next to this file and are modeled on the real components in `packages/ui/src/components/`: `textarea` and `input` (native), `switch` and `checkbox` (radix), `radio-group` (group), `select` (popover) and `otp-input` and `date-picker` (subpath). When the conventions change in those components, update the templates in the same PR. `templates/checklist.tpl` is the list of rules every generated component starts with (section 3).

## 1. Pick the variant

| Variant   | Use it for                                                                                                                    | Modeled on                 | Needs                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `native`  | A control that is a single native element: a text field, a textarea                                                           | `textarea`                 | `--element input` (default) or `textarea`                                                            |
| `radix`   | A toggle-like control whose root is a Radix primitive with `checked` state (checkbox, switch, toggle)                         | `switch`, `checkbox`       | `--primitive <package>` and `--role <aria-role>`; optionally `--part Thumb` (default) or `Indicator` |
| `group`   | Several items with one shared value: roving focus, arrow keys, a group label and error wired through `Field`                  | `radio-group`              | `--primitive <package>`, `--role <group role>`, `--item-role <item role>`                            |
| `popover` | A trigger that opens a list over the page: `z.dropdown`, a highlighted option with an inset `focus.ring`, `defaultOpen`       | `select`                   | `--primitive <package>`                                                                              |
| `subpath` | A component whose dependency is heavy or not `sideEffects`-free, so it ships as `@aleixvidal/ui/<name>` and not from the root | `otp-input`, `date-picker` | `--dependency <package>`                                                                             |

The group and popover templates use the parts of the reference primitive (`Root` and `Item` with an `Indicator`; `Root`, `Trigger`, `Value`, `Portal`, `Content`, `Viewport`, `Item`, `ItemText`, `ItemIndicator`, `Group`, `Label`, `Separator`). A primitive with other parts (ToggleGroup's `type`, DropdownMenu without `Value`) needs those parts adapted by hand; the rules in the checklist stay. Other shapes the templates do not cover, which you adapt from the reference component:

- a native control with a prefix, suffix or spinner: copy `input` (`className` goes to the box, `ref` and native props to the element);
- a Radix primitive with more than two states (a checkbox is also `"indeterminate"`: widen the `checked` type as `checkbox.tsx` does), or a slider.

Use `subpath` when the dependency does not declare `"sideEffects": false` (check its `package.json`; Radix packages do) or is much heavier than the rest. Measure with `pnpm size` if unsure: if exporting from the root makes the other entries grow, it is a `subpath` component (AGENTS.md section 5). The subpath template draws a box around a native `<input>` as a stand-in; replace it with the control built on the dependency.

If the primitive is not a dependency yet, check its current docs (Context7 or the official site; do not trust memory), then run `pnpm --filter @aleixvidal/ui add <package>@<exact version>`. Justify the dependency in the PR.

## 2. Create

From the repo root, on a branch `feat/<name>`. The script needs Node 22.18 or newer (it runs TypeScript directly through Node's type stripping); the repository itself requires Node 24 (`engines`, `.nvmrc`), which covers it.

```
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant native [--element input|textarea]
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant radix --primitive @radix-ui/react-switch --role switch
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant group --primitive @radix-ui/react-radio-group --role radiogroup --item-role radio
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant popover --primitive @radix-ui/react-select
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant subpath --dependency <package>
node .claude/skills/scaffold-component/scaffold.mts size <name>
```

`create` does all of this (nothing else is touched):

- writes `packages/ui/src/components/<name>/{<name>.tsx,<name>.stories.tsx,<name>.test.tsx,index.ts}`, with the checklist at the top of `<name>.tsx`;
- adds `.changeset/add-<name>.md` (`@aleixvidal/ui` minor) from the variant's `changeset.md.tpl`;
- adds a `size-limit` entry to `packages/ui/package.json` with a provisional budget;
- exports the component and its props types:
  - from `packages/ui/src/index.ts` (named exports, never `export *`) for every variant except `subpath`;
  - for `subpath`, from its own entry point instead: `src/<name>.ts`, an `exports` entry `./<name>`, an entry in `tsup.config.ts`, the `size-limit` path `dist/<name>.js`, a test in `src/package.test.ts` that fails if the root entry exports it, and the import line plus a paragraph in `packages/ui/README.md` (what the dependency weighs; the CSP nonce note if it injects `<style>` elements);
- formats everything with Prettier.

`size` builds the package, measures the component after tree-shaking (brotli, `react` and `react-dom` ignored) and sets the budget to the measured size plus 0.3 kB. Run it again after you finish the component, and say in the PR which dependencies account for the size. Never raise a budget to hide an accidental import. Check the CSS entry too: it has its own budget (`pnpm size` fails if the new classes push it over; raise it only with a measured, justified number).

## 3. Finish it (the generated code is incomplete on purpose)

Every place that needs a human decision carries the marker `SCAFFOLD-PLACEHOLDER`, starting with **the checklist at the top of `<name>.tsx`** (rendered from `templates/checklist.tpl` for this variant and role). Each item names the rule and what enforces it: `outline-removal.test.ts` and `spacing-scale.test.ts` (in `pnpm test`), the contrast gate, `pnpm size`, the manifest test, or review. Do every item, then delete the checklist. Resolve all of them:

```
pnpm check:placeholders
```

It lists the files and lines that still have a marker (in `packages/ui/src`, `.changeset` and `packages/ui/README.md`) and fails until there are none. It is deliberately not part of `pnpm test`, so a freshly scaffolded component compiles while you work on it; it is part of the definition of done (AGENTS.md section 10), so it must pass before you report the task done. Markers: the checklist, the component's JSDoc (when to use it and when to use another component), the docs description in the stories `meta`, the changeset text, for `subpath` the entry file, the manifest test comment, the README paragraph and the stand-in `<input>`, and the **`InteractionPlaceholder` story**, which only checks that the component renders. Replace it with the real `play` flow (keyboard navigation, open and close, validation, ...), rename the story and delete the comment. The placeholder passes the build and the a11y check on purpose, so only `pnpm check:placeholders` and review catch it.

Then add what the template cannot know: the props, variants and sizes of this component (keep the surface small, derive types from `cva` with `VariantProps` and re-declare each variant prop with a JSDoc comment), every state in AGENTS.md section 5 that applies, a story and a test for each, and the realistic-form story where it fits.

## 4. Conventions the templates already encode

Keep them when you edit. They come from the merged PRs.

**Code**

- `type`, never `interface`; const arrow functions, never `function`; named exports; `import type` for types; no `any`, no `!`.
- Props: `Omit<ComponentPropsWithRef<"el">, ...collisions> & { own props with JSDoc }` (omit native props that collide, such as `size`). `ref` is a normal prop (React 19), no `forwardRef`. Every native attribute is forwarded; say so in the component JSDoc.
- Where the control is its own box (these templates), `ref`, `className` and native props all go to that element. If a wrapper box exists, `className` goes to the box and `ref` plus native props to the control.
- `cva` only for real variants. States are `data-*` attributes (`data-invalid`, `data-disabled`, `data-readonly`) styled with Tailwind data variants. The root carries `data-slot="<name>"`; tests reach it with `getByTestId`.
- Call `useFieldState` from `../field/use-field-state` so the control works inside and outside `Field` (`id`, `aria-describedby`, `aria-invalid`, disabled). No value state inside the control: `value`, `defaultValue` and `onChange` (or `checked`, `defaultChecked`, `onCheckedChange`) pass through, so controlled and uncontrolled both work.
- A compound component (`Object.assign(Root, { Part })`) must be marked `/* @__PURE__ */` so that importing one component does not pull the others into the bundle (`Field` is the model). Internals shared by parts (context, hooks) sit in the same folder in their own kebab-case files and are not exported from the package entry.

**Tokens and styling**

- Semantic tokens only, as Tailwind classes (`bg-bg-input`, `border-border-control`, `text-text-muted`, `outline-focus-ring`). No raw palette values, no arbitrary values, no `opacity` for disabled (use `bg-bg-subtle` and `text-text-muted`).
- **Spacing uses only the 13 token steps** (0 to 6, 8, 10, 12, 16, 20, 24). Any other class (`pl-7`, `gap-13`) silently produces no style; `spacing-scale.test.ts` runs in `pnpm test` and fails on it.
- Invalid borders use `border-border-danger` (`border.danger`), never `text-danger`.
- Focus is a real `outline` (`focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring`), so it survives forced-colors mode. Keep `outline-solid` in the focus variant, and **never use `outline-hidden` or `outline-none`**: in Tailwind 4 they set `outline-style: none` and the variable `outline-2` reads, so the ring silently paints nothing. An element whose ring is on a wrapper gets `outline-transparent` (not `outline-0`, which still lets Chrome draw its own ring). `outline-removal.test.ts` runs in `pnpm test` and fails on them. Transition only `border-color` or `transform`, behind `motion-safe:`; `motion-reduce:animate-none` for animations. A background or text-color transition makes axe measure a half-faded color after a theme switch.
- No reliance on a CSS reset: set `box-border`, the font, `appearance-none` and so on on the component. Reserve space for anything that appears later so nothing shifts (a layout test with the error visible and hidden).
- Every color pair must already exist in the contrast gate (`packages/tokens`); add the pair there if you introduce a new combination.

**Form controls**

- They work inside `Field`: `<Field><Field.Label/><Control/><Field.Description/><Field.Error/></Field>`. `Field.Error` is always rendered (it is the live region).
- Checkbox-like controls (checkbox, switch, radio option) use `<Field orientation="horizontal">` with **the control first, then the label**, so DOM order and visual order match; never reorder with CSS. The label starts 12px after the control (`gap-x-3`); nest dependent options with `pl-8` to align under it.
- A control whose ARIA role does not support `aria-required` (a **switch**) must not accept or forward `required` or `aria-required`: the `radix` template omits both from its props when `--role` is not in the supported set (checkbox, radiogroup, combobox, listbox, spinbutton, textbox...), and its test asserts the attribute is absent. A required yes/no is a checkbox.
- Implement all states of AGENTS.md section 5 that apply: default, hover, focus-visible, active, disabled, read-only, invalid, loading.

**Radix**

- Radix does the focus management, keyboard and ARIA; do not reimplement them. Check the current docs of the primitive before using an API.
- A Radix control inside a `<form>` renders a hidden input that uses `ResizeObserver`, which jsdom lacks. The stub already lives in `packages/ui/src/test/setup.ts`; do not add another per test file.

**Group** (`group`)

- The `Field.Label` names the group through `aria-labelledby` (`state.labelledBy` from `useFieldState`), since a group cannot use `htmlFor`. Each item sits in its own `<Field orientation="horizontal">`, item first. Radix does the roving focus: one tab stop, arrows move and select, Space selects. Tests release an arrow key only after Radix's focus timeout (`pressArrow`).

**Popover** (`popover`)

- The content is portalled on `z-(--ds-z-dropdown)`, capped by the space Radix measures, and scrolls inside. The highlighted option is an inset `focus.ring` outline over the fill (the fill alone is about 1.1:1, so the ring is the indicator; its pair is in the contrast gate). Stories that show the list open use `defaultOpen` instead of opening it in `play`, with only `aria-hidden-focus` turned off for them (Radix hides the page while open). `PageWithScrollbar` proves that opening does not shift the page.

**Subpath** (`subpath`)

- Not exported from `src/index.ts`; the manifest test enforces it. Say in the JSDoc, the stories description, the README and the changeset that it is imported from `@aleixvidal/ui/<name>`, and why. If the dependency injects `<style>` elements, document the CSP nonce (`nonce` prop, as `OtpInput`, or `<meta name="csp-nonce">`, as `DatePicker`) and check it in Chrome with a strict policy.

**Stories** (`Form components/<Name>`, `satisfies Meta<typeof X>`, autodocs from the global config)

- `Default`, one story per variant and size, one per state, `Controlled`, `PseudoStates` (`parameters.pseudo` with hover, focusVisible and active), a story that composes it with `Field`, and the interaction story with a `play` function. Hooks live in a named example component, never inline in `render`. No hand-written prop tables; `argTypes` only where docgen cannot resolve a cva type.
- Interaction stories that demonstrate a flow start with `startDemo()` from `src/test/demo.ts` (a pause, then a delay per step), so they can be followed. No `play` may change what the first paint shows: open things with `defaultOpen`. Anything with dates uses a fixed date; a story that depends on today sets `chromatic: { disableSnapshot: true }`.

**Tests** (AGENTS.md section 9)

- `describe("<Name>")`, every `it` starts with "should", Arrange, Act and Assert separated by blank lines, `userEvent.setup()`, queries by role then label, no `fireEvent`, no `container.querySelector`, no snapshots.
- Always: renders, each variant, keyboard, disabled, invalid, controlled and uncontrolled, ref and `className` forwarding, native props passed through, `Field` wiring, react-hook-form for Radix controls, and an axe run per variant and state with `expectNoA11yViolations()` from `src/test/axe.ts`.
- **Every new component has an axe check and a changeset.** Coverage must stay at or above the thresholds.

## 5. Verify, then report

From the repo root, in this order, and report the real result of each:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && pnpm check:placeholders
```

`pnpm build` includes `storybook build`. Open the built Storybook, check the Accessibility panel of every story of the component in the light and dark themes, and run each `play` function. Do a keyboard-only pass over every state and check in Chrome, in both themes, that each focus, highlighted, selected and invalid indicator paints and meets 3:1; describe both in the PR. Take screenshots of the component in both themes for the PR. Then follow AGENTS.md section 11 for the branch, commits and PR (one component per PR, no attribution lines, no force-push), and list in the PR anything you are unsure about.
