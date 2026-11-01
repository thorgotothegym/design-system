// SCAFFOLD-PLACEHOLDER: checklist. Do each item, then delete this whole comment block;
// `pnpm check:placeholders` fails while it is here. Each item names what enforces it.
//
// - [ ] Focus and highlight indicators are `outline-2 outline-solid outline-focus-ring` in the same
//       variant. An element whose ring is drawn by another element gets `outline-transparent`; the
//       outline is never removed. Enforced by src/test/outline-removal.test.ts (AGENTS.md section 7).
// - [ ] Spacing classes use only the 13 token steps. Enforced by src/test/spacing-scale.test.ts
//       (AGENTS.md section 6).
//#if requiredSupported
// - [ ] `aria-required` is forwarded: the __role__ role supports it. If you change the role to one
//       that does not (switch), drop `required` and `aria-required` from the props and assert their
//       absence in the test (AGENTS.md section 5, Field wiring).
//#endif
//#if-not requiredSupported
// - [ ] `required` and `aria-required` are not accepted: the __role__ role does not support them,
//       and the test asserts the attribute is absent (AGENTS.md section 5, Field wiring).
//#endif
// - [ ] Every new color pair and every state indicator (focus, highlighted, selected, invalid) has
//       a pair in packages/tokens/src/contrast/pairs.ts, 3:1 for indicators. Enforced by the
//       contrast gate in `pnpm test` (AGENTS.md section 7).
//#if compound
// - [ ] The compound (`Object.assign(Root, { ... })`) is marked `/* @__PURE__ */`. Enforced by
//       `pnpm size`: without it, importing any component pulls this one in (AGENTS.md section 5).
//#endif
//#if-not compound
// - [ ] If you turn this into a compound (`Object.assign(Root, { ... })`), mark it
//       `/* @__PURE__ */`. Enforced by `pnpm size` (AGENTS.md section 5).
//#endif
// - [ ] Stories: one per state; interaction stories start with `startDemo()` from src/test/demo.ts
//       so the steps can be followed; no `play` changes what the first paint shows (open things
//       with `defaultOpen`, not from `play`); anything with dates uses a fixed date, and a story
//       that depends on today is excluded from Chromatic. Review (AGENTS.md section 8).
// - [ ] In `play` and tests, every result that arrives asynchronously is awaited with `findBy*` or
//       `waitFor`, never asserted straight after the action, with no fixed sleep and no longer
//       timeout. That covers focus moved in an effect or a `setTimeout` (Radix FocusScope and
//       RovingFocus, React Aria), a value or `onComplete` reported from an effect, an opened
//       popover, and a viewport resize, which arrives on the next frame (`viewportResized()` in
//       select.stories.tsx). ESLint catches un-awaited calls only; review the rest (AGENTS.md
//       section 9, "Waiting for asynchronous results").
//#if group
// - [ ] Group: the `Field.Label` names the group (aria-labelledby), the group is one tab stop, the
//       arrow keys move and select, and each item sits in its own `<Field orientation="horizontal">`,
//       item first. Covered by the generated tests; keep them passing.
//#endif
//#if popover
// - [ ] Popover: the content sits on `z-(--ds-z-dropdown)`; the highlighted option is the inset
//       `focus.ring` outline (the fill alone is about 1.1:1, so the ring is the indicator, with its
//       pair in the gate); stories that show it open use `defaultOpen`; opening does not shift the
//       page (PageWithScrollbar story). Review and the generated tests (AGENTS.md section 7).
//#endif
//#if subpath
// - [ ] Subpath: it is imported from `@aleixvidal/ui/__name__` only. Entry src/__name__.ts, the
//       `exports` entry, the tsup entry and the `size-limit` path are generated; the manifest test in
//       src/package.test.ts fails if the root entry exports it. Write the README paragraph (what
//       the dependency weighs, and the CSP nonce note if it injects `<style>` elements) and say
//       the same in the component JSDoc (AGENTS.md section 5).
//#endif
// - [ ] Keyboard-only pass over every state (Tab, arrows, Space, Enter, Escape), and a check in
//       Chrome, light and dark, that each indicator paints and meets 3:1. The Storybook a11y panel
//       is clean for every story in both themes. Review (AGENTS.md section 10), described in the PR.
// - [ ] No `SCAFFOLD-PLACEHOLDER` is left. Enforced by `pnpm check:placeholders`.
