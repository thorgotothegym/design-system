# AGENTS.md

Instructions for AI coding agents (Claude Code, GitHub Copilot, etc.) working in this repository.
Humans: see README.md. This file is the single source of truth for conventions.

## 1. Project purpose

A production-style React design system, built as a public portfolio piece. It has three goals:

1. Show my frontend and design-system skills.
2. Show companies how I structure, document, test and ship a component library.
3. Be published as a static Storybook at a subdomain of aleixvidal.dev, with the source on GitHub.

Priority is **quality and clarity over quantity**: few components, each one complete (all states, accessible, documented, tested).
Anyone reading this repo should be able to understand *why* each decision was made.

Work as a senior React/TypeScript engineer would: simple over clever, small public APIs, composition over configuration, and no code you cannot justify in a code review.

## 2. Stack

- React + TypeScript (strict mode)
- pnpm workspaces + Turborepo
- Storybook (React + Vite builder) with autodocs
- Headless primitives: Radix UI (or React Aria where Radix has no equivalent). Never reimplement focus management, keyboard navigation or ARIA by hand.
- Styling: Tailwind CSS driven by design tokens, plus `class-variance-authority`, `clsx`, `tailwind-merge`
- Tokens: Style Dictionary (source of truth in `packages/tokens`)
- Tests: Vitest + Testing Library; Storybook `play` functions for interaction flows
- Build: `tsup` for `packages/ui`
- Versioning: Changesets
- CI: GitHub Actions (`ci.yml`, with Lighthouse CI on the built Storybook), visual regression with Chromatic (`chromatic.yml`), dependency updates with Dependabot. A release workflow is planned for the first release (T23)

**Do not trust memory for library APIs.** Radix, Storybook, Tailwind and Style Dictionary change often.
Check the current docs (Context7 MCP if available, otherwise the official docs) before using an API you are not sure about.
Exact versions are pinned in `package.json`; do not bump major versions without being asked.

## 3. Repository layout

The repository is named `design-system` (root package name `design-system`, private). The published package is `@aleixvidal/ui`.

```
apps/
  storybook/          Storybook app (consumes packages/ui)
  docs/               (not created; optional, later) Next.js landing for the design system
packages/
  tokens/             Design tokens (JSON source -> CSS vars / TS / Tailwind preset)
  ui/                 The components (published as @aleixvidal/ui)
  eslint-config/      Shared ESLint config
  typescript-config/  Shared strict tsconfig
.github/workflows/    ci.yml, chromatic.yml (release.yml is planned for the first release, T23)
.github/dependabot.yml
scripts/              repository checks run by the root scripts (check:placeholders, check:release, test:scaffold, ...)
docs/                 deployment.md, theme-switch.md
.changeset/
```

Rules:
- `packages/ui` must NOT depend on Next.js or any routing/framework code. Pure React only.
- `packages/ui` may import from `packages/tokens`. Never the other way round.
- Apps import from the packages' public entry points, never from `src/` paths of another package.

## 4. Commands

Run from the repo root:

```
pnpm install
pnpm dev            # watch builds
pnpm storybook      # run Storybook locally
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm size           # bundle size budgets (size-limit)
pnpm format:check   # prettier --check .
pnpm check:placeholders  # fails on any SCAFFOLD-PLACEHOLDER
pnpm check:release  # `changeset version` dry run over every pending changeset, in a throwaway worktree
pnpm test:storybook # every story in Chromium, both themes: play functions and axe; plus the forced-colors checks
pnpm test:consumer  # the packed package in a clean app, checked in Chrome
pnpm test:scaffold  # one component per scaffold variant, in a throwaway worktree
pnpm lighthouse     # Lighthouse CI on the built Storybook (run pnpm build first; needs Google Chrome)
pnpm changeset      # add a changeset for any user-facing change
```

Before saying a task is done, `pnpm lint && pnpm typecheck && pnpm test && pnpm build` must pass, and so must `storybook build` if you touched stories or components.

