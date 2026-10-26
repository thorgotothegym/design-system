# Copilot instructions

This repository is a React design system built as a public portfolio piece.

Before doing any work, read these files in the repository root and follow them. They are the source of truth:

- `AGENTS.md`: conventions, definition of done, what not to do
- `DESIGN.md`: visual direction, color tokens and contrast rules
- `BACKLOG.md`: the ordered tasks and their acceptance criteria

Work on one task from `BACKLOG.md` at a time, on its own branch, and open one PR per task.

Rules that must never be missed (the full list is in `AGENTS.md`):

- Use `type`, never `interface`. No `any`.
- Components use semantic design tokens only. No hardcoded colors, spacing, radii or font sizes.
- Build on headless primitives (Radix, or React Aria where Radix has none). Never hand-roll focus management or ARIA.
- Every component implements all its states, has stories and tests, and is accessible by keyboard.
- `lint`, `typecheck`, `test`, `build` and `storybook build` must pass before a task is called done.
- Never disable a check to make it pass. If you cannot fix it, stop and report.
- No employer-related content of any kind in this repository.
- If a decision is ambiguous and hard to reverse, stop and write down the options instead of guessing.
