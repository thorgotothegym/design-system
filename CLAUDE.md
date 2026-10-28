@AGENTS.md

# Claude Code specifics

The shared conventions above (imported from AGENTS.md) are the source of truth. Do not duplicate them here.
This file only adds things specific to Claude Code.

## How to work

- For anything bigger than a small fix, plan first: list the files you will create or change, then implement.
- Before using an API from Radix, Storybook, Tailwind or Style Dictionary, verify it against the current docs (Context7 MCP if available).
- Implement one component per task and per PR. Do not batch several components into one change.
- When creating a new component, copy the structure and style of the reference component (`Field` / `Input`) instead of inventing a new pattern. If a new pattern seems necessary, explain why in the PR before implementing it.
- Run the quality gates from AGENTS.md section 4 yourself and fix failures before reporting completion. Report the real result of each command.

## Commits and PRs
- Do not add Co-Authored-By trailers, session links, "Generated with" footers or any other tool-generated attribution to commit messages or PR descriptions.

## Skills

Repo-local skills live in `.claude/skills/`. Prefer them over doing the same work by hand so the structure stays consistent.

- **`scaffold-component`** (`.claude/skills/scaffold-component/`): creates a new component in `packages/ui` (folder with component, stories, tests and `index.ts`, export from the package entry, changeset stub and a `size-limit` entry) in two variants: a native element (like `Input`, `Textarea`) or a Radix primitive (like `Checkbox`, `Switch`). Use it for every new component, then finish the generated code: it leaves `SCAFFOLD-PLACEHOLDER` markers (including a placeholder `play` story) that must all be resolved before the task is done. See its `SKILL.md` for the workflow and the conventions it encodes. GitHub Copilot has the same workflow as the prompt `.github/prompts/scaffold-component.prompt.md`, which points to the same skill files, so there is a single source of truth.

## Tool usage

- Prefer reading and editing files with the dedicated tools over shell one-liners.
- Do not install global packages; add dependencies through pnpm in the right workspace package (`pnpm --filter @aleixvidal/ui add <pkg>`).
- Do not run destructive commands (`rm -rf`, `git reset --hard`, force pushes) without being asked.
