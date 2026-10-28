import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { Switch } from "./switch";

const meta = {
  title: "Form components/Switch",
  component: Switch,
  args: { "aria-label": "Email notifications" },
  parameters: {
    docs: {
      description: {
        component:
          "A control that turns a setting on or off. Use it for a setting that takes effect as soon as it is toggled. Use a Checkbox when the choice is applied on submit or is one of several options, and a RadioGroup to pick exactly one option. Inside a `Field`, place it beside the `Field.Label` so the label toggles it; on its own it needs an `aria-label` or an external label. It is announced as a switch, and Space toggles it. The thumb only slides when the user has not asked for reduced motion.",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledOn: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Invalid: Story = { args: { invalid: true } };

const ControlledExample = () => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Switch
        aria-label="Email notifications"
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
 * A horizontal `Field`: the switch comes first, then the label that toggles it and names it. The
 * description and error sit under the label.
 */
export const WithLabelAndDescription: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Switch />
      <Field.Label>Email notifications</Field.Label>
      <Field.Description>
        One email a week with what changed. Takes effect at once.
      </Field.Description>
      <Field.Error />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", {
      name: "Email notifications",
    });

    await expect(control).not.toBeChecked();

    await userEvent.click(canvas.getByText("Email notifications"));
    await expect(control).toBeChecked();

    await userEvent.tab();
    await expect(control).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(control).not.toBeChecked();
    await expect(control).toHaveAccessibleDescription(
      "One email a week with what changed. Takes effect at once.",
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
        <Switch aria-label="Hover" />
      </div>
      <div id="pseudo-focus">
        <Switch aria-label="Focus visible" defaultChecked />
      </div>
      <div id="pseudo-active">
        <Switch aria-label="Active" />
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
