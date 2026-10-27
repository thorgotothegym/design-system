import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { Input } from "./input";

const meta = {
  title: "Form components/Input",
  component: Input,
  args: { "aria-label": "Name", placeholder: "Ada Lovelace" },
  // The docs table cannot resolve the cva-derived `size` type, so its control is set by hand.
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  parameters: {
    docs: {
      description: {
        component:
          "A single-line text input. Use it for short free text such as a name, an email or a search term. Use a Textarea for long text and a Select for a fixed set of choices. Inside a `Field` it is labelled, described and validated automatically; on its own it needs an `aria-label` or an external label.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const Medium: Story = { args: { size: "md" } };

export const Large: Story = { args: { size: "lg" } };

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Ada Lovelace" },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "Ada Lovelace" },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "not-an-email" },
};

export const Loading: Story = {
  args: { loading: true, defaultValue: "ada@example.com" },
};

export const WithPrefix: Story = {
  args: {
    "aria-label": "Amount",
    placeholder: "0.00",
    prefix: <span aria-hidden="true">$</span>,
  },
};

export const WithSuffix: Story = {
  args: {
    "aria-label": "Weight",
    placeholder: "0",
    suffix: <span aria-hidden="true">kg</span>,
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    "aria-label": "Price",
    placeholder: "0.00",
    prefix: <span aria-hidden="true">$</span>,
    suffix: <span aria-hidden="true">USD</span>,
  },
};

const ControlledExample = () => {
  const [value, setValue] = useState("Ada");

  return (
    <div className="flex flex-col gap-2">
      <Input
        aria-label="Name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Value: {value === "" ? "(empty)" : value}
      </p>
    </div>
  );
};

/** The value lives in React state: `value` and `onChange` go to the native input. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed, forced with the pseudo-states addon so that each one can be
 * reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div id="pseudo-hover">
        <Input aria-label="Hover" defaultValue="Hover" />
      </div>
      <div id="pseudo-focus">
        <Input aria-label="Focus visible" defaultValue="Focus visible" />
      </div>
      <div id="pseudo-active">
        <Input aria-label="Active" defaultValue="Active" />
      </div>
    </div>
  ),
  parameters: {
    pseudo: {
      hover: ["#pseudo-hover [data-slot=input]"],
      focusVisible: ["#pseudo-focus input"],
      active: ["#pseudo-active [data-slot=input]"],
    },
  },
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const ValidationExample = () => {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const invalid = touched && !isEmail(value);

  return (
    <Field invalid={invalid}>
      <Field.Label>Email</Field.Label>
      <Input
        type="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setTouched(true)}
      />
      <Field.Description>We only use it to send the receipt.</Field.Description>
      <Field.Error>
        {invalid ? "Enter a valid email address" : null}
      </Field.Error>
    </Field>
  );
};

/** Validates on blur: the error appears under the field, is linked to it, and clears once fixed. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Email" });

    await userEvent.type(input, "not-an-email");
    await userEvent.tab();

    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription(
      "We only use it to send the receipt. Enter a valid email address",
    );

    await userEvent.clear(input);
    await userEvent.type(input, "ada@example.com");
    await userEvent.tab();

    await expect(input).toBeValid();
    await expect(input).toHaveAccessibleDescription(
      "We only use it to send the receipt.",
    );
  },
};
