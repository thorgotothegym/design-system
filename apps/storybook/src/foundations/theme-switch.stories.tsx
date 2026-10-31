import { Field, Input } from "@aleixvidal/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import { expect, within } from "storybook/test";

const meta = {
  title: "Foundations/Theme switch",
  // A regression check, not documentation: hidden from the sidebar and the docs pages, and run
  // by `pnpm test:storybook` in both themes.
  tags: ["!dev", "!autodocs"],
  // Its end state is Field/Default; a snapshot would add nothing.
  parameters: { chromatic: { disableSnapshot: true } },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** What the toolbar sends: the preview receives the new theme global. */
const switchTheme = (theme: "dark" | "light") => {
  addons.getChannel().emit(GLOBALS_UPDATED, {
    userGlobals: { theme },
    globals: { theme },
    storyGlobals: {},
    initialGlobals: {},
  });
};

const readTheme = () => ({
  theme: document.documentElement.getAttribute("data-theme"),
  colorScheme: getComputedStyle(document.documentElement).colorScheme,
  background: getComputedStyle(document.body).backgroundColor,
  runningTransitions: document
    .getAnimations()
    .filter((animation) => animation instanceof CSSTransition).length,
});

/**
 * The theme toolbar switches the page in one frame: `data-theme`, `color-scheme` and the
 * background change in the same task that receives the global, with no transition running (the
 * Input's border-color transition would otherwise fade from the old theme). Transitions are back
 * two frames later, for hover and focus.
 */
export const SwitchesInOneFrame: Story = {
  render: () => (
    <Field>
      <Field.Label>Email</Field.Label>
      <Input type="email" />
    </Field>
  ),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const from = globals.theme === "light" ? "light" : "dark";
    const to = from === "light" ? "dark" : "light";
    const before = readTheme();

    switchTheme(to);
    const during = readTheme();
    await nextFrame();
    await nextFrame();
    const after = readTheme();
    const transition = getComputedStyle(
      canvas.getByTestId("input"),
    ).transitionProperty;
    switchTheme(from);
    await nextFrame();
    await nextFrame();

    await expect(during).toEqual({ ...after, runningTransitions: 0 });
    await expect(during.theme).toBe(to);
    await expect(during.colorScheme).toBe(to);
    await expect(during.background).not.toBe(before.background);
    await expect(transition).toBe("border-color");
    await expect(readTheme().theme).toBe(from);
  },
};
