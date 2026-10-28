import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Switch } from "../switch";
import { Field } from "./field";

const meta = {
  title: "Form components/Field",
  component: Field,
  subcomponents: {
    "Field.Label": Field.Label,
    "Field.Description": Field.Description,
    "Field.Error": Field.Error,
  },
  // The docs table cannot resolve the cva-derived `orientation` type, so its control is set by hand.
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Groups a form control with its label, description and error and wires them together: `id`, `htmlFor`, `aria-describedby`, `aria-invalid` and `aria-required` are set for you. Use it around every form control. Always render `Field.Error` and pass the message (or nothing while the control is valid): it is a live region and one line of space is reserved for it, so the message appearing does not shift the layout. Keep messages short, a message that wraps does shift it. `orientation` is `vertical` by default (label above the control). Use `horizontal` for a Checkbox, a Switch or a radio option: write the control first and the label second, so the visual order and the DOM order are the same; the description and error go under the label.",
      },
    },
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Field {...args}>
      <Field.Label>Name</Field.Label>
      <Input placeholder="Ada Lovelace" />
      <Field.Error />
    </Field>
  ),
};

export const WithDescription: Story = {
  render: (args) => (
    <Field {...args}>
      <Field.Label>Username</Field.Label>
      <Input placeholder="ada" />
      <Field.Description>
        Letters and numbers, 3 to 20 characters.
      </Field.Description>
      <Field.Error />
    </Field>
  ),
};

export const Required: Story = {
  args: { required: true },
  render: (args) => (
    <Field {...args}>
      <Field.Label>Email</Field.Label>
      <Input type="email" placeholder="ada@example.com" />
      <Field.Error />
    </Field>
  ),
};

export const WithError: Story = {
  args: { invalid: true },
  render: (args) => (
    <Field {...args}>
      <Field.Label>Email</Field.Label>
      <Input type="email" defaultValue="not-an-email" />
      <Field.Description>We only use it to send the receipt.</Field.Description>
      <Field.Error>Enter a valid email address</Field.Error>
    </Field>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Field {...args}>
      <Field.Label>Name</Field.Label>
      <Input defaultValue="Ada Lovelace" />
      <Field.Description>
        Contact support to change your name.
      </Field.Description>
      <Field.Error />
    </Field>
  ),
};

const SubmitExample = () => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && value.trim() === "";

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field required invalid={invalid}>
        <Field.Label>Name</Field.Label>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <Field.Error>{invalid ? "Name is required" : null}</Field.Error>
      </Field>
      <button
        type="submit"
        className="self-start rounded-lg border border-border-control bg-bg-input px-3 py-2 font-mono text-text-default"
      >
        Save
      </button>
    </form>
  );
};

/** Submitting an empty required field shows the error, linked to the input; typing clears it. */
export const ValidationFlow: Story = {
  render: () => <SubmitExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Name" });

    await expect(input).toBeRequired();
    await expect(input).toBeValid();

    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription("Name is required");

    await userEvent.type(input, "Ada");

    await expect(input).toBeValid();
    await expect(input).toHaveAccessibleDescription("");
  },
};

/** Horizontal, for a Checkbox, a Switch or a radio option: control first, then the label. */
export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <Field {...args}>
      <Checkbox />
      <Field.Label>Subscribe to the newsletter</Field.Label>
      <Field.Error />
    </Field>
  ),
};

export const HorizontalWithDescription: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <Field {...args}>
      <Switch />
      <Field.Label>Email notifications</Field.Label>
      <Field.Description>
        One email a week. Takes effect at once.
      </Field.Description>
      <Field.Error />
    </Field>
  ),
};

export const HorizontalRequired: Story = {
  args: { orientation: "horizontal", required: true },
  render: (args) => (
    <Field {...args}>
      <Checkbox />
      <Field.Label>I accept the terms</Field.Label>
      <Field.Error />
    </Field>
  ),
};

export const HorizontalDisabled: Story = {
  args: { orientation: "horizontal", disabled: true },
  render: (args) => (
    <Field {...args}>
      <Checkbox />
      <Field.Label>Subscribe to the newsletter</Field.Label>
      <Field.Description>This option is not available.</Field.Description>
      <Field.Error />
    </Field>
  ),
};

export const HorizontalWithError: Story = {
  args: { orientation: "horizontal", invalid: true },
  render: (args) => (
    <Field {...args}>
      <Checkbox />
      <Field.Label>I accept the terms</Field.Label>
      <Field.Description>You can read them first.</Field.Description>
      <Field.Error>Accept the terms to continue</Field.Error>
    </Field>
  ),
};

const HorizontalValidationExample = () => {
  const [checked, setChecked] = useState(false);
  const [touched, setTouched] = useState(false);
  const invalid = touched && !checked;

  return (
    <Field orientation="horizontal" invalid={invalid} required>
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => {
          setChecked(next === true);
          setTouched(true);
        }}
      />
      <Field.Label>I accept the terms</Field.Label>
      <Field.Description>You can read them first.</Field.Description>
      <Field.Error>
        {invalid ? "Accept the terms to continue" : null}
      </Field.Error>
    </Field>
  );
};

/** The same wiring as the vertical flow: the error is linked to the control and announced. */
export const HorizontalValidationFlow: Story = {
  render: () => <HorizontalValidationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", {
      name: /I accept the terms/,
    });

    await userEvent.click(canvas.getByText(/I accept the terms/));
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBeValid();

    await userEvent.click(checkbox);
    await expect(checkbox).toBeInvalid();
    await expect(checkbox).toHaveAccessibleDescription(
      "You can read them first. Accept the terms to continue",
    );
  },
};
