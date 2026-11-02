@AGENTS.md

# Claude Code specifics

The shared conventions above (imported from AGENTS.md) are the source of truth. Do not duplicate them here.
This file only adds things specific to Claude Code.

## How to work

- Where to look first: AGENTS.md (conventions, section 4 for commands and CI, section 11 for verifying and reporting), DESIGN.md (tokens and visual rules), BACKLOG.md (the task and its criteria), and `docs/` (deployment, the theme switch).
- For anything bigger than a small fix, plan first: list the files you will create or change, then implement.
- Before using an API from Radix, Storybook, Tailwind or Style Dictionary, verify it against the current docs (Context7 MCP if available).
- Implement one component per task and per PR. Do not batch several components into one change.
- When creating a new component, copy the structure and style of the reference component (`Field` / `Input`) instead of inventing a new pattern. If a new pattern seems necessary, explain why in the PR before implementing it.
- Run the quality gates from AGENTS.md section 4 yourself and fix failures before reporting completion. Report the real result of each command, following AGENTS.md section 11, "Verifying and reporting": a check that must run is never replayed from the cache, a failed job is reported, not re-run until green, and tokens are never printed.

## Commits and PRs
- Do not add Co-Authored-By trailers, session links, "Generated with" footers or any other tool-generated attribution to commit messages or PR descriptions.

## Skills

Repo-local skills live in `.claude/skills/`. Prefer them over doing the same work by hand so the structure stays consistent.

- **`scaffold-component`** (`.claude/skills/scaffold-component/`): creates a new component in `packages/ui` (folder with component, stories, tests and `index.ts`, export from the package entry or its own entry point, changeset stub and a `size-limit` entry) in five variants: a native element (like `Input`, `Textarea`), a Radix primitive with checked state (like `Checkbox`, `Switch`), a group (like `RadioGroup`), a popover (like `Select`) or a subpath component with its own entry point (like `OtpInput`, `DatePicker`). Use it for every new component, then finish the generated code: it leaves `SCAFFOLD-PLACEHOLDER` markers (a checklist of the enforced rules at the top of the component, and a placeholder `play` story among them) that must all be resolved before the task is done. See its `SKILL.md` for the workflow and the conventions it encodes. GitHub Copilot has the same workflow as the prompt `.github/prompts/scaffold-component.prompt.md`, which points to the same skill files, so there is a single source of truth.

## Tool usage

- Prefer reading and editing files with the dedicated tools over shell one-liners.
- Do not install global packages; add dependencies through pnpm in the right workspace package (`pnpm --filter @aleixvidal/ui add <pkg>`).
- Do not run destructive commands (`rm -rf`, `git reset --hard`, force pushes) without being asked.
