---
name: scaffold-component
description: Scaffold a new component in packages/ui following the conventions of Field, Input, Textarea, Checkbox and Switch
argument-hint: "<kebab-case-name> native|radix"
agent: agent
---

Scaffold a new component for this design system and then finish it.

Component name and variant: ${input:component:kebab-case name and native or radix, for example date-field native}

The full workflow, the conventions to keep and the verification steps are in
[the scaffold-component skill](../../.claude/skills/scaffold-component/SKILL.md). It is the single
source of truth for both Claude Code and Copilot: read it completely and follow it. Also read
[AGENTS.md](../../AGENTS.md), [DESIGN.md](../../DESIGN.md) and the matching task in
[BACKLOG.md](../../BACKLOG.md) first.

Summary of what to do:

1. Create the branch `feat/<name>` from an up-to-date `main`.
2. Run the scaffold script from the repo root (it needs Node 24):
   - native element: `node .claude/skills/scaffold-component/scaffold.mts create <name> --variant native [--element input|textarea]`
   - Radix primitive: `node .claude/skills/scaffold-component/scaffold.mts create <name> --variant radix --primitive <package> --role <aria-role>`
   - If the Radix package is not a dependency yet, check its current documentation and add it with `pnpm --filter @aleixvidal/ui add <package>@<exact version>`.
3. Finish the component. Resolve every `SCAFFOLD-PLACEHOLDER` (`pnpm check:placeholders` must pass), including the placeholder interaction story, which needs a real `play` flow.
4. Set the size budget with `node .claude/skills/scaffold-component/scaffold.mts size <name>` after the component is finished.
5. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size && pnpm check:placeholders`, check the Storybook accessibility panel in both themes, and report the real result of each command.
6. Open one PR for this component following AGENTS.md section 11, with a list of anything you are unsure about. Do not add attribution lines to commits or the PR, and never force-push.

Rules that are easy to miss: spacing uses only the 13 token steps; invalid borders use
`border-border-danger`; compound components built with `Object.assign` are marked
`/* @__PURE__ */`; checkbox-like controls use `<Field orientation="horizontal">` with the control
first; a switch-like control must not accept `required` or `aria-required`; Radix controls in a
form rely on the ResizeObserver stub already in `packages/ui/src/test/setup.ts`; every new component
needs a changeset and an axe check.