### CI

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`, with no secrets, so pull requests from forks run it too. Each job runs the same command you run locally:

| Job | Command |
| --- | --- |
| quality | `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:placeholders` |
| test | `pnpm test` (the coverage thresholds fail the job) |
| build | `pnpm build`, including `storybook build`; the static Storybook is uploaded as the `storybook-static` artifact |
| lighthouse | `pnpm lighthouse` on the `storybook-static` artifact of the build job: `lhci` serves it locally and runs Lighthouse (desktop preset) five times on the Storybook root, the Input docs page and the realistic form story; reports are the `lighthouse-reports` artifact, and the medians are in the job summary. Thresholds in `lighthouserc.json`, on the median: Performance 0.70, 0.90 and 0.84, Accessibility 0.98. They were set a little below the medians measured on the CI runner (root 73–83, Input docs 94–95, realistic form 87–93, Accessibility 100). Locally: `pnpm build`, then `pnpm lighthouse` (needs Google Chrome). Never lower a threshold to make a build pass |
| size | `pnpm size` (every component budget and the CSS budget). A component budget is set about 3–4 % above the measured size, so a small source change or a minor dependency update does not fail it, while a real regression still does. Re-check it when the margin drops below about 3 %. A budget raised further needs a bundle analysis in the PR (what contributes the most bytes). The CSS budget follows the 4 kB review threshold in Performance. |
| a11y | `STORYBOOK_PLAY_DELAY=0 pnpm test:storybook` (Chromium via Playwright: `pnpm --filter @aleixvidal/storybook exec playwright install chromium` once, locally) |
| consumer | `pnpm test:consumer` (needs Google Chrome and the network) |
| scaffold | `pnpm test:scaffold` |
| changeset | `pnpm changeset status --since=origin/main`, on pull requests only. Stories, tests, `src/test/**` and `scripts/**` are not shipped, so they need no changeset (`changedFilePatterns` in `.changeset/config.json`) |
| release | `pnpm check:release`: runs `changeset version` over every pending changeset in a throwaway worktree and fails if it errors, on pull requests and on pushes to `main`. `changeset status --since` only reads the pull request's own changesets, so it cannot see one already on `main` that breaks the release. A changeset names `@aleixvidal/ui` only: `@aleixvidal/tokens` is private, Changesets does not version it, and a changeset that mixes it with `ui` fails (a token change that consumers see is described in the `ui` changeset) |

- `STORYBOOK_PLAY_DELAY` sets the pace of the demo `play` functions (`startDemo()` in `packages/ui/src/test/demo.ts`): milliseconds after each step, 250 when unset, and a pause of 2.4 steps before the first one. CI sets it to `0`. It applies to `pnpm storybook`, `storybook build` and `pnpm test:storybook`.
- A story that logs `console.error` or `console.warn` fails `pnpm test:storybook` (`apps/storybook/.storybook/vitest.setup.ts`), so React's development-only warnings (duplicate keys, invalid props) cannot pass CI silently. Fix the cause; a message that is expected and not ours goes in its `ALLOWED` list with the reason.
- `ci-success` is the single check meant to be required: it waits for every other job and fails if any failed or was cancelled. When you add a job, add it to its `needs`. It cannot be enforced yet: branch protection and rulesets are not available for a private repository on GitHub's free plan. It becomes enforceable (branch protection on `main`, requiring `ci-success`) when the repository goes public (T23). Until then, do not merge a pull request whose `ci-success` is not green.
- `ci.yml` uses no secrets and no remote caches: the Turborepo cache is local, restored with `actions/cache`. Official `actions/*` are pinned by major version; any other action by full commit SHA with the version in a comment on the same line.

#### Chromatic (visual regression)

`.github/workflows/chromatic.yml` publishes the Storybook to Chromatic and compares every story with its accepted baseline, once per mode: `dark` and `light` (`chromatic.modes` in `.storybook/preview.tsx`, through the `theme` global), plus a 320px `narrow dark` mode on the realistic form's `Default` and `WithErrors`. That is 324 snapshots for a full build (165 stories, 4 of them excluded with `chromatic.disableSnapshot` because they depend on today's date or repeat another story's end state).

- **Not part of `ci-success`.** On a pull request a visual change waits for a person to accept it in Chromatic, and the job needs the `CHROMATIC_PROJECT_TOKEN` secret, which pull requests from forks do not get. It is its own status check: when it fails with visual changes (exit code 1), review them in Chromatic (link in the job summary), accept or fix them, and run the job again. On `main` changes are accepted automatically: they were reviewed in the pull request.
- **Budget.** The plan allows a fixed number of snapshots a month (5,000 on the free plan), and each full build costs 324. So the workflow runs only for changes that can alter a story (its `paths` list), not on draft pull requests (it starts when the pull request is marked ready), and not for a merge commit on `main` whose tree is the pull request head, already built there. A newer push to the same pull request cancels the run it replaces. TurboSnap (`onlyChanged`) is on. A change to `packages/ui/src` or anywhere in `packages/tokens` (the token JSON included) still captures every story, because the realistic form and Foundations stories use those packages from `dist/`, which TurboSnap cannot trace.
- **What it costs (estimated 2026-11-01).** About 30 pull requests a month, 2–3 pushes each, plus the merges to `main`, is roughly 105 builds and about 34,000 snapshots without these measures. With them it is about 44 builds and 13,000–14,000 snapshots: the path filter saves little because about 92 % of past pull requests touched those paths, the draft rule assumes 1.5 builds per pull request, and the merge rule skips about 92 % of `main` builds. That is still above the free plan's 5,000. To get under it without weakening the check:
  - **(a)** resolve `@aleixvidal/ui` and `@aleixvidal/tokens` to their sources in the Storybook build, so TurboSnap can trace them and drop the `externals`. Estimate: 4,000–5,000 a month. It changes what the realistic form renders from (source instead of `dist/`), so it needs a decision.
  - **(b)** a paid plan (Starter: 35,000 a month).
  - Running Chromatic less often or with fewer modes would weaken it.
- **Allowance used up.** The CLI exits with 11 (or 12, payment required) and captures nothing. The job then passes with a warning on the run and in its summary saying the commit was not checked. It never looks like a check that ran. Run it again once the allowance resets, before merging anything visual.
- **Dependabot.** Pull requests opened by Dependabot cannot read Actions secrets. The token must also exist as a Dependabot secret: Settings, Secrets and variables, Dependabot, `CHROMATIC_PROJECT_TOKEN`, the same value as the Actions secret. Without it, Chromatic does not run on dependency updates, and their visual changes would be accepted on `main` without review.

#### Dependabot

`.github/dependabot.yml` opens weekly pull requests for npm (the pnpm workspace) and GitHub Actions, with the `chore(deps)` or `chore(deps-dev)` prefix.

- **npm:** majors are never proposed (section 2). Minor and patch updates come grouped in one pull request. The dependencies pinned for a reason come in their own pull requests: Storybook and its addons (an update needs the manual check in `docs/theme-switch.md` and an update of `VERIFIED_STORYBOOK_VERSION`), React Aria with `@internationalized/date` (check the DatePicker stories and budget), `turbo`, and `typescript` (pinned to 6.0.3 in `packages/eslint-config`).
- **GitHub Actions:** grouped, majors included. A SHA-pinned action keeps its version comment on the same line, which Dependabot updates with the SHA.
- **Changesets:** a Dependabot pull request that changes only `devDependencies` or `size-limit` in the published packages' `package.json` needs no changeset. The `changeset` job checks this with `scripts/dependabot-changeset.mts` and passes. An update to `dependencies` or `peerDependencies`, which consumers install, still requires one: add a `patch` changeset to the pull request. Updates to the root, `apps/storybook` and the private packages never need one.

### Deployment

The Storybook deploys to Vercel (https://design.aleixvidal.dev) from `apps/storybook/vercel.json`, which sets the install, build and output, the skipped-build check and the headers. [docs/deployment.md](docs/deployment.md) explains each setting, what must be configured in the Vercel dashboard, and how to reproduce the build locally. The site's public name, byline and tagline are constants in `apps/storybook/src/site.ts`; titles, meta tags, the welcome heading and the Open Graph image derive from them (regenerate the image and favicon with `pnpm --filter @aleixvidal/storybook brand-assets`).

## 5. Component conventions

Every component lives in its own folder with its files side by side:

```
packages/ui/src/components/<name>/
  <name>.tsx
  <name>.stories.tsx
  <name>.test.tsx
  index.ts
```

- File and folder names: `kebab-case`. Component names: `PascalCase`.
- Named exports only. No default exports. Re-export every public component from `packages/ui/src/index.ts`.
  - Exception: a component whose dependency cannot be tree-shaken (the package has no `"sideEffects": false`, so a bundler keeps it for anyone who imports the root entry) ships as its own entry point, `@aleixvidal/ui/<name>`, with a `src/<name>.ts` entry in `tsup.config.ts`, an `exports` entry and its own `size-limit` path. It is not exported from `index.ts`. `OtpInput` (`input-otp`) is the first: exporting it from the root made every other component about 2.7 kB larger. The same applies to a heavy component (see Performance): `DatePicker` (React Aria, about 70 kB brotli) has its own entry point although its dependencies tree-shake.
- Pass `ref` to the DOM element a component wraps. With React 19 `ref` is a regular prop: no `forwardRef`. Spread remaining props onto the root element and merge `className` with `cn()`.
- Props: extend the native element's props (`ComponentPropsWithRef<"input">`, or the primitive's with `ComponentPropsWithRef<typeof Primitive.Root>`) instead of redefining them. Document each prop with a JSDoc comment so autodocs picks it up.
- Variants and sizes: use `cva`. Keep the variant surface small and justified. Do not add a prop "just in case".
- Support both controlled and uncontrolled usage when the component holds state.
- No business logic, no data fetching, no global state, no side effects outside effects tied to the component.
- Prefer composition (compound components, slots) over a growing list of boolean props.

### TypeScript conventions

- Use `type`, never `interface`. This applies to props, state, context values and utility types. Enforced by ESLint: `@typescript-eslint/consistent-type-definitions: ['error', 'type']`.
- Extend with intersections (`type ButtonProps = BaseProps & { ... }`), not `extends`.
- No `any`. Use `unknown` and narrow it. No non-null assertions (`!`) and no `as` casts unless there is a comment explaining why.
- Use `import type` for type-only imports.
- Prefer string-literal unions (`'sm' | 'md' | 'lg'`) over `enum`.
- Derive types from `cva` with `VariantProps<typeof x>` instead of declaring variants twice.
- Export the props type of every public component (`ButtonProps`).
- Declare functions as const arrow functions (`const getLabel = (id: string) => { ... }`), never with the `function` keyword. This applies to components, hooks, helpers and callbacks. Exports stay named. Enforced by ESLint: `func-style: ['error', 'expression']` and `prefer-arrow-callback`.

### Form components specifically

Form controls (Input, Textarea, Select, Checkbox, RadioGroup, Switch, DatePicker, Slider, TagInput, OTP, ...) must:
- Work inside the shared `Field` wrapper (label, helper text, error message, required marker), which wires `id`, `aria-describedby`, `aria-invalid` and `aria-required` automatically.
- Implement ALL these states: default, hover, focus-visible, active, disabled, read-only (where applicable), invalid/error, and loading (where applicable).
- Be usable with react-hook-form and plain controlled state.

## 6. Design tokens

- Never hardcode colors, spacing, radii, font sizes, shadows or z-indexes in components. Use tokens only.
- Use **semantic** tokens in components (`bg.surface`, `text.danger`, `focus.ring`; Tailwind classes such as `bg-bg-surface`), not raw palette values.
- Palette tokens are the lowest layer; semantic tokens reference them; components reference only semantic tokens.
- Dark mode is part of the token system (theme switch via CSS variables), not a per-component afterthought. Every semantic color needs a light and a dark value.
- Changing a token's name or meaning is a breaking change and needs a changeset.
- The one exception to "tokens only" is forced colors (Windows contrast themes). The browser replaces token colors there and paints every background as `Canvas`, so a state shown by a fill disappears. Under the `forced-colors:` variant only, use CSS system colors (`CanvasText`, `Canvas`, `Highlight`, `HighlightText`, `ButtonText`, `GrayText`, `LinkText`, as in `forced-colors:bg-[Highlight]`), and `forced-color-adjust-none` (it only acts under forced colors) where the browser would otherwise repaint them. Never use a system color outside that variant. Each state must still differ by shape, border style or fill versus no fill, not by color alone. The `storybook-forced-colors` test project checks the key states (see docs/accessibility.md).
- Only the 13 spacing steps exist (`0`, `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`; `px` is the 1px keyword). Tailwind does not fail on a class outside them such as `pl-7` or `w-11`: it silently generates no style. `packages/ui/src/test/spacing-scale.test.ts` fails the build on such classes (and on fixed `px`, `rem` or `em` values in arbitrary spacing like `p-[7px]`) in `packages/ui` and `apps/storybook`. Arbitrary values that are not fixed spacing, such as `grid-cols-[auto_1fr]` or `max-h-[10lh]`, and CSS variables in the parenthesis syntax, such as `max-h-(--radix-select-content-available-height)`, are allowed.
- Spacing, typography, radius, color and elevation each get their own documented story in Storybook (use doc blocks, generated from the token files, not hand-written tables).

## 7. Accessibility (non-negotiable)

- Every interactive component is fully operable by keyboard, with a visible focus indicator (`:focus-visible`).
- Focus indicators are an `outline` with `outline-solid` and the `focus.ring` token in the same variant (`focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-focus-ring`). Never use `outline-hidden` or `outline-none`: in Tailwind 4 they remove the outline (`outline-style: none`, also through the `--tw-outline-style` variable that `outline-2` reads) instead of making it transparent, so a focus variant on the same element paints nothing. This has already hidden focus rings twice. An element whose ring is drawn by a wrapper (the `<input>` inside `Input`) uses `outline-transparent`, which also hides the browser's own ring in Chrome; `outline-0` does not. `packages/ui/src/test/outline-removal.test.ts` fails the build on either class in `packages/ui`, `apps/storybook` and the scaffold templates.
- Every state indicator (focus, highlighted, selected, invalid) needs 3:1 non-text contrast (WCAG 1.4.11) against its adjacent colors, in both themes. A background change on its own does not count: two surfaces that are about 1.1:1 apart are not an indicator. Add a border, an inset outline with `focus.ring`, or an icon, and put the indicator/background pair in the contrast gate (`packages/tokens/src/contrast/pairs.ts`). Disabled components are exempt.
- Correct roles, names and states. Use native elements first, ARIA only when needed.
- Text contrast meets WCAG 2.2 AA in both light and dark themes.
- Respect `prefers-reduced-motion`.
- Error messages are programmatically associated with their field and announced to assistive tech.
- The Storybook a11y addon must report no violations for any story. If you believe a violation is a false positive, say so in the PR and explain; do not silently disable the rule.
- The audit of the components, its findings and the manual screen-reader checklist are in [docs/accessibility.md](docs/accessibility.md) (re-run it with `node scripts/a11y-audit.mts`).

## Performance and Core Web Vitals

Core Web Vitals (LCP, CLS, INP) are measured on pages, not on a component library, so they cannot be "watched" directly here.
What we can do is write components that do not hurt them, and enforce it with automated checks:

- **CLS**: never cause layout shift. Reserve space for anything that appears later (error messages, helper text, loading states, icons). Skeletons and placeholders must match the final size. Images and icons always have explicit dimensions.
- **INP**: keep input handlers cheap. No heavy work on every keystroke; debounce or defer it. Do not re-render large trees on each change. Use `useMemo`/`useCallback` only when there is a measured reason.
- **LCP / load cost**: the library must be tree-shakeable (`"sideEffects": false` where true, ESM output, no barrel-induced side effects). Heavy components (DatePicker, anything with large dependencies) must be importable separately or lazy-loadable.
- **Bundle size**: every component has a size budget enforced with `size-limit` in CI. Adding a dependency that grows a component noticeably needs justification in the PR.
- **CSS size**: if the CSS exceeds 4 kB brotli, look for repeated utility patterns to share before raising the budget again.
- **Runtime hygiene**: no layout thrashing, no unnecessary effects, clean up listeners and observers.
- **Storybook site**: Lighthouse CI runs on the built Storybook in CI (the `lighthouse` job, part of `ci-success`; section 4). Thresholds are in `lighthouserc.json`, asserted on the median of five runs: Performance 0.70 on the Storybook root, 0.90 on the Input docs page, 0.84 on the realistic form; Accessibility 0.98 on all three. Do not lower a threshold to make a build pass.

## 8. Storybook conventions

Each component's stories must include:
- `Default` and one story per variant/size
- One story per state (disabled, error, loading, read-only, ...)
- At least one **interaction story** using a `play` function for any component with behavior (validation flow, keyboard navigation, open/close, ...)
- `tags: ['autodocs']` and a short description of when to use it and when not to
- `argTypes` and controls derived from the TypeScript types. Do not duplicate prop tables by hand.

Include a full "realistic form" story that composes the components together (it shows how they behave as a system, not in isolation).

## 9. Testing

Test behavior from the user's point of view, not implementation details.

### Naming and structure
- `describe` takes the component or function name. Every `it` title starts with "should": `it('should show the error message when the field is invalid', ...)`.
- One behavior per test. Inside each test, separate Arrange, Act and Assert with blank lines.
- No test depends on another test or on execution order.

### Queries and interaction
- Query by accessible role first (`getByRole`), then label (`getByLabelText`), then text. `data-testid` is the last resort and needs a comment saying why.
- Use `screen` for queries. Use `userEvent` for every interaction; never `fireEvent`.
- Do not access DOM nodes directly (`container.querySelector`, `.parentElement`).

### Waiting for asynchronous results
After an action whose effect is asynchronous, wait for the observable result with `findBy*` or `waitFor`. Never assert straight after the action, and never add a fixed sleep or a longer timeout. Such an assertion passes on a fast machine and fails under load in CI. These are the patterns found so far, in tests and `play` functions:
- **Focus moved by an effect or a timer.** Radix FocusScope restores focus to the trigger in a `setTimeout` when a popover closes. Radix RovingFocus moves focus in a `setTimeout`. React Aria focuses a calendar day in an effect. Focus placed in a component's own `useEffect` (after removing a tag, an error summary, a step heading) is the same case. Use `await waitFor(() => expect(x).toHaveFocus())`.
- **A value or state reported from an effect.** `input-otp` calls `onComplete` from an effect. A value reported from a `useEffect` (DatePicker) also arrives after the render. Use `waitFor` or `findByText`.
- **Opening a popover, a list or a calendar.** Use `await screen.findByRole(...)`, never `getByRole` straight after the click or key.
- **A viewport resize.** The test runner sets a story's viewport before `play`, but the browser fires `resize` on the next frame, and Radix Select closes on any window resize. A story that runs after a viewport change waits for that frame before opening, with `viewportResized()` in `select.stories.tsx`. Move it to `src/test/` when a second story needs it.

A change made synchronously by a React event handler (a click, a key, submit, blur) is already there when `await userEvent...` resolves. It needs no waiting. ESLint (`testing-library/await-async-events`, `await-async-queries`, `await-async-utils`, `prefer-find-by`, on tests and stories) catches an un-awaited `userEvent`, query or `waitFor`. It cannot catch an assertion made too early, nor an un-awaited call on the instance `startDemo()` returns, so this needs review too.

### What to cover
- Renders, each variant, keyboard interaction, disabled and error states, controlled and uncontrolled usage, and ref/className forwarding.
- Every component also has an automated accessibility check with axe, in addition to the Storybook a11y addon.
- A bug fix includes a test that fails before the fix.

### What not to do
- No snapshot tests of markup.
- No `.only` or `.skip` in merged code.
- Mock only at the edges: network, timers, browser APIs. Never mock the component under test, its children or the headless primitives (Radix, React Aria).
- Do not test private helpers directly; test them through the public behavior.

### Coverage
- Coverage thresholds are enforced by Vitest in CI: 80% for lines and branches in packages/ui as a starting point. Never lower a threshold to pass; raise it when coverage allows.

## 10. Definition of done (per component)

A component is done only when ALL of this is true:
- [ ] Follows the folder and naming convention in section 5
- [ ] Uses semantic tokens only; works in light and dark
- [ ] All states implemented and covered by stories
- [ ] Keyboard and screen reader behavior verified; a11y addon is clean
- [ ] Keyboard-only pass done over every state of the component (Tab, arrows, Space, Enter, Escape): the focus, highlighted, selected and invalid indicators are visible and meet 3:1 in both themes
- [ ] Tests written and passing
- [ ] Uses `type` (no `interface`), no `any`; props type exported
- [ ] No layout shift in any state; size-limit budget respected
- [ ] Props documented via JSDoc; autodocs renders correctly
- [ ] Exported from the package entry point, or from its own entry point (section 5)
- [ ] Changeset added
- [ ] `lint`, `typecheck`, `test`, `build` and `storybook build` pass
- [ ] No SCAFFOLD-PLACEHOLDER left (`pnpm check:placeholders` passes)
- [ ] PR description explains the key design decisions and trade-offs

## 11. Git and PR workflow

- One component or one coherent change per branch and per PR. Keep PRs small and reviewable.
- Branch names: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`.
- Conventional Commits (`feat(ui): add select component`).
- Never push directly to `main`. Never force-push shared branches.
- PR description: what changed, why, how it was verified, screenshots or Storybook link for visual changes.

### Verifying and reporting (lessons learned)

- **A green job is not proof that a check ran.** A check that must execute is never satisfied from the Turborepo cache: run it with `--force` or give the task `cache: false`, and print the cache line (`cache bypass, force executing`) so the log shows it ran.
- **Never re-run a failed job to get it green.** Report the failing job and its log, and find the cause. Re-running is for a documented step, such as Chromatic after its changes are accepted.
- **A script that reads a status field is not a verification.** Check the observable result: the rendered pixels, the computed color, the focused element, the served header.
- **Never print or paste a token** (Chromatic, Vercel, npm, GitHub) in a log, a chat, a screenshot, a commit or a file. Pass it from secrets through `env`.
- **Storybook tests fail on any `console.error` or `console.warn`** (section 4, CI): fix the cause rather than silencing it.
- **In `play` functions and tests, wait for the observable result of an action** (section 9, "Waiting for asynchronous results").
- **Changesets treat private workspace packages as ignored.** A changeset never names `@aleixvidal/tokens` (or any private package) together with `@aleixvidal/ui`; describe a token change consumers see in the `ui` changeset (section 4, the `release` job).
- **Pinned versions are updated in their own pull request**, with their check: Storybook needs the manual check in `docs/theme-switch.md` and a new `VERIFIED_STORYBOOK_VERSION`; `react-aria-components` needs the DatePicker stories and budget; `turbo` and `typescript` (6.0.3 in `packages/eslint-config`) need the full CI.

## 12. Things NOT to do

- Do not add dependencies without a clear reason. Justify every new one in the PR.
- Do not introduce a second styling approach, a second state library or a second test framework.
- Do not copy code from other design systems or UI kits verbatim. Use them as reference, but write and adapt it here, and keep licenses in mind.
- Do not disable lint rules, TypeScript checks or a11y rules to make something pass.
- Do not leave `TODO`, commented-out code, `console.log`, or `any` in merged code.
- Do not over-engineer: no abstraction layers, config systems or generic utilities that nothing currently needs.
- Do not touch unrelated files or reformat code you were not asked to change.

## 13. Employer and confidentiality safety

This repository is owned by an individual and is meant to be public (it is private until the first release, T23). Never include anything from any current or past employer:
no code, component names, internal product names, business data, client names, screenshots or assets.
All example content (form copy, sample data, product names) must be generic or fictional.

## 14. Working unattended

When running without a human in the loop:
- Take the smallest reasonable interpretation of the task and state it at the top of the PR.
- If a decision is genuinely ambiguous AND hard to reverse (public API shape, a token rename, a new dependency, a licensing question), stop, write down the options in the PR or a note, and do not guess.
- If the quality gates fail and you cannot fix them within a few attempts, stop and report what is failing and what you tried, instead of weakening the checks.
- Never mark a task complete if anything in section 10 is unverified. Say what is missing instead.
- Report real results: the output of the command, the run and job, and the duration. Follow section 11, "Verifying and reporting".
