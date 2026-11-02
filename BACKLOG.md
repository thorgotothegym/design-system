# BACKLOG.md

Ordered work plan for the design system. One task = one branch = one PR.
Read AGENTS.md, CLAUDE.md and DESIGN.md before starting any task. Those files define the conventions; this file defines the work.

How to use it:
- Work top to bottom. Do not start a task whose dependencies are not merged.
- `Mode: supervised` means a human reviews or writes it before anything is delegated. `Mode: unattended` means an agent can run it alone and open a PR.
- Every task is done only when its acceptance criteria AND the definition of done in AGENTS.md section 10 are met.
- If a task is ambiguous and hard to reverse, stop and write the options in the PR (AGENTS.md section 14).
- A ticked criterion names the PR that did it. **(human)** marks an action only a person can take.

State on 2026-11-01: Phase 0 and Phase 1 are done, and T20 is done. T21, T22 and T23 are open.

## Human-only actions (an agent cannot or should not do these)

- [ ] **(human)** Make the GitHub repository public and choose a license (MIT is the usual default for a portfolio library). Part of T23.
- [x] **(human)** Create the Chromatic project and add its token as a GitHub Actions secret (`CHROMATIC_PROJECT_TOKEN`; used since #41)
- [ ] **(human)** Add the same token as a Dependabot secret (Settings, Secrets and variables, Dependabot, `CHROMATIC_PROJECT_TOKEN`), so Chromatic runs on Dependabot pull requests (AGENTS.md section 4)
- [x] **(human)** Create the Vercel project for the static Storybook and connect the repo (#31)
- [x] **(human)** Add the subdomain DNS record at the domain registrar: `design.aleixvidal.dev` (#31)
- [ ] **(human)** Reserve the npm scope for the package name and add the publish token as a GitHub secret. Part of T23.
- [ ] **(human)** Final check that no employer-related content is present (AGENTS.md section 13) before making the repo public. The automated scan of 2026-11-01 (files, git history and PR texts) found no hits.

---

## Phase 0: Foundation (supervised)

### T00. Repo bootstrap (#1)
- Mode: supervised
- Depends on: none
- Goal: a working empty monorepo that builds, lints and tests.
- Naming: the repository is called `design-system`. The root `package.json` name is `design-system` (private). The published package stays `@aleixvidal/ui`.
- Scope: pnpm workspaces, Turborepo, TypeScript strict (shared base tsconfig), ESLint shared config, Prettier, Vitest, Changesets, `.gitignore`, `.editorconfig`, Node version file, root scripts from AGENTS.md section 4. Packages created empty: `packages/tokens`, `packages/ui`, `packages/eslint-config`; app: `apps/storybook`.
- Acceptance criteria:
  - [x] `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass from a clean clone (#1)
  - [x] ESLint enforces `@typescript-eslint/consistent-type-definitions: ['error', 'type']`, and `interface` is rejected by a test file in CI (#1, #6)
  - [x] ESLint forbids `any` and non-null assertions (#1)
  - [x] `packages/ui` has no dependency on Next.js or any router (#1)
  - [x] Turbo caches `build`, `lint`, `typecheck`, `test` (second run is a cache hit) (#1)
  - [x] Package names and scope match AGENTS.md (#1). Each `package.json` declares its own name; they are not set in one place.

### T01. Tokens package from DESIGN.md (#2, #3)
- Mode: supervised (review the generated values against DESIGN.md)
- Depends on: T00
- Goal: tokens are the single source of truth, generated into CSS variables, a typed TS module and a Tailwind preset.
- Scope: palette layer (OKLCH), semantic layer with light and dark values exactly as in DESIGN.md sections 2.1 and 2.2, plus spacing (4px grid), radius (base 0.25rem and its derived scale), typography (mono family, scale, weights, line heights) and elevation. Build with Style Dictionary (check the current docs for config and token format).
- Acceptance criteria:
  - [x] Every semantic token in DESIGN.md exists, with matching light and dark OKLCH values (#2; re-checked 2026-11-01, no drift)
  - [x] Components can reference only semantic tokens; the palette is not exported for component use (#2)
  - [x] Output includes CSS custom properties, a typed TS export and a Tailwind preset (#2)
  - [x] Theme switch works with a single attribute or class on the root (`data-theme`) (#2)
  - [x] Token names are typed so a typo is a compile error in `packages/ui` (#2)
  - [x] A changeset is added (#2)

### T02. Contrast gate (#5)
- Mode: unattended
- Depends on: T01
- Goal: CI fails if any declared foreground/background pair drops below its minimum.
- Scope: a script in `packages/tokens` that reads the token files, converts OKLCH to sRGB, computes WCAG 2.x contrast for a declared list of pairs, and checks the gamut. Pair list and minimums come from DESIGN.md (4.5:1 text, 3:1 control boundaries and focus ring), for both themes.
- Acceptance criteria:
  - [x] Running it prints each pair, its ratio and its minimum, and exits non-zero on any failure (#5)
  - [x] It reports any color outside sRGB (#5)
  - [x] Unit tests cover the OKLCH conversion and the ratio calculation against known reference values (#5)
  - [x] Wired into `pnpm test` (#5) and into CI (#25)
  - [x] Adding a semantic color without a declared pair fails the script (so new colors cannot skip the check) (#5)

### T03. Storybook app and theme (#7)
- Mode: supervised
- Depends on: T01
- Goal: a Storybook that already looks like the brand, before any component exists.
- Scope: Storybook (React + Vite) in `apps/storybook`, with essentials (controls, docs, viewport, backgrounds), a11y addon, interactions, pseudo-states, autodocs from TypeScript types, a custom manager theme per DESIGN.md section 6, a theme switcher (light and dark), an MDX welcome page, and the Foundations stories (color with contrast ratios, typography, spacing, radius, elevation) generated from the token files.
- Acceptance criteria:
  - [x] `pnpm storybook` runs and `storybook build` produces a static site (#7)
  - [x] Light and dark switch changes tokens everywhere, including docs pages (#7; in one frame, without reloading docs pages, #34)
  - [x] Foundations stories are generated from token files, with no hand-written tables (#7)
  - [x] The color story shows the contrast ratio next to each pair (#7, #32)
  - [x] The a11y addon is enabled and reports no violations on the foundations stories (#7; enforced in CI, #25)
  - [x] The welcome page states the purpose and principles and links to the repo and aleixvidal.dev (#7)

### T04. Reference components: Field and Input (#8)
- Mode: supervised (a human writes or closely reviews this; it becomes the pattern every other component copies)
- Depends on: T01, T03
- Goal: establish the exact conventions: folder layout, props style, `cva` usage, tokens, stories, tests, accessibility.
- Scope:
  - `Field`: compound component (`Field`, `Field.Label`, `Field.Description`, `Field.Error`) with context that wires `id`, `aria-describedby`, `aria-invalid`, `aria-required`
  - `Input`: native input props, sizes, optional prefix/suffix slot (for example a `$` prompt prefix), invalid, disabled, read-only, loading
  - A shared `cn()` util and a shared hook for field state
- Acceptance criteria:
  - [x] All states from AGENTS.md section 5 implemented and each has a story (#8)
  - [x] The error message is announced to assistive tech and linked to the input programmatically (#8)
  - [x] No layout shift when the error or description appears (space reserved; trade-off in the PR) (#8)
  - [x] Focus ring uses the `focus.ring` token and is visible in both themes (#8, #22)
  - [x] Controlled and uncontrolled usage both tested; works with react-hook-form (include a test) (#8)
  - [x] An interaction story shows a validation flow with a `play` function (#8)
  - [x] Props are exported as `type`, documented with JSDoc, and autodocs renders them (#8)
  - [x] The PR description lists every convention this component establishes, so they can be copied into the scaffold skill (#8)

### T04b. Precompiled styles for @aleixvidal/ui (#9)
- Mode: supervised
- Depends on: T04
- Goal: anyone who installs the package gets styled components with one CSS import.
- Acceptance criteria:
  - [x] packages/ui builds dist/styles.css with Tailwind, including the token variables, with no preflight or reset (#9)
  - [x] tokens stays private and is bundled at build time (#9)
  - [x] package.json exports "./styles.css" and marks CSS files in sideEffects, so the JS stays tree-shakeable and the CSS import is never dropped (#9)
  - [x] A consumer smoke test imports the built package and styles.css in a clean app and checks that Input renders with the token values and that data-theme switches the theme (#9; in CI, #25)
  - [x] Usage documented in the package README (#9)
  - [x] A changeset is added (#9)

### T05. CI, quality gates and deploy
- Mode: supervised for secrets and DNS (human-only actions above), unattended for the workflow files
- Depends on: T00, T02, T03
- Goal: every PR is checked automatically and `main` deploys the Storybook.
- Done in three parts: T05a, T05b and T05c below. What is still open of the original scope:
  - [ ] A PR cannot merge while any check fails. `ci-success` exists (#25) but cannot be required while the repository is private on the free plan: branch protection is part of T23.
  - [ ] The release workflow versions and publishes with Changesets: part of T23. Its dry run already runs on every PR (`release` job, #40).

#### T05a. CI workflow (#25)
- [x] GitHub Actions for lint, typecheck, test, build and `storybook build`, with the contrast gate in `pnpm test` (#25)
- [x] `pnpm size` fails when a budget is exceeded; budgets are defined per entry point and cover `dist/styles.css` (#9, #25; headroom #38)
- [x] Storybook accessibility checks run in CI (addon-vitest with Playwright) and fail the build on any violation, in both themes (#25)
- [x] CI runs `pnpm check:placeholders` and fails on any SCAFFOLD-PLACEHOLDER (#25)
- [x] CI scaffolds a throwaway component in each variant (all five) and checks that it passes lint, typecheck and tests, never from the Turborepo cache (#25, #30)
- [x] A single `ci-success` check waits for every job (#25)
- [x] The `changeset` and `release` jobs: a published change needs a changeset, and `changeset version` succeeds over every pending changeset (#25, #40)

#### T05b. Visual regression, Lighthouse CI and Dependabot (#41)
- [x] Chromatic runs on PRs and reports visual changes, both themes as modes; on `main` changes are accepted; its own status check, not in `ci-success` (#41)
- [x] Lighthouse CI runs on the static Storybook with Performance and Accessibility thresholds set in `lighthouserc.json`, part of `ci-success` (#41). Documenting the thresholds in the README is part of T22.
- [x] Dependabot for npm and GitHub Actions, pinned dependencies in their own PRs, and no changeset needed for a dev-only update (#41)

#### T05c. Deploy (#31)
- [x] The Storybook is reachable at the chosen subdomain, https://design.aleixvidal.dev, deployed by Vercel from `apps/storybook/vercel.json` (#31; first paint fixed in #36)

### T06. Repo-local skill: scaffold-component (#14, #24)
- Mode: unattended
- Depends on: T04 merged
- Goal: new components are created consistently without repeating the structure by hand.
- Scope: a skill that, given a component name, creates the folder with component, stories, test and index files following the conventions established in T04, adds the export to the package entry point and creates a changeset stub.
- Acceptance criteria:
  - [x] Running it for a sample name produces files that pass lint, typecheck and tests with no edits (#14; five variants, #24)
  - [x] Generated stories include Default, variants, states and a `play` placeholder that fails review until replaced. It is a `SCAFFOLD-PLACEHOLDER` marker, which `pnpm check:placeholders` catches, rather than a TODO (#14)
  - [x] It is documented in CLAUDE.md (#14)

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

#### T10. Textarea (#10)
- Depends on: T04
- Acceptance criteria:
  - [x] All states; optional auto-grow behavior without layout jumps (#10)
  - [x] Character counter (if included) is announced politely, not on every keystroke: not included, additive later (#10)
  - [x] Keyboard and resize behavior tested (#10)

#### T11. Checkbox (#11)
- Depends on: T04
- Acceptance criteria:
  - [x] Checked, unchecked and indeterminate states, each with a story (#11)
  - [x] Label click and keyboard (Space) toggle it; indeterminate announced correctly (#11)
  - [x] Works in a group and standalone inside `Field` (#11, #13)

#### T12. Switch (#12)
- Depends on: T04
- Acceptance criteria:
  - [x] On/off states, disabled, focus-visible, with a label and description (#12)
  - [x] Announced as a switch (correct role and state), toggled with Space (#12; never `aria-required`, #15)
  - [x] Respects `prefers-reduced-motion` on the thumb transition (#12)

### Batch 2

#### T13. RadioGroup (#16)
- Depends on: T04
- Acceptance criteria:
  - [x] Arrow-key navigation and roving focus tested (#16)
  - [x] Group label and per-option description wired through `Field` (#16)
  - [x] Vertical and horizontal layouts, disabled option, invalid group (#16)

#### T14. Select (#17)
- Depends on: T04
- Acceptance criteria:
  - [x] Opens and closes with keyboard, type-ahead works, selected value announced (#17)
  - [x] Grouped options, disabled options, placeholder; no clear button, not justified (documented alternative) (#17)
  - [x] Popover uses surface tokens and never overflows the viewport; tested at small widths (#17)
  - [x] No layout shift when opened (#17)

### Batch 3

#### T15. Slider (#18)
- Depends on: T04
- Acceptance criteria:
  - [x] Single and range modes; keyboard step and page-step behavior tested (#18)
  - [x] Value is exposed to assistive tech; optional visible value label (#18)
  - [x] Touch target size is adequate and tested at small sizes (#18)

#### T16. TagInput (#19)
- Depends on: T04
- Acceptance criteria:
  - [x] Add with Enter and comma, remove with Backspace and a per-tag button, paste of several values (#19)
  - [x] Duplicate and max-count handling, each with a story (#19)
  - [x] Added and removed tags are announced to assistive tech (#19)
  - [x] No hand-rolled ARIA that a native or primitive pattern already provides; exceptions justified in the PR (#19)

#### T17. OTP input (#20)
- Depends on: T04
- Acceptance criteria:
  - [x] Configurable length, paste of a full code, auto-advance and backspace behavior (#20)
  - [x] Works with browser/mobile one-time-code autofill (`autocomplete="one-time-code"`) (#20)
  - [x] Announced as one logical field with a clear label, not as N unrelated inputs (#20)
  - [x] In-house versus library decided and documented in the PR (`input-otp`, approved, own entry point) (#20)

### Batch 4 (heaviest, last)

#### T18. DatePicker (#21)
- Depends on: T04, T14
- Acceptance criteria:
  - [x] Built on an accessible date primitive (React Aria, since Radix has none); typed entry and calendar popover both work (#21; partial dates report null, #29; placeholder contrast, #37)
  - [x] Keyboard-only flow tested end to end; locale-aware formatting (#21, #28)
  - [x] Min/max, disabled dates, invalid state wired through `Field` (#21)
  - [x] Importable separately, with its own size budget (`@aleixvidal/ui/date-picker`) (#21)

---

## Phase 2: Showcase and publishing

### T20. Realistic form story (#30)
- Mode: unattended
- Depends on: Phase 1 complete (or at least T10 to T14)
- Goal: show the components behaving as a system.
- Acceptance criteria:
  - [x] A full form using the components with react-hook-form validation: per-field built-in rules, no schema library (no cross-field rules; decided in #30)
  - [x] Stories for: pristine, validation errors, submitting, success, server error (#30)
  - [x] Interaction `play` functions cover the keyboard-only path and the error path (#30; waits fixed in #35)
  - [x] All example copy and sample data is generic or fictional (AGENTS.md section 13) (#30). "Ada Lovelace" in the sample data is a historical person; replace it if fictional-only is required.

### T21. Accessibility and quality pass
- Mode: supervised
- Depends on: T20
- Acceptance criteria:
  - [ ] **(human)** Manual keyboard and screen-reader check (VoiceOver and NVDA) of every component, with findings written down. Nothing has been checked with a real screen reader yet (#17, #18, #19). Steps and expected content: the checklist in [docs/accessibility.md](docs/accessibility.md#manual-verification-checklist); the automated part of the audit and its findings (A11Y-01 to A11Y-14) are in the same file.
  - [x] a11y addon clean on all stories in both themes (the `a11y` CI job, #25)
  - [x] Contrast gate green; size budgets green; Lighthouse thresholds met on the built Storybook (CI, #41)
  - [ ] Clicking the label of Slider, RadioGroup and DatePicker does nothing (the control is not labelable; #16, #18, #21): decide whether to focus the control, and test it
  - [ ] Textarea `autoGrow` in Firefox (falls back to `rows` and resize; only Chrome was tested, #10)
  - [ ] Checkbox target size: the 20px box meets 24px only through its label (#11); decide for a checkbox without a visible label
  - [ ] `Field.Description` under server rendering: it registers in a layout effect, so the control does not reference it until hydration (#8); check and document or fix
  - [ ] A `required` `Field` around a Switch still shows the required marker (#15); decide whether `Field.Label` should hide it
  - [ ] Review the `aria-hidden-focus` exceptions in the open Select and DatePicker stories (#17, #21): still a false positive, still needed

### T22. Documentation and README
- Mode: unattended, then supervised review
- Depends on: T21
- Acceptance criteria:
  - [ ] README with screenshots or GIFs, quick start, the principles, and a short "why these decisions" section. The root README still calls Storybook a placeholder (T03).
  - [x] Each component has a "when to use / when not to use" note in its Storybook docs (each component's docs description)
  - [ ] Install and usage per component in the README, with its "when to use" note, the subpath imports (`@aleixvidal/ui/otp-input`, `@aleixvidal/ui/date-picker`) and `styles.css`
  - [ ] Notes for consumers: the CSS cascade layers of `styles.css` (already in `packages/ui/README.md`) and that the token theme sets `--color-*: initial` (#2)
  - [ ] The CSP and nonce note for OtpInput and DatePicker (already in `packages/ui/README.md`), linked from the root README
  - [ ] The Lighthouse thresholds (T05b) in the README
  - [ ] A contributing note explaining how to add a component with the scaffold skill
  - [ ] Honest section on trade-offs and known limitations

### T23. First release and publish
- Mode: supervised
- Depends on: T21, T22 and the human-only actions
- Acceptance criteria:
  - [ ] Package published at version 0.1.0 via the release workflow (`.github/workflows/release.yml`, still to write), with types and ESM output
  - [ ] Consumer smoke test: a fresh app installs the package, imports a component and its CSS, and renders it (from the registry; the packed-package test runs in CI, #25)
  - [ ] Storybook is live at the subdomain (done, #31) and linked from aleixvidal.dev and the README
  - [ ] Publish fields in `packages/ui/package.json`: `publishConfig`, `license`, `repository`, `keywords`, `description`, `homepage`
  - [ ] Delete the six changesets that name only the private `@aleixvidal/tokens` (`add-design-tokens`, `contrast-border-control-surface`, `contrast-date-picker-states`, `spacing-scale-only`, `storybook-token-exports`, `z-dropdown-token`): Changesets never consumes them (#40)
  - [ ] Review the generated `CHANGELOG.md` before publishing (dry run in #40)
  - [ ] The `.d.ts` files of `@aleixvidal/tokens/contrast` import with a `.ts` extension (#7): check that the published types of `@aleixvidal/ui` do not depend on them
  - [ ] **(human)** License chosen and `LICENSE` added
  - [ ] **(human)** npm scope reserved and the publish token added as a GitHub secret
  - [ ] **(human)** Repository made public
  - [ ] **(human)** Branch protection on `main` requiring `ci-success` (available once the repository is public)
  - [ ] **(human)** Link to the Storybook from aleixvidal.dev (not in its served HTML on 2026-11-01)

---

## Future

Not scheduled; each needs a decision first.

- [ ] A read-only mode for the Radix-based controls (RadioGroup, Select, Slider, Switch, Checkbox), which Radix does not provide: the realistic form's ReadOnly story disables them instead
- [ ] Review the docs renderer wrapper when moving to Storybook 11 (`apps/storybook/.storybook/docs-renderer.ts`, `docs/theme-switch.md`): the reload fix is in 11.0.0-alpha.7+, the remount is not fixed upstream
- [ ] Make TurboSnap precise if the Chromatic allowance becomes a problem: resolve `@aleixvidal/ui` and `@aleixvidal/tokens` to their sources in the Storybook build and drop the `externals` (AGENTS.md section 4, Chromatic)
- [ ] Run the generated stories in the browser in the scaffold job (today it runs lint, typecheck and unit tests only)
- [ ] Move `viewportResized()` from `select.stories.tsx` to `packages/ui/src/test/` when a second story needs it

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
