import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { __Name__ } from "./__name__";

const meta = {
  title: "Form components/__Name__",
  component: __Name__,
  args: { "aria-label": "__Name__" },
  parameters: {
    docs: {
      description: {
        component:
          "SCAFFOLD-PLACEHOLDER: when to use __name__ and when not to. Inside a `Field`, place it beside the `Field.Label` so the label toggles it; on its own it needs an `aria-label` or an external label.",
      },
    },
  },
} satisfies Meta<typeof __Name__>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Invalid: Story = { args: { invalid: true } };

const ControlledExample = () => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <__Name__
        aria-label="__Name__"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        State: {checked ? "on" : "off"}
      </p>
    </div>
  );
};

/** The state lives in React: `checked` and `onCheckedChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * A horizontal `Field`: the control comes first, then the label that toggles it and names it. The
 * description and error sit under the label.
 */
export const WithLabelAndDescription: Story = {
  render: () => (
    <Field orientation="horizontal">
      <__Name__ />
      <Field.Label>__Name__ label</Field.Label>
      <Field.Description>Describes what the control does.</Field.Description>
      <Field.Error />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("__role__", { name: "__Name__ label" });

    await userEvent.click(canvas.getByText("__Name__ label"));
    await expect(control).toBeChecked();

    await userEvent.tab();
    await expect(control).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(control).not.toBeChecked();
    await expect(control).toHaveAccessibleDescription(
      "Describes what the control does.",
    );
  },
};

/**
 * Hover, keyboard focus and pressed, forced with the pseudo-states addon so that each one can be
 * reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex gap-6">
      <div id="pseudo-hover">
        <__Name__ aria-label="Hover" />
      </div>
      <div id="pseudo-focus">
        <__Name__ aria-label="Focus visible" defaultChecked />
      </div>
      <div id="pseudo-active">
        <__Name__ aria-label="Active" />
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
 * SCAFFOLD-PLACEHOLDER: replace this story with the real interaction flow of the component
 * (keyboard navigation, validation, ...), then rename it and delete this comment. It only proves
 * that the component renders, so it is not a finished interaction story.
 */
export const InteractionPlaceholder: Story = {
  name: "PLACEHOLDER: replace with a real interaction",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("__role__")).toBeVisible();
  },
};
