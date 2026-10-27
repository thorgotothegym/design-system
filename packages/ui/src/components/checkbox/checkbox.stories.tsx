import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Form components/Checkbox",
  component: Checkbox,
  args: { "aria-label": "Subscribe to the newsletter" },
  parameters: {
    docs: {
      description: {
        component:
          "A box that is checked, unchecked or indeterminate. Use it for an independent yes/no choice, or to pick several options from a set. Use a Switch for a setting that applies at once and a RadioGroup to pick exactly one option. Inside a `Field`, place it beside the `Field.Label` so the label toggles it; on its own it needs an `aria-label` or an external label. Space toggles it, and an indeterminate box becomes checked when activated.",
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

/** Some, but not all, of a set are selected. It is announced as "partially checked". */
export const Indeterminate: Story = { args: { checked: "indeterminate" } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Invalid: Story = { args: { invalid: true } };

const ControlledExample = () => {
  const [checked, setChecked] = useState<boolean | "indeterminate">(false);

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        aria-label="Subscribe"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        State: {String(checked)}
      </p>
    </div>
  );
};

/** The state lives in React: `checked` and `onCheckedChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Beside a `Field.Label`: the label toggles the box and its text is the accessible name. The
 * description sits under the label (`pl-7` is the box width plus the gap).
 */
export const WithLabelAndDescription: Story = {
  render: () => (
    <Field>
      <div className="flex items-center gap-2">
        <Checkbox />
        <Field.Label>Subscribe to the newsletter</Field.Label>
      </div>
      <Field.Description className="pl-7">
        One email a week. You can unsubscribe at any time.
      </Field.Description>
      <Field.Error className="pl-7" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", {
      name: "Subscribe to the newsletter",
    });

    await userEvent.click(canvas.getByText("Subscribe to the newsletter"));
    await expect(checkbox).toBeChecked();

    await userEvent.click(canvas.getByText("Subscribe to the newsletter"));
    await expect(checkbox).not.toBeChecked();

    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(checkbox).toBeChecked();
  },
};

const OPTIONS = ["Email", "SMS", "Push"] as const;

const GroupExample = () => {
  const [selected, setSelected] = useState<string[]>(["Email"]);
  const all =
    selected.length === OPTIONS.length
      ? true
      : selected.length === 0
        ? false
        : "indeterminate";

  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 font-mono text-sm text-text-default">
        Notifications
      </legend>
      <Field>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={all}
            onCheckedChange={(next) =>
              setSelected(next === true ? [...OPTIONS] : [])
            }
          />
          <Field.Label>All notifications</Field.Label>
        </div>
      </Field>
      {OPTIONS.map((option) => (
        <Field key={option} className="pl-7">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={(next) =>
                setSelected((current) =>
                  next === true
                    ? [...current, option]
                    : current.filter((item) => item !== option),
                )
              }
            />
            <Field.Label>{option}</Field.Label>
          </div>
        </Field>
      ))}
    </fieldset>
  );
};

/**
 * A group is a native `fieldset` with a `legend`; each box has its own `Field`. The parent box
 * is indeterminate while only some options are selected.
 */
export const Group: Story = {
  render: () => <GroupExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole("checkbox", { name: "All notifications" });

    await expect(
      canvas.getByRole("group", { name: "Notifications" }),
    ).toBeVisible();
    await expect(all).toBePartiallyChecked();

    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "SMS" })).toBeChecked();

    await userEvent.click(canvas.getByRole("checkbox", { name: "SMS" }));
    await expect(all).toBePartiallyChecked();
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
        <Checkbox aria-label="Hover" />
      </div>
      <div id="pseudo-focus">
        <Checkbox aria-label="Focus visible" defaultChecked />
      </div>
      <div id="pseudo-active">
        <Checkbox aria-label="Active" />
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

const ValidationExample = () => {
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState(false);
  const invalid = touched && !checked;

  return (
    <Field invalid={invalid} required>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={checked}
          onCheckedChange={(next) => {
            setChecked(next === true);
            setTouched(true);
          }}
        />
        <Field.Label>I accept the terms</Field.Label>
      </div>
      <Field.Error className="pl-7">
        {invalid ? "Accept the terms to continue" : null}
      </Field.Error>
    </Field>
  );
};

/** Required: unchecking it again shows the error under the label, linked to the box. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", {
      name: /I accept the terms/,
    });

    await userEvent.click(checkbox);
    await expect(checkbox).toBeValid();

    await userEvent.click(checkbox);
    await expect(checkbox).toBeInvalid();
    await expect(checkbox).toHaveAccessibleDescription(
      "Accept the terms to continue",
    );

    await userEvent.click(checkbox);
    await expect(checkbox).toBeValid();
  },
};
