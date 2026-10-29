import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { OtpInput } from "./otp-input";
import type { OtpInputProps } from "./otp-input";

const ControlledOtp = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("12");

  return (
    <OtpInput
      aria-label="Code"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

const LabelledOtp = (props: OtpInputProps) => (
  <Field>
    <Field.Label>Verification code</Field.Label>
    <OtpInput {...props} />
    <Field.Description>Sent to your phone.</Field.Description>
    <Field.Error />
  </Field>
);

const FormExample = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { code: "" } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.code))}>
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <OtpInput
            aria-label="Code"
            ref={field.ref}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <button type="submit">Verify</button>
    </form>
  );
};

const boxes = () => screen.getAllByTestId("otp-input-slot");
const boxText = () => boxes().map((box) => box.textContent);

// jsdom does no layout, so it has no `elementFromPoint`. input-otp asks it which element is over the
// field (to find a password manager badge); with no answer there is no badge to move away from.
// Stubbed here and not in the shared setup: Radix Select reacts to it differently when it exists.
beforeAll(() => {
  document.elementFromPoint = () => null;
});

afterAll(() => {
  // @ts-expect-error -- restores jsdom's state, where the method does not exist
  delete document.elementFromPoint;
});

describe("OtpInput", () => {
  it("should be a single text field, however many boxes it draws", () => {
    render(<OtpInput aria-label="Code" />);

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Code" })).toBeInTheDocument();
    expect(boxes()).toHaveLength(6);
  });

  it("should hide the boxes from assistive technology", () => {
    render(<OtpInput aria-label="Code" />);

    for (const box of boxes()) {
      expect(box).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("should ask for a one-time code with the numeric keypad and the right length", () => {
    render(<OtpInput aria-label="Code" />);

    const input = screen.getByRole("textbox");

    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("maxlength", "6");
  });

  it("should use the length it is given", () => {
    render(<OtpInput aria-label="Code" length={4} />);

    expect(boxes()).toHaveLength(4);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "4");
  });

  it("should show what is typed in the boxes", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" length={4} />);

    await user.type(screen.getByRole("textbox"), "123");

    expect(boxText()).toEqual(["1", "2", "3", ""]);
    expect(screen.getByRole("textbox")).toHaveValue("123");
  });

  it("should delete the last character with Backspace", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" defaultValue="123" />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{End}{Backspace}");

    expect(screen.getByRole("textbox")).toHaveValue("12");
  });

  it("should not accept more characters than its length", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" length={4} />);

    await user.type(screen.getByRole("textbox"), "123456");

    expect(screen.getByRole("textbox")).toHaveValue("1234");
  });

  it("should reject letters when it is numeric", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" />);

    await user.type(screen.getByRole("textbox"), "12ab34");

    expect(screen.getByRole("textbox")).toHaveValue("1234");
  });

  it("should accept letters and digits, with the plain keyboard, when it is alphanumeric", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" type="alphanumeric" />);

    await user.type(screen.getByRole("textbox"), "a1B2-!c3");

    expect(screen.getByRole("textbox")).toHaveValue("a1B2c3");
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "text");
  });

  it("should fill every box when a whole code is pasted", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("123456");

    expect(boxText()).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it.each(["123 456", "123-456", " 123456 "])(
    "should remove spaces and hyphens from a pasted code: %j",
    async (pasted) => {
      const user = userEvent.setup();
      render(<OtpInput aria-label="Code" />);

      await user.click(screen.getByRole("textbox"));
      await user.paste(pasted);

      expect(screen.getByRole("textbox")).toHaveValue("123456");
    },
  );

  it("should ignore a pasted code that does not match its type", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("abcdef");

    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("should call onComplete once, with the code, when it is full", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput aria-label="Code" length={4} onComplete={onComplete} />);

    await user.type(screen.getByRole("textbox"), "123");
    expect(onComplete).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "4");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("should call onComplete when a whole code is pasted", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput aria-label="Code" onComplete={onComplete} />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("123 456");

    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("should draw the boxes in groups with a separator between them", () => {
    render(<OtpInput aria-label="Code" groups={[3, 3]} />);

    expect(screen.getAllByTestId("otp-input-group")).toHaveLength(2);
    expect(boxes()).toHaveLength(6);
    expect(screen.getByText("–")).toHaveAttribute("aria-hidden", "true");
  });

  it("should not draw a separator without groups", () => {
    render(<OtpInput aria-label="Code" />);

    expect(screen.queryByText("–")).not.toBeInTheDocument();
  });

  it("should throw in development when the groups do not add up to the length", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(<OtpInput aria-label="Code" length={6} groups={[3, 2]} />),
    ).toThrow("groups [3, 2] add up to 5, but length is 6");

    error.mockRestore();
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledOtp onValueChange={onValueChange} />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{End}3");

    expect(screen.getByRole("textbox")).toHaveValue("123");
    expect(onValueChange).toHaveBeenLastCalledWith("123");
  });

  it("should report the new code as a string when it is uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<OtpInput aria-label="Code" onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "12");

    expect(onValueChange).toHaveBeenLastCalledWith("12");
  });

  it("should start from its default value", () => {
    render(<OtpInput aria-label="Code" defaultValue="123" />);

    expect(screen.getByRole("textbox")).toHaveValue("123");
    expect(boxText().slice(0, 3)).toEqual(["1", "2", "3"]);
  });

  it("should not accept typing or focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" disabled />);

    await user.tab();
    await user.keyboard("123");

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByTestId("otp-input")).toHaveAttribute("data-disabled");
  });

  it("should stay focusable but not editable when it is read-only", async () => {
    const user = userEvent.setup();
    render(<OtpInput aria-label="Code" readOnly defaultValue="123456" />);

    await user.tab();
    await user.keyboard("9");

    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveValue("123456");
    expect(screen.getByTestId("otp-input")).toHaveAttribute("data-readonly");
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<OtpInput aria-label="Code" invalid />);

    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByTestId("otp-input")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<OtpInput aria-label="Code" />);

    expect(screen.getByRole("textbox")).toBeValid();
  });

  it("should be labelled by the Field, and focused by its label", async () => {
    const user = userEvent.setup();
    render(<LabelledOtp />);

    await user.click(screen.getByText("Verification code"));

    expect(screen.getByLabelText("Verification code")).toBe(
      screen.getByRole("textbox"),
    );
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("should be described by the Field description", () => {
    render(<LabelledOtp />);

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Sent to your phone.",
    );
  });

  it("should be required and invalid with the error linked when the Field says so", () => {
    render(
      <Field invalid required>
        <Field.Label>Verification code</Field.Label>
        <OtpInput />
        <Field.Error>That code is not right</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeRequired();
    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "That code is not right",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field disabled>
        <Field.Label>Verification code</Field.Label>
        <OtpInput />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should not announce anything on its own when it is complete", async () => {
    const user = userEvent.setup();
    render(<LabelledOtp length={4} />);

    await user.type(screen.getByRole("textbox"), "1234");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("should submit the code under its name in a native form", async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Verify">
        <OtpInput aria-label="Code" name="code" />
      </form>,
    );

    await user.type(screen.getByRole("textbox"), "123456");
    const data = new FormData(screen.getByRole("form", { name: "Verify" }));

    expect(data.get("code")).toBe("123456");
  });

  it("should forward the ref to the input and className to the box", () => {
    const ref = createRef<HTMLInputElement>();
    render(<OtpInput aria-label="Code" ref={ref} className="custom" />);

    expect(ref.current).toBe(screen.getByRole("textbox"));
    expect(screen.getByTestId("otp-input")).toHaveClass("custom");
    expect(screen.getByRole("textbox")).not.toHaveClass("custom");
  });

  it("should pass native props to the input", () => {
    render(<OtpInput aria-label="Code" name="code" title="Hint" />);

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "code");
    expect(screen.getByRole("textbox")).toHaveAttribute("title", "Hint");
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Sent to your phone.</p>
        <OtpInput aria-label="Code" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Sent to your phone.",
    );
  });

  it("should add its one style element to the page with the nonce it is given", () => {
    // input-otp adds the element once per page, so one left by an earlier test is removed first.
    for (const old of within(document.head).queryAllByText("", {
      selector: "#input-otp-style",
      ignore: false,
    })) {
      old.remove();
    }

    render(<OtpInput aria-label="Code" nonce="abc123" />);

    const style = within(document.head).getByText("", {
      selector: "#input-otp-style",
      ignore: false,
    });

    expect(style).toHaveAttribute("nonce", "abc123");
    expect(style).toHaveAttribute("id", "input-otp-style");
  });

  it.each<[string, OtpInputProps]>([
    ["empty", {}],
    ["with a code", { defaultValue: "123456" }],
    ["in groups", { groups: [3, 3] }],
    ["alphanumeric", { type: "alphanumeric" }],
    ["disabled", { disabled: true }],
    ["read-only", { readOnly: true, defaultValue: "123456" }],
    ["invalid", { invalid: true }],
  ])(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<OtpInput aria-label="Code" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations inside a Field with an error", async () => {
    render(
      <Field invalid required>
        <Field.Label>Verification code</Field.Label>
        <OtpInput groups={[3, 3]} />
        <Field.Description>Sent to your phone.</Field.Description>
        <Field.Error>That code is not right</Field.Error>
      </Field>,
    );

    await expectNoA11yViolations();
  });
});
