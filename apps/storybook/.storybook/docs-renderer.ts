import type { DocsRenderer } from "@storybook/addon-docs";

type Renderer = Pick<DocsRenderer<never>, "render" | "unmount">;

/**
 * The Storybook version this wrapper was verified against with the frame sampling in
 * docs/theme-switch.md. docs-renderer.test.ts fails when the installed version differs, so an
 * upgrade re-checks it instead of keeping or dropping it silently.
 */
export const VERIFIED_STORYBOOK_VERSION = "10.6.3";

const isRenderer = (value: unknown): value is Renderer =>
  typeof value === "object" &&
  value !== null &&
  "render" in value &&
  typeof value.render === "function" &&
  "unmount" in value &&
  typeof value.unmount === "function";

/**
 * Storybook's docs renderer, without the re-render of a page that is already on screen.
 *
 * Upstream behavior it works around (Storybook 10.6.3): on a globals change (the theme toolbar)
 * Storybook renders the current docs page again, and `DocsRenderer` wraps the page in an error
 * boundary with `key={Math.random()}`, so the whole page remounts. Every story block on it is torn
 * down while it is still re-rendering for the same change, and `StoryRender.teardown()` then calls
 * `location.reload()` on the preview iframe: the page painted dark, blank and light again.
 * The reload is storybookjs/storybook#29007, fixed by #35618 in 11.0.0-alpha.7 and in no 10.6
 * release. The remount (`key={Math.random()}`) is still on `next` and has no issue.
 *
 * Remove it when the installed Storybook neither reloads nor remounts a docs page on a globals
 * change: check it with the manual procedure in docs/theme-switch.md without the wrapper.
 *
 * A globals change is the only re-render of the same docs context: navigation and hot updates
 * create a new one, which renders as before. Nothing on a docs page needs that re-render: each
 * story re-renders itself with the new globals, and the docs container follows the theme on its
 * own (theme.ts).
 *
 * Returns `undefined` when `DocsRendererClass` does not construct an object with `render` and
 * `unmount` (an upstream API change); preview.tsx then keeps Storybook's default renderer.
 */
export const wrapDocsRenderer = (
  DocsRendererClass: unknown,
): Renderer | undefined => {
  let renderer: unknown;
  try {
    renderer =
      typeof DocsRendererClass === "function"
        ? Reflect.construct(DocsRendererClass, [])
        : undefined;
  } catch {
    return undefined;
  }
  if (!isRenderer(renderer)) return undefined;

  const inner = renderer;
  const rendered = new WeakMap<HTMLElement, unknown>();

  return {
    render: async (context, docsParameter, element) => {
      if (rendered.get(element) === context) return;
      rendered.set(element, context);
      await inner.render(context, docsParameter, element);
    },
    unmount: (element) => {
      rendered.delete(element);
      inner.unmount(element);
    },
  };
};
