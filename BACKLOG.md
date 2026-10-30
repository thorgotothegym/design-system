# BACKLOG.md

Ordered work plan for the design system. One task = one branch = one PR.
Read AGENTS.md, CLAUDE.md and DESIGN.md before starting any task. Those files define the conventions; this file defines the work.

How to use it:
- Work top to bottom. Do not start a task whose dependencies are not merged.
- `Mode: supervised` means a human reviews or writes it before anything is delegated. `Mode: unattended` means an agent can run it alone and open a PR.
- Every task is done only when its acceptance criteria AND the definition of done in AGENTS.md section 10 are met.
- If a task is ambiguous and hard to reverse, stop and write the options in the PR (AGENTS.md section 14).

## Human-only actions (an agent cannot or should not do these)

- [ ] Create the public GitHub repository and choose a license (MIT is the usual default for a portfolio library)
- [ ] Create the Chromatic project and add its token as a GitHub secret
- [ ] Create the Vercel project for the static Storybook and connect the repo
- [ ] Add the subdomain DNS record at the domain registrar (name still to decide, e.g. `ds` or `design`)
- [ ] Reserve the npm scope for the package name and add the publish token as a GitHub secret
- [ ] Final check that no employer-related content is present (AGENTS.md section 13) before making the repo public

---

## Phase 0: Foundation (supervised)

