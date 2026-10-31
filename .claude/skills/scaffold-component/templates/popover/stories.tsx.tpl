import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { __Name__ } from "./__name__";

const ExampleOptions = () => (
  <>
    <__Name__.Group>
      <__Name__.Label>Fruit</__Name__.Label>
      <__Name__.Item value="apple">Apple</__Name__.Item>
      <__Name__.Item value="banana">Banana</__Name__.Item>
      <__Name__.Item value="cherry">Cherry</__Name__.Item>
    </__Name__.Group>
    <__Name__.Separator />
    <__Name__.Group>
      <__Name__.Label>Vegetables</__Name__.Label>
      <__Name__.Item value="leek">Leek</__Name__.Item>
      <__Name__.Item value="pea">Pea</__Name__.Item>
    </__Name__.Group>
  </>
);

const meta = {
  title: "Form components/__Name__",
  component: __Name__,
  subcomponents: {
    "__Name__.Item": __Name__.Item,
    "__Name__.Group": __Name__.Group,
    "__Name__.Label": __Name__.Label,
    "__Name__.Separator": __Name__.Separator,
  },
  args: {
    "aria-label": "Produce",
    placeholder: "Choose one",
    children: <ExampleOptions />,
  },
  // The docs table cannot resolve the cva-derived `size` type, so its control is set by hand.
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "SCAFFOLD-PLACEHOLDER: when to use __name__ and when not to, and which keys open, move, choose and close it. Inside a `Field` it is labelled, described and validated automatically; on its own it needs an `aria-label` or an external label. The list opens below the trigger (above when there is no room), never leaves the viewport and scrolls inside.",
      },
    },
  },
} satisfies Meta<typeof __Name__>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const Medium: Story = { args: { size: "md" } };

export const Large: Story = { args: { size: "lg" } };

export const WithValue: Story = { args: { defaultValue: "cherry" } };

/**
 * The stories that only show the open list start with it open (`defaultOpen`) instead of opening
 * it in a `play` function, which would flash the list for a frame or two on every load. While the
 * list is open Radix hides the rest of the page from assistive technology and traps focus in the
 * list, so axe reports the (unreachable) trigger under `aria-hidden-focus`: a false positive, and
 * the only rule turned off, for these stories only.
 */
const openListA11y = {
  config: { rules: [{ id: "aria-hidden-focus", enabled: false }] },
};

/** Options in labelled groups, separated by a line; each group is named by its label. */
export const Open: Story = {
  args: { defaultOpen: true },
  parameters: { a11y: openListA11y },
  play: async () => {
    await expect(
      await screen.findByRole("group", { name: "Fruit" }),
    ).toBeVisible();
  },
};

/** A disabled option cannot be chosen; the arrow keys and typing skip it. */
export const DisabledOption: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        <__Name__.Item value="apple">Apple</__Name__.Item>
        <__Name__.Item value="banana" disabled>
          Banana (not available)
        </__Name__.Item>
        <__Name__.Item value="cherry">Cherry</__Name__.Item>
      </>
    ),
  },
  parameters: { a11y: openListA11y },
  play: async () => {
    await expect(
      await screen.findByRole("option", { name: "Banana (not available)" }),
    ).toHaveAttribute("aria-disabled", "true");
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "apple" },
};

export const Invalid: Story = { args: { invalid: true } };

const ControlledExample = () => {
  const [value, setValue] = useState("apple");

  return (
    <div className="flex flex-col gap-2">
      <__Name__
        aria-label="Produce"
        placeholder="Choose one"
        value={value}
        onValueChange={setValue}
      >
        <ExampleOptions />
      </__Name__>
      <p className="m-0 font-sans text-sm text-text-muted">
        Value: {value === "" ? "(none)" : value}
      </p>
    </div>
  );
};

/** The value lives in React state: `value` and `onValueChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed on the trigger, forced with the pseudo-states addon so that
 * each one can be reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div id="pseudo-hover">
        <__Name__ aria-label="Hover" defaultValue="apple">
          <ExampleOptions />
        </__Name__>
      </div>
      <div id="pseudo-focus">
        <__Name__ aria-label="Focus visible" defaultValue="apple">
          <ExampleOptions />
        </__Name__>
      </div>
      <div id="pseudo-active">
        <__Name__ aria-label="Active" defaultValue="apple">
          <ExampleOptions />
        </__Name__>
      </div>
    </div>
  ),
  parameters: {
    pseudo: {
      hover: ["#pseudo-hover button"],
      focusVisible: ["#pseudo-focus button"],
      active: ["#pseudo-active button"],
    },
  },
};

/**
 * Interaction stories open the list in `play` and close it again at the end, so the state the a11y
 * panel checks afterwards is the resting one (see `openListA11y`).
 */
const closeList = async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
};

/** Keyboard: open with Enter, move with the arrows, choose with Enter; Escape closes. */
export const KeyboardNavigation: Story = {
  args: { defaultValue: "apple" },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Produce" });

    await user.tab();
    await expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Banana");
    // The focus goes back to the trigger in a timeout after the list unmounts.
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * A page taller than the viewport, so it has a vertical scrollbar. Opening the list locks the
 * page scroll; the scrollbar's gap is kept, so the page does not shift sideways.
 */
export const PageWithScrollbar: Story = {
  render: (args) => (
    <div className="h-[200vh]">
      <__Name__ {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Produce" });
    const before = trigger.getBoundingClientRect().left;

    await userEvent.click(trigger);
    await screen.findByRole("listbox");

    await expect(trigger.getBoundingClientRect().left).toBe(before);
    await closeList();
  },
};

/**
 * SCAFFOLD-PLACEHOLDER: replace this story with the real interaction flow of the component
 * (validation inside a Field, typing to jump, ...), then rename it and delete this comment. It
 * only proves that the component renders, so it is not a finished interaction story.
 */
export const InteractionPlaceholder: Story = {
  name: "PLACEHOLDER: replace with a real interaction",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("combobox")).toBeVisible();
  },
};
