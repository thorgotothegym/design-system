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
- CI: GitHub Actions; visual regression with Chromatic

**Do not trust memory for library APIs.** Radix, Storybook, Tailwind and Style Dictionary change often.
Check the current docs (Context7 MCP if available, otherwise the official docs) before using an API you are not sure about.
Exact versions are pinned in `package.json`; do not bump major versions without being asked.

## 3. Repository layout

The repository is named `design-system` (root package name `design-system`, private). The published package is `@aleixvidal/ui`.

```
apps/
  storybook/          Storybook app (consumes packages/ui)
  docs/               (optional, later) Next.js landing for the design system
packages/
  tokens/             Design tokens (JSON source -> CSS vars / TS / Tailwind preset)
  ui/                 The components (published as @aleixvidal/ui)
  eslint-config/      Shared ESLint config
.github/workflows/    ci.yml, chromatic.yml, release.yml
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
pnpm changeset      # add a changeset for any user-facing change
```

Before saying a task is done, `pnpm lint && pnpm typecheck && pnpm test && pnpm build` must pass, and so must `storybook build` if you touched stories or components.

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
- Forward refs on components that wrap a DOM element. Spread remaining props onto the root element and merge `className` with `cn()`.
- Props: extend the native element's props (`React.ComponentPropsWithoutRef<'input'>`) instead of redefining them. Document each prop with a JSDoc comment so autodocs picks it up.
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

### Form components specifically

Form controls (Input, Textarea, Select, Checkbox, RadioGroup, Switch, DatePicker, Slider, TagInput, OTP, ...) must:
- Work inside the shared `Field` wrapper (label, helper text, error message, required marker), which wires `id`, `aria-describedby`, `aria-invalid` and `aria-required` automatically.
- Implement ALL these states: default, hover, focus-visible, active, disabled, read-only (where applicable), invalid/error, and loading (where applicable).
- Be usable with react-hook-form and plain controlled state.

## 6. Design tokens

- Never hardcode colors, spacing, radii, font sizes, shadows or z-indexes in components. Use tokens only.
- Use **semantic** tokens in components (`color.bg.surface`, `color.text.danger`, `color.border.focus`), not raw palette values (`blue-500`).
- Palette tokens are the lowest layer; semantic tokens reference them; components reference only semantic tokens.
- Dark mode is part of the token system (theme switch via CSS variables), not a per-component afterthought. Every semantic color needs a light and a dark value.
- Changing a token's name or meaning is a breaking change and needs a changeset.
- Spacing, typography, radius, color and elevation each get their own documented story in Storybook (use doc blocks, generated from the token files, not hand-written tables).

## 7. Accessibility (non-negotiable)

- Every interactive component is fully operable by keyboard, with a visible focus indicator (`:focus-visible`).
- Correct roles, names and states. Use native elements first, ARIA only when needed.
- Text contrast meets WCAG 2.2 AA in both light and dark themes.
- Respect `prefers-reduced-motion`.
- Error messages are programmatically associated with their field and announced to assistive tech.
- The Storybook a11y addon must report no violations for any story. If you believe a violation is a false positive, say so in the PR and explain; do not silently disable the rule.

## Performance and Core Web Vitals

Core Web Vitals (LCP, CLS, INP) are measured on pages, not on a component library, so they cannot be "watched" directly here.
What we can do is write components that do not hurt them, and enforce it with automated checks:

- **CLS**: never cause layout shift. Reserve space for anything that appears later (error messages, helper text, loading states, icons). Skeletons and placeholders must match the final size. Images and icons always have explicit dimensions.
- **INP**: keep input handlers cheap. No heavy work on every keystroke; debounce or defer it. Do not re-render large trees on each change. Use `useMemo`/`useCallback` only when there is a measured reason.
- **LCP / load cost**: the library must be tree-shakeable (`"sideEffects": false` where true, ESM output, no barrel-induced side effects). Heavy components (DatePicker, anything with large dependencies) must be importable separately or lazy-loadable.
- **Bundle size**: every component has a size budget enforced with `size-limit` in CI. Adding a dependency that grows a component noticeably needs justification in the PR.
- **Runtime hygiene**: no layout thrashing, no unnecessary effects, clean up listeners and observers.
- **Storybook site**: run Lighthouse CI against the built Storybook (static) in CI and keep Performance and Accessibility scores above the thresholds set in `lighthouserc`. Do not lower thresholds to make a build pass.

## 8. Storybook conventions

Each component's stories must include:
- `Default` and one story per variant/size
- One story per state (disabled, error, loading, read-only, ...)
- At least one **interaction story** using a `play` function for any component with behavior (validation flow, keyboard navigation, open/close, ...)
- `tags: ['autodocs']` and a short description of when to use it and when not to
- `argTypes` and controls derived from the TypeScript types. Do not duplicate prop tables by hand.

Include a full "realistic form" story that composes the components together (it shows how they behave as a system, not in isolation).

## 9. Testing

- Test behavior from the user's point of view (Testing Library queries by role/label), not implementation details.
- Cover: renders, each variant, keyboard interaction, disabled/error states, controlled and uncontrolled usage, and ref/className forwarding.
- Do not write tests that only assert snapshots of markup.
- A bug fix includes a test that fails before the fix.

## 10. Definition of done (per component)

A component is done only when ALL of this is true:
- [ ] Follows the folder and naming convention in section 5
- [ ] Uses semantic tokens only; works in light and dark
- [ ] All states implemented and covered by stories
- [ ] Keyboard and screen reader behavior verified; a11y addon is clean
- [ ] Tests written and passing
- [ ] Uses `type` (no `interface`), no `any`; props type exported
- [ ] No layout shift in any state; size-limit budget respected
- [ ] Props documented via JSDoc; autodocs renders correctly
- [ ] Exported from the package entry point
- [ ] Changeset added
- [ ] `lint`, `typecheck`, `test`, `build` and `storybook build` pass
- [ ] PR description explains the key design decisions and trade-offs

## 11. Git and PR workflow

- One component or one coherent change per branch and per PR. Keep PRs small and reviewable.
- Branch names: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`.
- Conventional Commits (`feat(ui): add select component`).
- Never push directly to `main`. Never force-push shared branches.
- PR description: what changed, why, how it was verified, screenshots or Storybook link for visual changes.

## 12. Things NOT to do

- Do not add dependencies without a clear reason. Justify every new one in the PR.
- Do not introduce a second styling approach, a second state library or a second test framework.
- Do not copy code from other design systems or UI kits verbatim. Use them as reference, but write and adapt it here, and keep licenses in mind.
- Do not disable lint rules, TypeScript checks or a11y rules to make something pass.
- Do not leave `TODO`, commented-out code, `console.log`, or `any` in merged code.
- Do not over-engineer: no abstraction layers, config systems or generic utilities that nothing currently needs.
- Do not touch unrelated files or reformat code you were not asked to change.

## 13. Employer and confidentiality safety

This is a public repository owned by an individual. Never include anything from any current or past employer:
no code, component names, internal product names, business data, client names, screenshots or assets.
All example content (form copy, sample data, product names) must be generic or fictional.

## 14. Working unattended

When running without a human in the loop:
- Take the smallest reasonable interpretation of the task and state it at the top of the PR.
- If a decision is genuinely ambiguous AND hard to reverse (public API shape, a token rename, a new dependency, a licensing question), stop, write down the options in the PR or a note, and do not guess.
- If the quality gates fail and you cannot fix them within a few attempts, stop and report what is failing and what you tried, instead of weakening the checks.
- Never mark a task complete if anything in section 10 is unverified. Say what is missing instead.
