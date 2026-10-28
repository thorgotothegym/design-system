import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { __Name__ } from "./__name__";

const meta = {
  title: "Form components/__Name__",
  component: __Name__,
  args: { "aria-label": "__Name__", placeholder: "Type here" },
  // The docs table cannot resolve the cva-derived `size` type, so its control is set by hand.
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  parameters: {
    docs: {
      description: {
        component:
          "SCAFFOLD-PLACEHOLDER: when to use __name__ and when not to. Inside a `Field` it is labelled, described and validated automatically; on its own it needs an `aria-label` or an external label.",
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

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Disabled value" },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "Read-only value" },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "Invalid value" },
};

const ControlledExample = () => {
  const [value, setValue] = useState("Ada");

  return (
    <div className="flex flex-col gap-2">
      <__Name__
        aria-label="__Name__"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Value: {value === "" ? "(empty)" : value}
      </p>
    </div>
  );
};

/** The value lives in React state: `value` and `onChange` go to the native element. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed, forced with the pseudo-states addon so that each one can be
 * reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div id="pseudo-hover">
        <__Name__ aria-label="Hover" defaultValue="Hover" />
      </div>
      <div id="pseudo-focus">
        <__Name__ aria-label="Focus visible" defaultValue="Focus visible" />
      </div>
      <div id="pseudo-active">
        <__Name__ aria-label="Active" defaultValue="Active" />
      </div>
    </div>
  ),
  parameters: {
    pseudo: {
      hover: ["#pseudo-hover __element__"],
      focusVisible: ["#pseudo-focus __element__"],
      active: ["#pseudo-active __element__"],
    },
  },
};

const ValidationExample = () => {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const invalid = touched && value.trim() === "";

  return (
    <Field invalid={invalid} required>
      <Field.Label>Name</Field.Label>
      <__Name__
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setTouched(true)}
      />
      <Field.Description>Shown to other people.</Field.Description>
      <Field.Error>{invalid ? "Enter a name" : null}</Field.Error>
    </Field>
  );
};

/** Validates on blur: the error appears under the field, is linked to it, and clears once fixed. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("textbox", { name: /Name/ });

    await userEvent.click(control);
    await userEvent.tab();

    await expect(control).toBeInvalid();
    await expect(control).toHaveAccessibleDescription(
      "Shown to other people. Enter a name",
    );

    await userEvent.type(control, "Ada");
    await userEvent.tab();

    await expect(control).toBeValid();
    await expect(control).toHaveAccessibleDescription("Shown to other people.");
  },
};

/**
 * SCAFFOLD-PLACEHOLDER: replace this story with the real interaction flow of the component
 * (keyboard navigation, open and close, ...), then rename it and delete this comment. It only
 * proves that the component renders, so it is not a finished interaction story.
 */
export const InteractionPlaceholder: Story = {
  name: "PLACEHOLDER: replace with a real interaction",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("textbox")).toBeVisible();
  },
};
