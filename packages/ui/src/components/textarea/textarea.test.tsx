import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { Textarea } from "./textarea";

const ControlledTextarea = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("Hello");

  return (
    <Textarea
      aria-label="Message"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        onValueChange(event.target.value);
      }}
    />
  );
};

describe("Textarea", () => {
  it("should render a textbox", () => {
    render(<Textarea aria-label="Message" />);

    expect(
      screen.getByRole("textbox", { name: "Message" }),
    ).toBeInTheDocument();
  });

  it("should use the medium size and three rows by default", () => {
    render(<Textarea aria-label="Message" />);

    expect(screen.getByRole("textbox")).toHaveAttribute("data-size", "md");
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "3");
  });

  it.each(["sm", "md", "lg"] as const)("should apply the %s size", (size) => {
    render(<Textarea aria-label="Message" size={size} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("data-size", size);
  });

  it("should accept typing and new lines when it is uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Message" defaultValue="Hello" />);

    await user.type(screen.getByRole("textbox"), "{Enter}world");

    expect(screen.getByRole("textbox")).toHaveValue("Hello\nworld");
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledTextarea onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "!");

    expect(screen.getByRole("textbox")).toHaveValue("Hello!");
    expect(onValueChange).toHaveBeenLastCalledWith("Hello!");
  });

  it("should move focus in and out with Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Textarea aria-label="Message" />
        <button type="button">Send</button>
      </>,
    );

    await user.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Send" })).toHaveFocus();
  });

  it("should not accept typing or focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Message" disabled defaultValue="Hello" />);

    await user.type(screen.getByRole("textbox"), "x");
    await user.tab();

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("Hello");
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveAttribute("data-disabled");
  });

  it("should stay focusable but not editable when it is read-only", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Message" readOnly defaultValue="Hello" />);

    await user.tab();
    await user.keyboard("x");

    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveValue("Hello");
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.getByRole("textbox")).toHaveAttribute("data-readonly");
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<Textarea aria-label="Message" invalid />);

    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByRole("textbox")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<Textarea aria-label="Message" />);

    expect(screen.getByRole("textbox")).toBeValid();
  });

  it("should be resizable vertically by default", () => {
    render(<Textarea aria-label="Message" />);

    expect(screen.getByRole("textbox")).toHaveClass("resize-y");
  });

  it("should size itself to its content when autoGrow is set", () => {
    render(<Textarea aria-label="Message" autoGrow />);

    expect(screen.getByRole("textbox")).toHaveClass("field-sizing-content");
  });

  it("should keep growing with new lines when autoGrow is set", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Message" autoGrow />);

    await user.type(screen.getByRole("textbox"), "one{Enter}two{Enter}three");

    expect(screen.getByRole("textbox")).toHaveValue("one\ntwo\nthree");
  });

  it("should forward the ref to the textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Message" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox"));
  });

  it("should put className on the textarea and let it replace a default class", () => {
    render(<Textarea aria-label="Message" className="custom resize-none" />);

    expect(screen.getByRole("textbox")).toHaveClass("custom", "resize-none");
    expect(screen.getByRole("textbox")).not.toHaveClass("resize-y");
  });

  it("should pass native props to the textarea", () => {
    render(
      <Textarea
        aria-label="Message"
        name="message"
        rows={6}
        maxLength={200}
        placeholder="Write here"
      />,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "message");
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "200");
    expect(screen.getByPlaceholderText("Write here")).toBeInTheDocument();
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Keep it short.</p>
        <Textarea aria-label="Message" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Keep it short.",
    );
  });

  it("should be labelled, described and validated by the Field around it", () => {
    render(
      <Field invalid required>
        <Field.Label>Message</Field.Label>
        <Textarea />
        <Field.Description>Tell us what happened.</Field.Description>
        <Field.Error>Write at least a sentence</Field.Error>
      </Field>,
    );

    const textarea = screen.getByRole("textbox", { name: /Message/ });
    expect(textarea).toBeInvalid();
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAccessibleDescription(
      "Tell us what happened. Write at least a sentence",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field disabled>
        <Field.Label>Message</Field.Label>
        <Textarea />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it.each([
    ["default", {}],
    ["small", { size: "sm" }],
    ["large", { size: "lg" }],
    ["auto-growing", { autoGrow: true }],
    ["disabled", { disabled: true }],
    ["read-only", { readOnly: true, defaultValue: "Hello" }],
    ["invalid", { invalid: true }],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<Textarea aria-label="Message" {...props} />);

      await expectNoA11yViolations();
    },
  );
});
