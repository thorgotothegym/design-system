import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "../input";
import { Field } from "./field";

const meta = {
  title: "Form components/Field",
  component: Field,
  subcomponents: {
    "Field.Label": Field.Label,
    "Field.Description": Field.Description,
    "Field.Error": Field.Error,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Groups a form control with its label, description and error and wires them together: `id`, `htmlFor`, `aria-describedby`, `aria-invalid` and `aria-required` are set for you. Use it around every form control. Always render `Field.Error` and pass the message (or nothing while the control is valid): it is a live region and one line of space is reserved for it, so the message appearing does not shift the layout. Keep messages short, a message that wraps does shift it.",
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
