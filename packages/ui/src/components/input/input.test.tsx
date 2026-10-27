import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Input } from "./input";

const ControlledInput = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("Ada");

  return (
    <Input
      aria-label="Name"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        onValueChange(event.target.value);
      }}
    />
  );
};

describe("Input", () => {
  it("should render a textbox", () => {
    render(<Input aria-label="Name" />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("should use the medium size by default", () => {
    render(<Input aria-label="Name" />);

    expect(screen.getByTestId("input")).toHaveAttribute("data-size", "md");
  });

  it.each(["sm", "md", "lg"] as const)("should apply the %s size", (size) => {
    render(<Input aria-label="Name" size={size} />);

    expect(screen.getByTestId("input")).toHaveAttribute("data-size", size);
  });

  it("should accept typing when it is uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" defaultValue="Ada" />);

    await user.type(screen.getByRole("textbox"), " Lovelace");

    expect(screen.getByRole("textbox")).toHaveValue("Ada Lovelace");
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledInput onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "!");

    expect(screen.getByRole("textbox")).toHaveValue("Ada!");
    expect(onValueChange).toHaveBeenLastCalledWith("Ada!");
  });

  it("should not accept typing or focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" disabled defaultValue="Ada" />);

    await user.type(screen.getByRole("textbox"), "x");
    await user.tab();

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("Ada");
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    expect(screen.getByTestId("input")).toHaveAttribute("data-disabled");
  });

  it("should stay focusable but not editable when it is read-only", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" readOnly defaultValue="Ada" />);

    await user.tab();
    await user.keyboard("x");

    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveValue("Ada");
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<Input aria-label="Name" invalid />);

    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByTestId("input")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<Input aria-label="Name" />);

    expect(screen.getByRole("textbox")).toBeValid();
  });

  it("should be busy but stay editable while loading", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" loading />);

    await user.type(screen.getByRole("textbox"), "Ada");

    expect(screen.getByRole("textbox")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.getByRole("textbox")).toHaveValue("Ada");
  });

  it("should not be busy when it is not loading", () => {
    render(<Input aria-label="Name" />);

    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-busy");
  });

  it("should render a prefix and a suffix", () => {
    render(<Input aria-label="Price" prefix="$" suffix="USD" />);

    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("should focus the input when the prefix is pressed", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Price" prefix="$" />);

    await user.click(screen.getByText("$"));

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("should keep an interactive suffix clickable and in the tab order", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <Input
        aria-label="Search"
        suffix={
          <button type="button" onClick={onClear}>
            Clear
          </button>
        }
      />,
    );

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Clear" })).toHaveFocus();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("should forward the ref to the input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("textbox"));
  });

  it("should put className on the box around the input, not on the input", () => {
    render(<Input aria-label="Name" className="custom" />);

    expect(screen.getByTestId("input")).toHaveClass("custom");
    expect(screen.getByRole("textbox")).not.toHaveClass("custom");
  });

  it("should pass native props to the input", () => {
    render(
      <Input
        aria-label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        maxLength={40}
      />,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "email");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "40");
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Use your work address.</p>
        <Input aria-label="Email" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Use your work address.",
    );
  });

  it.each([
    ["default", {}],
    ["small", { size: "sm" }],
    ["large", { size: "lg" }],
    ["disabled", { disabled: true }],
    ["read-only", { readOnly: true, defaultValue: "Ada" }],
    ["invalid", { invalid: true }],
    ["loading", { loading: true }],
    ["with a prefix and a suffix", { prefix: "$", suffix: "USD" }],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<Input aria-label="Name" {...props} />);

      await expectNoA11yViolations();
    },
  );
});
