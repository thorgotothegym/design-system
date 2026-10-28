import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { Field } from "../field";
import { Textarea } from "./textarea";

const meta = {
  title: "Form components/Textarea",
  component: Textarea,
  args: { "aria-label": "Message", placeholder: "Write your message" },
  // The docs table cannot resolve the cva-derived types, so the size control is set by hand.
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  parameters: {
    docs: {
      description: {
        component:
          "A multi-line text input. Use it for long free text such as a message or a description. Use an Input for a single line. Inside a `Field` it is labelled, described and validated automatically; on its own it needs an `aria-label` or an external label. It can be resized vertically; `autoGrow` makes it follow its text instead.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

const SAMPLE =
  "The form saved without a confirmation.\nI expected a message after pressing the button.";

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const Medium: Story = { args: { size: "md" } };

export const Large: Story = { args: { size: "lg" } };

export const Disabled: Story = {
  args: { disabled: true, defaultValue: SAMPLE },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: SAMPLE },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "Too short" },
};

/** Grows with the text, up to the maximum height set with `className`, then scrolls. */
export const AutoGrow: Story = {
  args: { autoGrow: true, className: "max-h-[10lh]", defaultValue: SAMPLE },
};

const ControlledExample = () => {
  const [value, setValue] = useState("Hello");

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        aria-label="Message"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Characters: {value.length}
      </p>
    </div>
  );
};

/** The value lives in React state: `value` and `onChange` go to the native textarea. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed, forced with the pseudo-states addon so that each one can be
 * reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div id="pseudo-hover">
        <Textarea aria-label="Hover" defaultValue="Hover" />
      </div>
      <div id="pseudo-focus">
        <Textarea aria-label="Focus visible" defaultValue="Focus visible" />
      </div>
      <div id="pseudo-active">
        <Textarea aria-label="Active" defaultValue="Active" />
      </div>
    </div>
  ),
  parameters: {
    pseudo: {
      hover: ["#pseudo-hover textarea"],
      focusVisible: ["#pseudo-focus textarea"],
      active: ["#pseudo-active textarea"],
    },
  },
};

const MIN_LENGTH = 10;

const ValidationExample = () => {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const invalid = touched && value.trim().length < MIN_LENGTH;

  return (
    <Field invalid={invalid}>
      <Field.Label>Message</Field.Label>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => setTouched(true)}
      />
      <Field.Description>Tell us what happened.</Field.Description>
      <Field.Error>
        {invalid ? `Write at least ${MIN_LENGTH} characters` : null}
      </Field.Error>
    </Field>
  );
};

/** Validates on blur: the error appears under the field, is linked to it, and clears once fixed. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Message" });

    await userEvent.type(textarea, "Too short");
    await userEvent.tab();

    await expect(textarea).toBeInvalid();
    await expect(textarea).toHaveAccessibleDescription(
      "Tell us what happened. Write at least 10 characters",
    );

    await userEvent.type(textarea, " and now longer");
    await userEvent.tab();

    await expect(textarea).toBeValid();
    await expect(textarea).toHaveAccessibleDescription(
      "Tell us what happened.",
    );
  },
};
