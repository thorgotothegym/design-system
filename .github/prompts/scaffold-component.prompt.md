---
name: scaffold-component
description: Scaffold a new component in packages/ui with the scaffold-component skill (native, radix, group, popover or subpath variant)
argument-hint: "<kebab-case-name> native|radix|group|popover|subpath"
agent: agent
---

Scaffold a new component for this design system and then finish it.

Component name and variant: ${input:component:kebab-case name and variant, for example plan-picker group}

The workflow, the variants, the conventions and the verification steps are in
[the scaffold-component skill](../../.claude/skills/scaffold-component/SKILL.md), and the templates
are in [its templates folder](../../.claude/skills/scaffold-component/templates/). They are the
single source of truth for both Claude Code and Copilot: read the skill completely and follow it.
Also read [AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md) and the matching task in
[BACKLOG.md](../../BACKLOG.md) first.

Summary of what to do:

1. Create the branch `feat/<name>` from an up-to-date `main`.
2. Pick the variant from the table in section 1 of the skill (`native`, `radix`, `group`, `popover`
   or `subpath`) and run the matching `create` command from section 2 (it needs Node 24). If the
   primitive or dependency is not installed yet, check its current documentation and add it with
   `pnpm --filter @aleixvidal/ui add <package>@<exact version>`.
3. Work through the checklist at the top of the generated `<name>.tsx`. Each item names the rule
   and what enforces it. Then resolve every other `SCAFFOLD-PLACEHOLDER`, including the
   placeholder interaction story. `pnpm check:placeholders` must pass.
4. Set the size budget with `node .claude/skills/scaffold-component/scaffold.mts size <name>` once
   the component is finished.
5. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && pnpm check:placeholders`,
   do the keyboard-only pass and the Chrome check of every indicator in both themes, check the
   Storybook accessibility panel in both themes, and report the real result of each step.
6. Open one PR for this component following AGENTS.md section 11, with a list of anything you are
   unsure about. Do not add attribution lines to commits or the PR, and never force-push.
