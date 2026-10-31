import { DocsRenderer } from "@storybook/addon-docs";

type Render = DocsRenderer<never>["render"];

/**
 * Storybook's docs renderer, without the re-render of a page that is already on screen.
 *
 * On a globals change (the theme toolbar) Storybook renders the current docs page again, and its
 * renderer wraps the page in an error boundary with `key={Math.random()}`: the whole page
 * remounts. Every story block on it is torn down while it is still re-rendering for the same
 * change, and Storybook then reloads the preview iframe (`StoryRender.teardown`), which painted
 * the page dark, blank and light again on each switch. A globals change is the only re-render of
 * the same docs context: navigation and hot updates create a new one, which renders as before.
 * Nothing on a docs page needs the re-render: each story re-renders itself with the new globals,
 * and the docs container follows the theme on its own (theme.ts).
 */
export const createDocsRenderer = () => {
  const renderer = new DocsRenderer();
  const rendered = new WeakMap<HTMLElement, unknown>();

  const render: Render = async (context, docsParameter, element) => {
    if (rendered.get(element) === context) return;
    rendered.set(element, context);
    await renderer.render(context, docsParameter, element);
  };

  const unmount = (element: HTMLElement) => {
    rendered.delete(element);
    renderer.unmount(element);
  };

  return { render, unmount };
};
