---
name: scaffold-component
description: Scaffold a new component in packages/ui (folder, component, stories, tests, index, package export, changeset, size-limit budget) following the conventions of Field, Input, Textarea, Checkbox and Switch. Use whenever a task adds a component to the design system.
argument-hint: <kebab-case-name> [native|radix]
---

# scaffold-component

Creates the files of a new component so that it starts from the same structure as the merged ones, then you finish it. The generated code is a starting point that already passes lint, typecheck, tests and `pnpm size`; it is not a finished component.

Read AGENTS.md (sections 5 to 10) and the BACKLOG.md task first. The templates are in `templates/` next to this file and are modeled on the real components in `packages/ui/src/components/`: `textarea` and `input` (native element), `switch` and `checkbox` (Radix primitive). When the conventions change in those components, update the templates in the same PR.

## 1. Pick the variant

| Variant  | Use it for                                                                                            | Modeled on                                                     | Needs                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `native` | A control that is a single native element: a text field, a textarea                                   | `textarea` (one element, border and focus ring on the element) | `--element input` (default) or `textarea`                                                            |
| `radix`  | A toggle-like control whose root is a Radix primitive with `checked` state (checkbox, switch, toggle) | `switch`, `checkbox`                                           | `--primitive <package>` and `--role <aria-role>`; optionally `--part Thumb` (default) or `Indicator` |

What the templates do **not** cover, and you adapt by hand after scaffolding, copying from the reference component:

- a native control with a prefix, suffix or spinner: it needs a box around the element, so copy `input` (`className` goes to the box, `ref` and native props to the element);
- a Radix primitive with another shape (RadioGroup, Select, Slider, anything with a group root and items) or with more than two states (a checkbox is also `"indeterminate"`: widen the `checked` type as `checkbox.tsx` does).

If the primitive is not a dependency yet, check its current docs (Context7 or the official site; do not trust memory), then run `pnpm --filter @aleixvidal/ui add <package>@<exact version>`. Justify the dependency in the PR.

## 2. Create

From the repo root, on a branch `feat/<name>`:

```
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant native [--element input|textarea]
node .claude/skills/scaffold-component/scaffold.mts create <name> --variant radix --primitive @radix-ui/react-switch --role switch
node .claude/skills/scaffold-component/scaffold.mts size <name>
```

`create` does all of this (nothing else is touched):

- writes `packages/ui/src/components/<name>/{<name>.tsx,<name>.stories.tsx,<name>.test.tsx,index.ts}`;
- appends the component and its `<Name>Props` type to `packages/ui/src/index.ts` (named exports, never `export *`);
- adds `.changeset/add-<name>.md` (`@aleixvidal/ui` minor);
- adds a `size-limit` entry to `packages/ui/package.json` with a provisional budget, and formats everything with Prettier.

`size` builds the package, measures the component after tree-shaking (brotli, `react` and `react-dom` ignored) and sets the budget to the measured size plus 0.3 kB. Run it again after you finish the component, and say in the PR which dependencies account for the size. Never raise a budget to hide an accidental import. Check the CSS entry too: it has its own budget (`pnpm size` fails if the new classes push it over; raise it only with a measured, justified number).

## 3. Finish it (the generated code is incomplete on purpose)

Every place that needs a human decision carries the marker `SCAFFOLD-PLACEHOLDER`. Resolve all of them:

```
grep -rn SCAFFOLD-PLACEHOLDER packages/ui/src .changeset
```

It must return nothing before you report the task done. Markers: the component's JSDoc (when to use it and when to use another component), the docs description in the stories `meta`, the changeset text, and the **`InteractionPlaceholder` story**, which only checks that the component renders. Replace it with the real `play` flow (keyboard navigation, open and close, validation, ...), rename the story and delete the comment. The placeholder passes the build and the a11y check on purpose, so only this grep and review catch it.

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
- Focus is a real `outline` (`focus-visible:outline-2 outline-offset-2 outline-focus-ring`), so it survives forced-colors mode. Transition only `border-color` or `transform`, behind `motion-safe:`; `motion-reduce:animate-none` for animations. A background or text-color transition makes axe measure a half-faded color after a theme switch.
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

**Stories** (`Form components/<Name>`, `satisfies Meta<typeof X>`, autodocs from the global config)

- `Default`, one story per variant and size, one per state, `Controlled`, `PseudoStates` (`parameters.pseudo` with hover, focusVisible and active), a story that composes it with `Field`, and the interaction story with a `play` function. Hooks live in a named example component, never inline in `render`. No hand-written prop tables; `argTypes` only where docgen cannot resolve a cva type.

**Tests** (AGENTS.md section 9)

- `describe("<Name>")`, every `it` starts with "should", Arrange, Act and Assert separated by blank lines, `userEvent.setup()`, queries by role then label, no `fireEvent`, no `container.querySelector`, no snapshots.
- Always: renders, each variant, keyboard, disabled, invalid, controlled and uncontrolled, ref and `className` forwarding, native props passed through, `Field` wiring, react-hook-form for Radix controls, and an axe run per variant and state with `expectNoA11yViolations()` from `src/test/axe.ts`.
- **Every new component has an axe check and a changeset.** Coverage must stay at or above the thresholds.

## 5. Verify, then report

From the repo root, in this order, and report the real result of each:

```
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size
```

`pnpm build` includes `storybook build`. Open the built Storybook, check the Accessibility panel of every story of the component in the light and dark themes, and run each `play` function. Take screenshots of the component in both themes for the PR. Then follow AGENTS.md section 11 for the branch, commits and PR (one component per PR, no attribution lines, no force-push), and list in the PR anything you are unsure about.
