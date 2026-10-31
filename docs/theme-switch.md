# Theme switch: how it works and how to check it

The toolbar theme switch must change the Storybook preview from one theme to the other in a single painted frame, on story (Canvas) and docs pages alike, with no frame that mixes both themes and no flash.

## How the theme is applied

| Piece                                         | What it does                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/storybook/.storybook/theme.ts`          | Listens to the `theme` global (`SET_GLOBALS`, `GLOBALS_UPDATED`) and sets `data-theme` on `<html>` in the same task, before anything re-renders. `tokens.css` derives the colors and `color-scheme` from that attribute, so they change in one style recalculation. During the switch it adds `ds-theme-switching` for two frames. |
| `apps/storybook/.storybook/preview.css`       | `.ds-theme-switching` sets `transition: none`, so the components' `border-color` transitions do not fade from the old theme's colors. Hover and focus transitions are back two frames later. It also gives Storybook's loaders (`.sb-preparing-story`, `.sb-preparing-docs`) the theme background instead of white.                |
| `apps/storybook/.storybook/docs-renderer.ts`  | Storybook's docs renderer, without the re-render of a docs page that is already on screen. Storybook's own renderer remounts the whole page on every globals change (`key={Math.random()}`), tears down every story on it while it is still re-rendering, and then reloads the preview iframe.                                     |
| `apps/storybook/.storybook/preview-head.html` | Sets `data-theme` from `globals=theme:…` in the URL before the first paint, so a link or a reload in the light theme does not paint dark first.                                                                                                                                                                                    |
| `withThemeByDataAttribute` (addon-themes)     | Still registers the toolbar button and sets the same attribute after each render (a no-op by then).                                                                                                                                                                                                                                |

## Automated check

`Foundations/Theme switch` (`apps/storybook/src/foundations/theme-switch.stories.tsx`) is a story hidden from the sidebar and the docs pages. `pnpm test:storybook` runs it in both themes. It sends the theme global the way the toolbar does, then checks, in the same task, that `data-theme`, `color-scheme` and the body background have their final values and that no CSS transition is running. Two frames later it checks that the Input's `border-color` transition is back.

It does not cover docs pages: the Vitest addon renders stories, not docs pages. Use the manual check below when you change the docs container, the docs renderer or the Storybook version.

## Manual check (frame sampling)

Run it against the static build (`pnpm build`, then serve `apps/storybook/storybook-static`) in Google Chrome through Playwright (`playwright` is already a dev dependency of `apps/storybook`). Use a 1280x800 viewport at 1x, both directions (dark to light and light to dark), and these pages: the Docs and Canvas tabs of Foundations/Color, Checkbox, DatePicker, Field and Input.

1. Open `/?path=/docs/<id>` (or `/story/<id>`) with `&globals=theme:dark`, wait until the page is idle, and hover the toolbar's "Theme" button.
2. Start a CDP screencast (`Page.startScreencast`, PNG, every frame) on the page. In the preview iframe, start a `requestAnimationFrame` loop that records `data-theme`, the computed `color-scheme`, the body background and the running `CSSTransition`s (`document.getAnimations()`). Log the records into the top window, so a reload of the preview does not lose them.
3. Click the button with the real mouse (`page.mouse`), keep sampling for 3 seconds, and stop the screencast.
4. Diff each screencast frame against the previous one, inside the preview iframe's rectangle.

**Pass:**

- Exactly one frame changes inside the preview, and it is identical to the final state (the toolbar label may change one or two frames later; it is outside the preview).
- No `iframe.html` document request after the click (a request means the preview reloaded).
- No running transition in any sample.
- At most one change of 10% or more in relative luminance over 25% or more of the screen, so there is no flash in the sense of WCAG 2.3.1.

**First load:** open `iframe.html?id=<id>&viewMode=story&globals=theme%3Alight` in a new context and record `data-theme` and the body background from the first animation frame. Every frame must already be light. Then load the full page (`/?path=/story/<id>&globals=theme:dark`) with the screencast running: no frame may show a white preview. Before the preview paints, the area shows the manager's own background, which is always dark.
