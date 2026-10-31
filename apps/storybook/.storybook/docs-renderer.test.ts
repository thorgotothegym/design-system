import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { VERIFIED_STORYBOOK_VERSION, wrapDocsRenderer } from "./docs-renderer";

type Call = { context: unknown; element: unknown };

/** Stands in for Storybook's DocsRenderer: same shape, records what it renders. */
const createFakeRenderer = () => {
  const calls: Call[] = [];
  class FakeDocsRenderer {
    render = async (
      context: unknown,
      _parameters: unknown,
      element: unknown,
    ) => {
      calls.push({ context, element });
    };
    unmount = () => {};
  }
  return { FakeDocsRenderer, calls };
};

// The wrapper only uses the element as a WeakMap key, so a plain object stands in for the docs
// root (this project runs in Node, without a DOM).
const createElement = () => ({}) as HTMLElement;

describe("wrapDocsRenderer", () => {
  it("should render a docs page the first time", async () => {
    const { FakeDocsRenderer, calls } = createFakeRenderer();
    const renderer = wrapDocsRenderer(FakeDocsRenderer);
    const element = createElement();

    await renderer?.render({}, {}, element);

    expect(calls).toHaveLength(1);
  });

  it("should skip the re-render of the same docs context (a globals change)", async () => {
    const { FakeDocsRenderer, calls } = createFakeRenderer();
    const renderer = wrapDocsRenderer(FakeDocsRenderer);
    const element = createElement();
    const context = {};
    await renderer?.render(context, {}, element);

    await renderer?.render(context, {}, element);

    expect(calls).toHaveLength(1);
  });

  it("should render a new docs context into the same element (navigation)", async () => {
    const { FakeDocsRenderer, calls } = createFakeRenderer();
    const renderer = wrapDocsRenderer(FakeDocsRenderer);
    const element = createElement();
    const next = {};
    await renderer?.render({}, {}, element);

    await renderer?.render(next, {}, element);

    expect(calls.at(-1)?.context).toBe(next);
  });

  it("should render the same context again after the element was unmounted", async () => {
    const { FakeDocsRenderer, calls } = createFakeRenderer();
    const renderer = wrapDocsRenderer(FakeDocsRenderer);
    const element = createElement();
    const context = {};
    await renderer?.render(context, {}, element);
    renderer?.unmount(element);

    await renderer?.render(context, {}, element);

    expect(calls).toHaveLength(2);
  });

  it.each([
    ["is missing", undefined],
    ["is not a class", () => ({ render: () => {}, unmount: () => {} })],
    ["has no render and unmount", class {}],
    [
      "throws when constructed",
      class {
        constructor() {
          throw new Error("changed upstream");
        }
      },
    ],
  ])(
    "should return nothing, so the default renderer stays, when DocsRenderer %s",
    (_case, DocsRendererClass) => {
      const renderer = wrapDocsRenderer(DocsRendererClass);

      expect(renderer).toBeUndefined();
    },
  );

  it("should have been verified against the installed Storybook version", () => {
    const installed: unknown = createRequire(import.meta.url)(
      "storybook/package.json",
    );

    // On a Storybook upgrade, repeat the manual check in docs/theme-switch.md with and without the
    // wrapper, then update VERIFIED_STORYBOOK_VERSION (or remove the wrapper).
    expect(installed).toMatchObject({ version: VERIFIED_STORYBOOK_VERSION });
  });
});