### T00. Repo bootstrap
- Mode: supervised
- Depends on: none
- Goal: a working empty monorepo that builds, lints and tests.
- Naming: the repository is called `design-system`. The root `package.json` name is `design-system` (private). The published package stays `@aleixvidal/ui`.
- Scope: pnpm workspaces, Turborepo, TypeScript strict (shared base tsconfig), ESLint shared config, Prettier, Vitest, Changesets, `.gitignore`, `.editorconfig`, Node version file, root scripts from AGENTS.md section 4. Packages created empty: `packages/tokens`, `packages/ui`, `packages/eslint-config`; app: `apps/storybook`.
- Acceptance criteria:
  - [ ] `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass from a clean clone
  - [ ] ESLint enforces `@typescript-eslint/consistent-type-definitions: ['error', 'type']`, and `interface` is rejected by a test file in CI
  - [ ] ESLint forbids `any` and non-null assertions
  - [ ] `packages/ui` has no dependency on Next.js or any router
  - [ ] Turbo caches `build`, `lint`, `typecheck`, `test` (second run is a cache hit)
  - [ ] Package names and scope are set in one place and match AGENTS.md

### T01. Tokens package from DESIGN.md
- Mode: supervised (review the generated values against DESIGN.md)
- Depends on: T00
- Goal: tokens are the single source of truth, generated into CSS variables, a typed TS module and a Tailwind preset.
- Scope: palette layer (OKLCH), semantic layer with light and dark values exactly as in DESIGN.md sections 2.1 and 2.2, plus spacing (4px grid), radius (base 0.25rem and its derived scale), typography (mono family, scale, weights, line heights) and elevation. Build with Style Dictionary (check the current docs for config and token format).
- Acceptance criteria:
  - [ ] Every semantic token in DESIGN.md exists, with matching light and dark OKLCH values
  - [ ] Components can reference only semantic tokens; the palette is not exported for component use
  - [ ] Output includes CSS custom properties, a typed TS export and a Tailwind preset
  - [ ] Theme switch works with a single attribute or class on the root
  - [ ] Token names are typed so a typo is a compile error in `packages/ui`
  - [ ] A changeset is added

### T02. Contrast gate
- Mode: unattended
- Depends on: T01
- Goal: CI fails if any declared foreground/background pair drops below its minimum.
- Scope: a script in `packages/tokens` that reads the token files, converts OKLCH to sRGB, computes WCAG 2.x contrast for a declared list of pairs, and checks the gamut. Pair list and minimums come from DESIGN.md (4.5:1 text, 3:1 control boundaries and focus ring), for both themes.
- Acceptance criteria:
  - [ ] Running it prints each pair, its ratio and its minimum, and exits non-zero on any failure
  - [ ] It reports any color outside sRGB
  - [ ] Unit tests cover the OKLCH conversion and the ratio calculation against known reference values
  - [ ] Wired into `pnpm test` and into CI
  - [ ] Adding a semantic color without a declared pair fails the script (so new colors cannot skip the check)

### T03. Storybook app and theme
- Mode: supervised
- Depends on: T01
- Goal: a Storybook that already looks like the brand, before any component exists.
- Scope: Storybook (React + Vite) in `apps/storybook`, with essentials (controls, docs, viewport, backgrounds), a11y addon, interactions, pseudo-states, autodocs from TypeScript types, a custom manager theme per DESIGN.md section 6, a theme switcher (light and dark), an MDX welcome page, and the Foundations stories (color with contrast ratios, typography, spacing, radius, elevation) generated from the token files.
- Acceptance criteria:
  - [ ] `pnpm storybook` runs and `storybook build` produces a static site
  - [ ] Light and dark switch changes tokens everywhere, including docs pages
  - [ ] Foundations stories are generated from token files, with no hand-written tables
  - [ ] The color story shows the contrast ratio next to each pair
  - [ ] The a11y addon is enabled and reports no violations on the foundations stories
  - [ ] The welcome page states the purpose and principles and links to the repo and aleixvidal.dev

### T04. Reference components: Field and Input
- Mode: supervised (a human writes or closely reviews this; it becomes the pattern every other component copies)
- Depends on: T01, T03
- Goal: establish the exact conventions: folder layout, props style, `cva` usage, tokens, stories, tests, accessibility.
- Scope:
  - `Field`: compound component (`Field`, `Field.Label`, `Field.Description`, `Field.Error`) with context that wires `id`, `aria-describedby`, `aria-invalid`, `aria-required`
  - `Input`: native input props, sizes, optional prefix/suffix slot (for example a `$` prompt prefix), invalid, disabled, read-only, loading
  - A shared `cn()` util and a shared hook for field state
- Acceptance criteria:
  - [ ] All states from AGENTS.md section 5 implemented and each has a story
  - [ ] The error message is announced to assistive tech and linked to the input programmatically
  - [ ] No layout shift when the error or description appears (decide how space is reserved, document the trade-off in the PR)
  - [ ] Focus ring uses the `focus.ring` token and is visible in both themes
  - [ ] Controlled and uncontrolled usage both tested; works with react-hook-form (include a test)
  - [ ] An interaction story shows a validation flow with a `play` function
  - [ ] Props are exported as `type`, documented with JSDoc, and autodocs renders them
  - [ ] The PR description lists every convention this component establishes, so they can be copied into the scaffold skill

  ### T04b. Precompiled styles for @aleixvidal/ui
- Mode: supervised
- Depends on: T04
- Goal: anyone who installs the package gets styled components with one CSS import.
- Acceptance criteria:
  - [ ] packages/ui builds dist/styles.css with Tailwind, including the token variables, with no preflight or reset
  - [ ] tokens stays private and is bundled at build time
  - [ ] package.json exports "./styles.css" and marks CSS files in sideEffects, so the JS stays tree-shakeable and the CSS import is never dropped
  - [ ] A consumer smoke test imports the built package and styles.css in a clean app and checks that Input renders with the token values and that data-theme switches the theme
  - [ ] Usage documented in the package README
  - [ ] A changeset is added

### T05. CI, quality gates and deploy
- Mode: supervised for secrets and DNS (human-only actions above), unattended for the workflow files
- Depends on: T00, T02, T03
- Goal: every PR is checked automatically and `main` deploys the Storybook.
- Scope: GitHub Actions for lint, typecheck, test, build, `storybook build`, contrast gate; Chromatic visual regression; `size-limit` budgets; Lighthouse CI against the built Storybook; Changesets release workflow; deploy of the static Storybook to the subdomain.
- Acceptance criteria:
  - [ ] A PR cannot merge while any check fails
  - [ ] Chromatic runs on PRs and reports visual changes
  - [ ] `pnpm size` fails when a budget is exceeded; budgets are defined per entry point
  - [ ] Lighthouse CI runs on the static Storybook with Performance and Accessibility thresholds set in config, documented in the README
  - [ ] The release workflow versions and publishes with Changesets
  - [ ] The Storybook is reachable at the chosen subdomain
    - [ ] Storybook accessibility checks run in CI (addon-vitest with Playwright) and fail the build on any violation, in both themes
      - [ ] size-limit budgets cover both the JS entry points and dist/styles.css
  - [ ] Storybook accessibility checks run in CI (addon-vitest with Playwright) and fail the build on any violation, in both themes
    - [ ] CI runs pnpm check:placeholders and fails on any SCAFFOLD-PLACEHOLDER
  - [ ] CI scaffolds a throwaway component in each variant (native and radix) and checks that it passes lint, typecheck and tests

### T06. Repo-local skill: scaffold-component
- Mode: unattended
- Depends on: T04 merged
- Goal: new components are created consistently without repeating the structure by hand.
- Scope: a skill that, given a component name, creates the folder with component, stories, test and index files following the conventions established in T04, adds the export to the package entry point and creates a changeset stub.
- Acceptance criteria:
  - [ ] Running it for a sample name produces files that pass lint, typecheck and tests with no edits
  - [ ] Generated stories include Default, variants, states and a `play` placeholder with a TODO that fails review until replaced
  - [ ] It is documented in CLAUDE.md

---

## Phase 1: Form components (unattended, in batches)

Rules for every task in this phase:
- Copy the structure and style of Field and Input exactly. Do not invent a new pattern.
- Build on a headless primitive (Radix, or React Aria where Radix has none). Never reimplement focus management, keyboard handling or ARIA by hand.
- Must work inside `Field`, and implement all states from AGENTS.md section 5.
- One PR per component. Each PR follows the definition of done in AGENTS.md section 10.
- Any new dependency must be justified in the PR and fit the size budget.

Launch each batch, review the PRs, merge, then start the next batch.

### Batch 1

#### T10. Textarea
- Depends on: T04
- Acceptance criteria:
  - [ ] All states; optional auto-grow behavior without layout jumps
  - [ ] Character counter (if included) is announced politely, not on every keystroke
  - [ ] Keyboard and resize behavior tested

#### T11. Checkbox
- Depends on: T04
- Acceptance criteria:
  - [ ] Checked, unchecked and indeterminate states, each with a story
  - [ ] Label click and keyboard (Space) toggle it; indeterminate announced correctly
  - [ ] Works in a group and standalone inside `Field`

#### T12. Switch
- Depends on: T04
- Acceptance criteria:
  - [ ] On/off states, disabled, focus-visible, with a label and description
  - [ ] Announced as a switch (correct role and state), toggled with Space
  - [ ] Respects `prefers-reduced-motion` on the thumb transition

### Batch 2

#### T13. RadioGroup
- Depends on: T04
- Acceptance criteria:
  - [ ] Arrow-key navigation and roving focus tested
  - [ ] Group label and per-option description wired through `Field`
  - [ ] Vertical and horizontal layouts, disabled option, invalid group

#### T14. Select
- Depends on: T04
- Acceptance criteria:
  - [ ] Opens and closes with keyboard, type-ahead works, selected value announced
  - [ ] Grouped options, disabled options, placeholder, clear behavior (only if justified)
  - [ ] Popover uses surface tokens and never overflows the viewport; tested at small widths
  - [ ] No layout shift when opened

### Batch 3

#### T15. Slider
- Depends on: T04
- Acceptance criteria:
  - [ ] Single and range modes; keyboard step and page-step behavior tested
  - [ ] Value is exposed to assistive tech; optional visible value label
  - [ ] Touch target size is adequate and tested at small sizes

#### T16. TagInput
- Depends on: T04
- Acceptance criteria:
  - [ ] Add with Enter and comma, remove with Backspace and a per-tag button, paste of several values
  - [ ] Duplicate and max-count handling, each with a story
  - [ ] Added and removed tags are announced to assistive tech
  - [ ] No hand-rolled ARIA that a native or primitive pattern already provides; justify any exception in the PR

#### T17. OTP input
- Depends on: T04
- Acceptance criteria:
  - [ ] Configurable length, paste of a full code, auto-advance and backspace behavior
  - [ ] Works with browser/mobile one-time-code autofill (use the right `autocomplete` value)
  - [ ] Announced as one logical field with a clear label, not as N unrelated inputs
  - [ ] Decide between a small in-house implementation and a library; document the trade-off in the PR and ask before adding a dependency

### Batch 4 (heaviest, last)

#### T18. DatePicker
- Depends on: T04, T14
- Acceptance criteria:
  - [ ] Built on an accessible date primitive (React Aria, since Radix has none); typed entry and calendar popover both work
  - [ ] Keyboard-only flow tested end to end; locale-aware formatting
  - [ ] Min/max, disabled dates, invalid state wired through `Field`
  - [ ] Importable separately or lazy-loadable, with its own size budget

---

## Phase 2: Showcase and publishing

### T20. Realistic form story
- Mode: unattended
- Depends on: Phase 1 complete (or at least T10 to T14)
- Goal: show the components behaving as a system.
- Acceptance criteria:
  - [ ] A full form using the components with react-hook-form and schema validation
  - [ ] Stories for: pristine, validation errors, submitting, success, server error
  - [ ] Interaction `play` functions cover the keyboard-only path and the error path
  - [ ] All example copy and sample data is generic or fictional (AGENTS.md section 13)

### T21. Accessibility and quality pass
- Mode: supervised
- Depends on: T20
- Acceptance criteria:
  - [ ] Manual keyboard and screen-reader check of every component, with findings written down
  - [ ] a11y addon clean on all stories in both themes
  - [ ] Contrast gate green; size budgets green; Lighthouse thresholds met on the built Storybook

### T22. Documentation and README
- Mode: unattended, then supervised review
- Depends on: T21
- Acceptance criteria:
  - [ ] README with screenshots or GIFs, quick start, the principles, and a short "why these decisions" section
  - [ ] Each component has a "when to use / when not to use" note in its docs
  - [ ] A contributing note explaining how to add a component with the scaffold skill
  - [ ] Honest section on trade-offs and known limitations

### T23. First release and publish
- Mode: supervised
- Depends on: T21, T22 and the human-only actions
- Acceptance criteria:
  - [ ] Package published at version 0.1.0 via the release workflow, with types and ESM output
  - [ ] Consumer smoke test: a fresh app installs the package, imports a component and its CSS, and renders it
  - [ ] Storybook is live at the subdomain and linked from aleixvidal.dev and the README

---

## Prompt templates (paste into Claude Code or Copilot in VSCode)

Single task:

```
Read AGENTS.md, CLAUDE.md, DESIGN.md and BACKLOG.md.
Implement task <ID> from BACKLOG.md and nothing else.
Follow the conventions of the reference components (Field and Input). Plan first and list the files you will touch.
Run lint, typecheck, test, build and storybook build and report the real results.
If a decision is ambiguous and hard to reverse, stop and write the options instead of guessing.
Open a PR on a branch named feat/<name> with the description format from AGENTS.md section 11.
```

Batch of components:

```
Read AGENTS.md, CLAUDE.md, DESIGN.md and BACKLOG.md.
Implement tasks <ID>, <ID> and <ID>, one branch and one PR each, sequentially.
Do not start the next task until the previous one has all quality gates green.
Stop and report if any gate fails after a few attempts. Do not weaken checks to make them pass.
```

Review (run on each PR before you read it):

```
Review this PR against the definition of done in AGENTS.md section 10 and the acceptance criteria of task <ID> in BACKLOG.md.
List each criterion as met, not met or unverified, with evidence. Do not fix anything; report only.
```
