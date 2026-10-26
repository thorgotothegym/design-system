# design-system

A React design system built as a portfolio piece: tokens, accessible components, Storybook docs, tests and a release pipeline.
Conventions live in [AGENTS.md](AGENTS.md), the visual direction in [DESIGN.md](DESIGN.md) and the work plan in [BACKLOG.md](BACKLOG.md).

## Layout

| Path                         | Package                         | Purpose                           |
| ---------------------------- | ------------------------------- | --------------------------------- |
| `packages/ui`                | `@aleixvidal/ui`                | The components (published)        |
| `packages/tokens`            | `@aleixvidal/tokens`            | Design tokens                     |
| `packages/eslint-config`     | `@aleixvidal/eslint-config`     | Shared ESLint config              |
| `packages/typescript-config` | `@aleixvidal/typescript-config` | Shared strict tsconfig            |
| `apps/storybook`             | `@aleixvidal/storybook`         | Storybook (placeholder until T03) |

## Commands

Requires Node 24 (`.nvmrc`) and pnpm 11.

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm changeset   # for any user-facing change
```

## Toolchain note

TypeScript 7 ships no JavaScript compiler API, so tools that need it cannot use it:

- `typescript-eslint` runs on TypeScript 6.0.3, pinned only inside `packages/eslint-config`.
- `tsup` bundles the JavaScript; `tsc` emits the `.d.ts` files (`tsconfig.build.json`).
