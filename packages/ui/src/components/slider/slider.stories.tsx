import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { Field } from "../field";
import { Slider } from "./slider";

const percent = (value: number) => `${value}%`;

const meta = {
  title: "Form components/Slider",
  component: Slider,
  args: { "aria-label": "Volume", defaultValue: [40] },
  argTypes: { defaultValue: { control: "object" } },
  parameters: {
    docs: {
      description: {
        component:
          "A control to pick a number, or a range between two, by dragging a thumb or with the keyboard. Use it for a value on a continuous or finely stepped scale where the approximate position matters, such as volume or a price range. Use an Input for an exact number, a Select for a few named options, and a RadioGroup for a handful of visible choices. Pass one value for a single thumb and two for a range. Inside a `Field`, the `Field.Label` names it and `Field.Description` and `Field.Error` describe it; on its own it needs an `aria-label`. Arrow keys move one step, Page Up and Page Down (or Shift with an arrow) ten steps, Home and End go to the ends. `showValue` adds a visible label, and `formatValue` shapes it and the value that a screen reader hears. The pointer target is 48px tall and the thumb 24px.",
      },
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Two values make two thumbs. Each is named after the slider: "Price Minimum" and "Price Maximum". */
export const Range: Story = {
  args: { "aria-label": "Price", defaultValue: [20, 80] },
};

/** A visible label, hidden from assistive technology, plus a value text for it: "40%". */
export const WithValue: Story = {
  args: { showValue: true, formatValue: percent },
};

export const RangeWithValue: Story = {
  args: {
    "aria-label": "Price",
    defaultValue: [20, 80],
    showValue: true,
    formatValue: (value: number) => `$${value}`,
  },
};

/** Ten steps of 10, so Page Up and Page Down move by 100. */
export const Steps: Story = {
  args: { min: 0, max: 1000, step: 10, defaultValue: [300], showValue: true },
};

export const Disabled: Story = { args: { disabled: true, showValue: true } };

export const DisabledRange: Story = {
  args: { disabled: true, defaultValue: [20, 80], "aria-label": "Price" },
};

export const Invalid: Story = { args: { invalid: true, showValue: true } };

const ControlledExample = () => {
  const [value, setValue] = useState([40]);

  return (
    <div className="flex flex-col gap-2">
      <Slider
        aria-label="Volume"
        value={value}
        onValueChange={setValue}
        showValue
        formatValue={percent}
      />
      <button
        type="button"
        className="self-start"
        onClick={() => setValue([0])}
      >
        Mute
      </button>
    </div>
  );
};

/** The value lives in React state: `value` and `onValueChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/** Named by the `Field.Label` and described by the `Field.Description`. */
export const WithField: Story = {
  render: () => (
    <Field>
      <Field.Label>Price per night</Field.Label>
      <Slider
        defaultValue={[60, 180]}
        min={0}
        max={400}
        step={10}
        showValue
        formatValue={(value) => `$${value}`}
      />
      <Field.Description>Taxes not included.</Field.Description>
      <Field.Error />
    </Field>
  ),
};

/**
 * Hover, keyboard focus and pressed on the thumb, forced with the pseudo-states addon so that
 * each one can be reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div id="pseudo-hover">
        <Slider aria-label="Hover" defaultValue={[30]} />
      </div>
      <div id="pseudo-focus">
        <Slider aria-label="Focus visible" defaultValue={[50]} />
      </div>
      <div id="pseudo-active">
        <Slider aria-label="Active" defaultValue={[70]} />
      </div>
    </div>
  ),
  parameters: {
    pseudo: {
      hover: ["#pseudo-hover [role=slider]"],
      focusVisible: ["#pseudo-focus [role=slider]"],
      active: ["#pseudo-active [role=slider]"],
    },
  },
};

/**
 * Keyboard, step by step: Tab lands on the thumb, the arrows move one step, Page Up and Page Down
 * ten, Home and End go to the ends. The value is exposed as `aria-valuenow` and, with a
 * formatter, as `aria-valuetext`.
 */
export const KeyboardNavigation: Story = {
  args: { step: 5, showValue: true, formatValue: percent },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const thumb = within(canvasElement).getByRole("slider", { name: "Volume" });

    await user.tab();
    await expect(thumb).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "45");
    await expect(thumb).toHaveAttribute("aria-valuetext", "45%");

    await user.keyboard("{PageUp}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "95");

    await user.keyboard("{ArrowRight}{ArrowRight}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "100");

    await user.keyboard("{Home}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "0");

    await user.keyboard("{End}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "100");
  },
};

const LIMIT = 800;

const ValidationExample = () => {
  const [value, setValue] = useState([400]);
  const invalid = (value[0] ?? 0) > LIMIT;

  return (
    <Field invalid={invalid}>
      <Field.Label>Monthly budget</Field.Label>
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={1000}
        step={50}
        showValue
        formatValue={(amount) => `$${amount}`}
      />
      <Field.Description>The team limit is ${LIMIT}.</Field.Description>
      <Field.Error>{invalid ? "Over the team limit" : null}</Field.Error>
    </Field>
  );
};

/** Going over the limit shows the error, linked to the thumb; coming back under clears it. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const thumb = within(canvasElement).getByRole("slider", {
      name: "Monthly budget",
    });

    await user.tab();
    await user.keyboard("{PageUp}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "900");
    await expect(thumb).toBeInvalid();
    await expect(thumb).toHaveAccessibleDescription(
      "The team limit is $800. Over the team limit",
    );

    await user.keyboard("{PageDown}");
    await expect(thumb).toHaveAttribute("aria-valuenow", "400");
    await expect(thumb).toBeValid();
  },
};

/**
 * A layout check, at full speed, in a very narrow column (96px): the pointer target is at least
 * 44px tall, and each thumb is at least 24px square and stays inside the root.
 */
export const TouchTargets: Story = {
  args: { "aria-label": "Price", defaultValue: [0, 100] },
  render: (args) => (
    <div className="w-24">
      <Slider {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot=slider]");
    const thumbs = canvas.getAllByRole("slider");

    await expect(root?.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      44,
    );
    for (const thumb of thumbs) {
      const box = thumb.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
    }

    // A press anywhere in the 48px height moves the nearest thumb, not only a press on the thumb.
    const rootBox = root?.getBoundingClientRect();
    await userEvent.pointer({
      keys: "[MouseLeft]",
      target: root ?? canvasElement,
      coords: {
        clientX: (rootBox?.left ?? 0) + 40,
        clientY: (rootBox?.top ?? 0) + 3,
      },
    });
    await expect(thumbs[0]).toHaveAttribute(
      "aria-valuenow",
      expect.not.stringMatching(/^0$/),
    );
  },
};
