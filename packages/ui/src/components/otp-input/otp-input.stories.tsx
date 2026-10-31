import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { Field } from "../field";
import { OtpInput } from "./otp-input";

const meta = {
  title: "Form components/OtpInput",
  component: OtpInput,
  args: { "aria-label": "Verification code" },
  argTypes: {
    type: { control: "inline-radio", options: ["numeric", "alphanumeric"] },
    groups: { control: "object" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A field for a one-time code, such as the six digits sent by SMS or shown by an authenticator app. Use it for a short code of fixed length; use an Input for anything else. It is **one logical field**: a single text input, with `autocomplete="one-time-code"` so that a code received by SMS can be filled in from the keyboard suggestion, that a screen reader announces once under the name from the `Field.Label`. The boxes are only drawn over it and are hidden from assistive technology. Typing moves along, Backspace deletes, the arrows, Home and End move the caret, and pasting a whole code fills every box (spaces and hyphens are removed). `type` is `numeric` (digits, numeric keypad) or `alphanumeric`; `groups` splits the boxes, for example `[3, 3]`, and must add up to `length`. The control announces nothing on its own: say whether the code was right in the `Field.Error`, which is already a live region. **Import:** from its own entry point, `@aleixvidal/ui/otp-input`, because `input-otp` cannot be tree-shaken and would make every other component larger. **Content-Security-Policy:** input-otp adds one `<style id="input-otp-style">` element to the page when the first field mounts (it hides the selection and autofill highlight and works around an iOS quirk). A policy that forbids inline styles blocks it unless the element has a nonce: pass `nonce` to this component. Without it the field still works; only those cosmetic rules are missing.',
      },
    },
  },
} satisfies Meta<typeof OtpInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FourDigits: Story = { args: { length: 4 } };

/** The boxes in groups of three with a separator. The group sizes must add up to `length`. */
export const Grouped: Story = { args: { groups: [3, 3] } };

export const Alphanumeric: Story = {
  args: { type: "alphanumeric", length: 8, groups: [4, 4] },
};

export const WithValue: Story = { args: { defaultValue: "482913" } };

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "4829" },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "482913" },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "482913" },
};

const ControlledExample = () => {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <OtpInput
        aria-label="Verification code"
        value={code}
        onValueChange={setCode}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Code: {code === "" ? "(empty)" : code}
      </p>
    </div>
  );
};

/** The code lives in React state: `value` and `onValueChange` (a string, not an event). */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * The box being typed into has the `focus.ring` outline. The addon cannot force it (the box
 * follows the input's selection in script), so this story focuses the field.
 */
export const Focused: Story = {
  args: { defaultValue: "48" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("textbox"));
    await userEvent.keyboard("{End}");
  },
};

/** The boxes take the hover border while the pointer is over the field. */
export const Hovered: Story = {
  args: { defaultValue: "48" },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("textbox"));
  },
};

/**
 * Keyboard, step by step: Tab lands on the field, typing fills the boxes and moves along,
 * Backspace deletes, Home and the arrows move the caret so that a box can be overwritten, and
 * completing the code calls `onComplete` once.
 */
export const KeyboardNavigation: Story = {
  args: { length: 4 },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const input = within(canvasElement).getByRole("textbox", {
      name: "Verification code",
    });

    await user.tab();
    await expect(input).toHaveFocus();

    await user.keyboard("123");
    await expect(input).toHaveValue("123");

    await user.keyboard("{Backspace}");
    await expect(input).toHaveValue("12");

    await user.keyboard("34");
    await expect(input).toHaveValue("1234");

    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}");
    await expect(input).toHaveValue("");
  },
};

/** Pasting a whole code, here with a space in the middle, fills every box and completes it. */
export const Pasting: Story = {
  args: { groups: [3, 3] },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Verification code" });

    await user.click(input);
    await user.paste("482 913");

    await expect(input).toHaveValue("482913");
    await expect(
      canvas.getAllByTestId("otp-input-slot").map((box) => box.textContent),
    ).toEqual(["4", "8", "2", "9", "1", "3"]);
  },
};

const CORRECT_CODE = "424242";

const VerificationExample = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<"idle" | "wrong" | "accepted">("idle");

  return (
    <Field invalid={result === "wrong"} required>
      <Field.Label>Verification code</Field.Label>
      <OtpInput
        groups={[3, 3]}
        value={code}
        onValueChange={(next) => {
          setCode(next);
          setResult("idle");
        }}
        onComplete={(complete) =>
          setResult(complete === CORRECT_CODE ? "accepted" : "wrong")
        }
      />
      <Field.Description>
        {result === "accepted" ? "Code accepted." : "We sent it by SMS."}
      </Field.Description>
      <Field.Error>
        {result === "wrong" ? "That code is not right" : null}
      </Field.Error>
    </Field>
  );
};

/** A wrong code, once complete, shows the error linked to the field; editing it clears the error. */
export const VerificationFlow: Story = {
  render: () => <VerificationExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const input = within(canvasElement).getByRole("textbox", {
      name: /Verification code/,
    });

    await user.click(input);
    await user.keyboard("111111");
    // input-otp calls onComplete from an effect, after the last digit has rendered.
    await waitFor(() => expect(input).toBeInvalid());
    await expect(input).toHaveAccessibleDescription(
      "We sent it by SMS. That code is not right",
    );

    await user.keyboard(
      "{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}",
    );
    await expect(input).toBeValid();

    await user.keyboard(CORRECT_CODE);
    await waitFor(() =>
      expect(input).toHaveAccessibleDescription("Code accepted."),
    );
    await expect(input).toBeValid();
  },
};
