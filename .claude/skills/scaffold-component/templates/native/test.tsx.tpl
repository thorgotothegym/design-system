import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { __Name__ } from "./__name__";

const Controlled__Name__ = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("Ada");

  return (
    <__Name__
      aria-label="Name"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        onValueChange(event.target.value);
      }}
    />
  );
};

describe("__Name__", () => {
  it("should render a textbox", () => {
    render(<__Name__ aria-label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("should use the medium size by default", () => {
    render(<__Name__ aria-label="Name" />);

    expect(screen.getByTestId("__name__")).toHaveAttribute("data-size", "md");
  });

  it.each(["sm", "md", "lg"] as const)("should apply the %s size", (size) => {
    render(<__Name__ aria-label="Name" size={size} />);

    expect(screen.getByTestId("__name__")).toHaveAttribute("data-size", size);
  });

  it("should accept typing when it is uncontrolled", async () => {
    const user = userEvent.setup();
    render(<__Name__ aria-label="Name" defaultValue="Ada" />);

    await user.type(screen.getByRole("textbox"), " Lovelace");

    expect(screen.getByRole("textbox")).toHaveValue("Ada Lovelace");
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled__Name__ onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "!");

    expect(screen.getByRole("textbox")).toHaveValue("Ada!");
    expect(onValueChange).toHaveBeenLastCalledWith("Ada!");
  });

  it("should not accept typing or focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<__Name__ aria-label="Name" disabled defaultValue="Ada" />);

    await user.type(screen.getByRole("textbox"), "x");
    await user.tab();

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("Ada");
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    expect(screen.getByTestId("__name__")).toHaveAttribute("data-disabled");
  });

  it("should stay focusable but not editable when it is read-only", async () => {
    const user = userEvent.setup();
    render(<__Name__ aria-label="Name" readOnly defaultValue="Ada" />);

    await user.tab();
    await user.keyboard("x");

    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveValue("Ada");
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<__Name__ aria-label="Name" invalid />);

    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByTestId("__name__")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<__Name__ aria-label="Name" />);

    expect(screen.getByRole("textbox")).toBeValid();
  });

  it("should forward the ref to the element", () => {
    const ref = createRef<__HtmlElement__>();
    render(<__Name__ aria-label="Name" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox"));
  });

  it("should merge className onto the element", () => {
    render(<__Name__ aria-label="Name" className="custom" />);

    expect(screen.getByRole("textbox")).toHaveClass("custom");
  });

  it("should pass native props to the element", () => {
    render(
      <__Name__
        aria-label="Name"
        name="name"
        placeholder="Your name"
        maxLength={40}
      />,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "name");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "40");
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Use your full name.</p>
        <__Name__ aria-label="Name" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Use your full name.",
    );
  });

  it("should be labelled and described by the Field", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <__Name__ />
        <Field.Description>Shown to other people.</Field.Description>
        <Field.Error />
      </Field>,
    );

    expect(screen.getByLabelText("Name")).toBe(screen.getByRole("textbox"));
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Shown to other people.",
    );
  });

  it("should be required and invalid with the error linked when the Field says so", () => {
    render(
      <Field invalid required>
        <Field.Label>Name</Field.Label>
        <__Name__ />
        <Field.Error>Enter a name</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeRequired();
    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Enter a name",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field disabled>
        <Field.Label>Name</Field.Label>
        <__Name__ />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it.each([
    ["default", {}],
    ["small", { size: "sm" }],
    ["large", { size: "lg" }],
    ["disabled", { disabled: true }],
    ["read-only", { readOnly: true, defaultValue: "Ada" }],
    ["invalid", { invalid: true }],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<__Name__ aria-label="Name" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations inside a Field with an error", async () => {
    render(
      <Field invalid required>
        <Field.Label>Name</Field.Label>
        <__Name__ />
        <Field.Description>Shown to other people.</Field.Description>
        <Field.Error>Enter a name</Field.Error>
      </Field>,
    );

    await expectNoA11yViolations();
  });
});
