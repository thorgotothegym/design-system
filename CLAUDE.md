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
- Keep the `Co-Authored-By` trailer in commit messages.
- Do not add session links or "Generated with" footers to PR descriptions.

## Skills

If a repo-local skill exists (for example `scaffold-component`), prefer it for creating new components so the folder structure stays consistent.

## Tool usage

- Prefer reading and editing files with the dedicated tools over shell one-liners.
- Do not install global packages; add dependencies through pnpm in the right workspace package (`pnpm --filter @aleixvidal/ui add <pkg>`).
- Do not run destructive commands (`rm -rf`, `git reset --hard`, force pushes) without being asked.
