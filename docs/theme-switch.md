# Theme switch: how it works and how to check it

The toolbar theme switch must change the Storybook preview from one theme to the other in a single painted frame, on story (Canvas) and docs pages alike, with no frame that mixes both themes and no flash.

## How the theme is applied

| Piece                                         | What it does                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/storybook/.storybook/theme.ts`          | Listens to the `theme` global (`SET_GLOBALS`, `GLOBALS_UPDATED`) and sets `data-theme` on `<html>` in the same task, before anything re-renders. `tokens.css` derives the colors and `color-scheme` from that attribute, so they change in one style recalculation. During the switch it adds `ds-theme-switching` for two frames. |
| `apps/storybook/.storybook/preview.css`       | `.ds-theme-switching` sets `transition: none`, so the components' `border-color` transitions do not fade from the old theme's colors. Hover and focus transitions are back two frames later. It also gives Storybook's loaders (`.sb-preparing-story`, `.sb-preparing-docs`) the theme background instead of white.                |
| `apps/storybook/.storybook/docs-renderer.ts`  | Storybook's docs renderer, without the re-render of a docs page that is already on screen. See [The docs renderer wrapper](#the-docs-renderer-wrapper).                                                                                                                                                                            |
| `apps/storybook/.storybook/preview-head.html` | Sets `data-theme` from `globals=theme:…` in the URL before the first paint, so a link or a reload in the light theme does not paint dark first.                                                                                                                                                                                    |
| `withThemeByDataAttribute` (addon-themes)     | Still registers the toolbar button and sets the same attribute after each render (a no-op by then).                                                                                                                                                                                                                                |

## The docs renderer wrapper

**What it works around.** On a globals change (the theme toolbar), Storybook 10.6.3 renders the current docs page again. Two things happen upstream:

1. `DocsRenderer` wraps the page in `<ErrorBoundary key={Math.random()}>`, so the whole page remounts, and every story on it is back to a loading skeleton.
2. Each story block is torn down while it is still re-rendering for the same change. `StoryRender.teardown()` waits three ticks and then calls `location.reload()` on the preview iframe. The page paints light, light with skeletons, blank dark and light again, and any arg changed in the docs Controls is lost.

The wrapper skips the re-render when the same docs context is rendered again into the same element. Only a globals change does that (`PreviewWithSelection.onUpdateGlobals`): navigation and hot updates create a new docs context, which renders as before.

**Upstream.**

- The reload is [storybookjs/storybook#29007](https://github.com/storybookjs/storybook/issues/29007), fixed by [#35618](https://github.com/storybookjs/storybook/pull/35618). The fix waits for the inline stories before the docs page renders again. It is in 11.0.0-alpha.7 and later, and in no 10.6 release (10.6.5 is the latest).
- The remount (`key={Math.random()}`) is still in `DocsRenderer` on `next` and has no issue. Without the wrapper, even 11.x remounts the docs page on every switch.

**Pinned version.** `VERIFIED_STORYBOOK_VERSION` in `docs-renderer.ts` is the version the wrapper was verified against. `docs-renderer.test.ts` fails when the installed `storybook` differs, so an upgrade cannot keep or drop the wrapper silently. On an upgrade:

1. Run the manual check below with the wrapper.
2. Run it again without the wrapper (remove the `renderer` line in `preview.tsx`).
3. Then either update the constant or remove the wrapper.

**When to remove it.** When the installed Storybook neither reloads nor remounts a docs page on a globals change. That needs both #35618 (11.0.0-alpha.7 or later) and a `DocsRenderer` that no longer remounts the page. Without the wrapper, the manual check must still pass: one preview change, no `iframe.html` request, and story blocks that keep their DOM nodes.

**If it cannot wrap.** `wrapDocsRenderer` takes the `DocsRenderer` export as `unknown`. It returns `undefined` when the export is missing, is not a class, throws when constructed, or builds an object without `render` and `unmount`. `preview.tsx` then sets no `renderer`, so Storybook's default one stays and the docs work as on 10.6.3 without the fix (they reload on a theme switch). It also logs a warning that names this file. The test covers each of these cases. A build with the fallback forced (`wrapDocsRenderer(undefined)`) was checked by hand: navigation and Controls work, and a theme switch reloads the preview, as on `main`.

**What it does not change.**

- **Navigation:** each docs page and story renders its own content.
- **Args:** a control changed on a docs page updates the story and the args table, before and after a theme switch, because args updates never go through the docs renderer.
- **Fixed as a side effect:** without the wrapper, a theme switch reset those args (the reload); with it, they are kept.

Both are part of the manual check.

## Automated check

`Foundations/Theme switch` (`apps/storybook/src/foundations/theme-switch.stories.tsx`) is a story hidden from the sidebar and the docs pages. `pnpm test:storybook` runs it in both themes. It sends the theme global the way the toolbar does, then checks, in the same task, that `data-theme`, `color-scheme` and the body background have their final values and that no CSS transition is running. Two frames later it checks that the Input's `border-color` transition is back.

It does not cover docs pages: the Vitest addon renders stories, not docs pages. Use the manual check below when you change the docs container, the docs renderer or the Storybook version.

`apps/storybook/.storybook/docs-renderer.test.ts` (unit project) covers the wrapper: it skips the re-render of the same context, renders a new context or an unmounted element, falls back when it cannot wrap, and checks the pinned Storybook version.

## Manual check (frame sampling)

Run it against the static build (`pnpm build`, then serve `apps/storybook/storybook-static`) in Google Chrome through Playwright (`playwright` is already a dev dependency of `apps/storybook`). Use a 1280x800 viewport at 1x, both directions (dark to light and light to dark), and these pages: the Docs and Canvas tabs of Foundations/Color, Checkbox, DatePicker, Field and Input.

1. Open `/?path=/docs/<id>` (or `/story/<id>`) with `&globals=theme:dark`, wait until the page is idle, and hover the toolbar's "Theme" button.
2. Start a CDP screencast (`Page.startScreencast`, PNG, every frame) on the page. In the preview iframe, start a `requestAnimationFrame` loop that records `data-theme`, the computed `color-scheme`, the body background and the running `CSSTransition`s (`document.getAnimations()`). Log the records into the top window, so a reload of the preview does not lose them.
3. Click the button with the real mouse (`page.mouse`), keep sampling for 3 seconds, and stop the screencast.
4. Order the screencast frames by their timestamp (they sometimes arrive out of order), then diff each one against the previous one, inside the preview iframe's rectangle.

**Pass:**

- Exactly one frame changes inside the preview, and it is identical to the final state (the toolbar label may change one or two frames later; it is outside the preview).
- No `iframe.html` document request after the click (a request means the preview reloaded).
- No running transition in any sample.
- At most one change of 10% or more in relative luminance over 25% or more of the screen, so there is no flash in the sense of WCAG 2.3.1.

**Navigation:** with sidebar clicks, go:

1. Color docs, then switch the theme.
2. Checkbox docs, then Checkbox/Default, then Checkbox docs again, then switch the theme.
3. Field docs, then Input/Default, then DatePicker docs.
4. Browser Back to Input/Default, then to Field docs. Storybook adds two history entries per navigation, one for the manager and one for the iframe, so press Back twice for each step.
5. Introduction, then Color docs.

Each docs page must show its own title and only its own story blocks (`[data-story-block]` ids start with `story--<its id>`). Each story must show its component, and `data-theme` must match the toolbar at every step.

**Args:** on Checkbox docs:

1. Turn on `invalid` and type an `aria-label` in the Controls table. The primary story must update.
2. Switch the theme. Both values must stay in the story and in the table.
3. Change both again. The story must follow.

**First load:** open `iframe.html?id=<id>&viewMode=story&globals=theme%3Alight` in a new context and record `data-theme` and the body background from the first animation frame. Every frame must already be light. Then load the full page (`/?path=/story/<id>&globals=theme:dark`) with the screencast running: no frame may show a white preview. Before the preview paints, the area shows the manager's own background, which is always dark.
