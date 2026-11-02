import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { RadioGroup } from "./radio-group";
import type { RadioGroupProps } from "./radio-group";

const PLANS = [
  {
    value: "free",
    label: "Free",
    description: "One project, community support.",
  },
  {
    value: "pro",
    label: "Pro",
    description: "Unlimited projects and history.",
  },
  { value: "team", label: "Team", description: "Shared billing and roles." },
] as const;

type PlanFieldProps = RadioGroupProps & {
  invalid?: boolean;
  required?: boolean;
  disabledOption?: string;
  error?: string;
};

/** The composition every story uses: a Field for the group, and one horizontal Field per option. */
const PlanField = ({
  invalid,
  required,
  disabledOption,
  error,
  ...props
}: PlanFieldProps) => (
  <Field invalid={invalid} required={required}>
    <Field.Label>Plan</Field.Label>
    <RadioGroup {...props}>
      {PLANS.map((plan) => (
        <Field
          key={plan.value}
          orientation="horizontal"
          disabled={plan.value === disabledOption}
        >
          <RadioGroup.Item value={plan.value} />
          <Field.Label>{plan.label}</Field.Label>
          <Field.Description>{plan.description}</Field.Description>
        </Field>
      ))}
    </RadioGroup>
    <Field.Description>You can change it at any time.</Field.Description>
    <Field.Error>{error}</Field.Error>
  </Field>
);

const meta = {
  title: "Form components/RadioGroup",
  component: RadioGroup,
  subcomponents: { "RadioGroup.Item": RadioGroup.Item },
  // The docs table cannot resolve the cva-derived `orientation` type, so its control is set by hand.
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
  },
  render: (args) => <PlanField {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'A set of options of which exactly one can be selected. Use it for two to about five options that should all stay visible. Use a Select for a longer list, a Checkbox for an independent yes/no, and a Switch for a setting that applies at once. Inside a `Field`, the `Field.Label` names the group and `Field.Description` and `Field.Error` describe it; each option is a `RadioGroup.Item` in its own `<Field orientation="horizontal">`, item first, with its own label and optional description. Clicking the `Field.Label` of the group does nothing, like the legend of a native `<fieldset>`; the label of each option selects it. Tab moves into and out of the group (one tab stop); the arrow keys move between options and select them; Space selects the focused option.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { defaultValue: "pro" } };

/** Options in a row that wraps. The Left and Right arrows move between them. */
export const Horizontal: Story = {
  args: { orientation: "horizontal", defaultValue: "free" },
};

/** One option is disabled: it cannot be selected and the arrow keys skip it. */
export const DisabledOption: Story = {
  render: (args) => (
    <PlanField {...args} defaultValue="free" disabledOption="pro" />
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "pro" },
};

export const Invalid: Story = {
  render: (args) => (
    <PlanField {...args} invalid required error="Choose a plan to continue" />
  ),
};

const ControlledExample = () => {
  const [value, setValue] = useState("free");

  return (
    <div className="flex flex-col gap-2">
      <PlanField value={value} onValueChange={setValue} />
      <p className="m-0 font-sans text-sm text-text-muted">Value: {value}</p>
    </div>
  );
};

/** The value lives in React state: `value` and `onValueChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed, forced with the pseudo-states addon so that each one can be
 * reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <RadioGroup aria-label="Pseudo-states" orientation="horizontal">
      <div id="pseudo-hover">
        <RadioGroup.Item value="hover" aria-label="Hover" />
      </div>
      <div id="pseudo-focus">
        <RadioGroup.Item value="focus" aria-label="Focus visible" />
      </div>
      <div id="pseudo-active">
        <RadioGroup.Item value="active" aria-label="Active" />
      </div>
    </RadioGroup>
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
 * Keyboard: Tab lands on the selected option, the arrows move and select (skipping the disabled
 * option and wrapping at the end), and Tab leaves the group. Each arrow is held until Radix has
 * moved focus, as a person's key press is.
 */
export const KeyboardNavigation: Story = {
  render: (args) => (
    <PlanField {...args} defaultValue="free" disabledOption="pro" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const free = canvas.getByRole("radio", { name: "Free" });
    const team = canvas.getByRole("radio", { name: "Team" });

    await expect(
      canvas.getByRole("radiogroup", { name: "Plan" }),
    ).toHaveAccessibleDescription("You can change it at any time.");

    await userEvent.tab();
    await expect(free).toHaveFocus();

    await userEvent.keyboard("{ArrowDown>}");
    await waitFor(() => expect(team).toHaveFocus());
    await userEvent.keyboard("{/ArrowDown}");
    await expect(team).toBeChecked();

    await userEvent.keyboard("{ArrowDown>}");
    await waitFor(() => expect(free).toHaveFocus());
    await userEvent.keyboard("{/ArrowDown}");
    await expect(free).toBeChecked();
    await expect(team).not.toBeChecked();
  },
};

const ValidationExample = () => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && value === "";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <PlanField
        value={value}
        onValueChange={setValue}
        invalid={invalid}
        required
        error={invalid ? "Choose a plan to continue" : undefined}
      />
      <button type="submit" className="self-start">
        Continue
      </button>
    </form>
  );
};

/** Required: submitting with nothing selected shows the error, linked to the group; choosing clears it. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: /Plan/ });

    await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
    await expect(group).toBeInvalid();
    await expect(group).toBeRequired();
    await expect(group).toHaveAccessibleDescription(
      "You can change it at any time. Choose a plan to continue",
    );

    await userEvent.click(canvas.getByRole("radio", { name: "Team" }));
    await expect(group).toBeValid();
  },
};
