import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Field } from "./field";

type FieldStateProps = {
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
};

type EmailFormProps = { onSubmit: (values: { email: string }) => void };

const EmailForm = ({ onSubmit }: EmailFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>();

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Field invalid={Boolean(errors.email)} required>
        <Field.Label>Email</Field.Label>
        <Input
          type="email"
          {...register("email", { required: "Email is required" })}
        />
        <Field.Error>{errors.email?.message}</Field.Error>
      </Field>
      <button type="submit">Send</button>
    </form>
  );
};

describe("Field", () => {
  it("should label the control", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("should focus the control when the label is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    await user.click(screen.getByText("Name"));

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("should describe the control with the description", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Description>As on your passport.</Field.Description>
      </Field>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "As on your passport.",
    );
  });

  it("should not reference a description that is not rendered", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
  });

  it("should link the error to the control after the description when invalid", () => {
    render(
      <Field invalid>
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Description>As on your passport.</Field.Description>
        <Field.Error>Name is required</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "As on your passport. Name is required",
    );
    expect(screen.getByRole("textbox")).toBeInvalid();
  });

  it("should not link the error and should keep the control valid when valid", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Description>As on your passport.</Field.Description>
        <Field.Error />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "As on your passport.",
    );
    expect(screen.getByRole("textbox")).toBeValid();
  });

  it("should always render the error as an empty polite live region while valid", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Error />
      </Field>,
    );

    expect(screen.getByTestId("field-error")).toBeEmptyDOMElement();
    expect(screen.getByTestId("field-error")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByTestId("field-error")).toHaveAttribute(
      "aria-atomic",
      "true",
    );
  });

  it("should announce the message by filling the same live region", () => {
    const { rerender } = render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Error />
      </Field>,
    );
    const region = screen.getByTestId("field-error");

    rerender(
      <Field invalid>
        <Field.Label>Name</Field.Label>
        <Input />
        <Field.Error>Name is required</Field.Error>
      </Field>,
    );

    expect(screen.getByTestId("field-error")).toBe(region);
    expect(region).toHaveTextContent("Name is required");
  });

  it("should mark the control as required without the native attribute", () => {
    render(
      <Field required>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeRequired();
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-required",
      "true",
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("required");
  });

  it("should show the required marker without changing the accessible name", () => {
    render(
      <Field required>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("should disable the control", () => {
    render(
      <Field disabled>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should give every field its own ids", () => {
    render(
      <>
        <Field>
          <Field.Label>First</Field.Label>
          <Input />
        </Field>
        <Field>
          <Field.Label>Second</Field.Label>
          <Input />
        </Field>
      </>,
    );

    const first = screen.getByRole("textbox", { name: "First" });
    const second = screen.getByRole("textbox", { name: "Second" });

    expect(first.id).not.toBe("");
    expect(first.id).not.toBe(second.id);
  });

  it("should use the id it is given", () => {
    render(
      <Field id="email" invalid>
        <Field.Label>Email</Field.Label>
        <Input />
        <Field.Error>Email is required</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("id", "email");
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Email is required",
    );
  });

  it("should keep the label linked when the input has an id of its own", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input id="other" />
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  it("should append the input's own aria-describedby to the field's", () => {
    render(
      <>
        <p id="extra">Extra hint.</p>
        <Field>
          <Field.Label>Name</Field.Label>
          <Input aria-describedby="extra" />
          <Field.Description>As on your passport.</Field.Description>
        </Field>
      </>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "As on your passport. Extra hint.",
    );
  });

  it("should work with an input that is also invalid on its own", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input invalid />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeInvalid();
  });

  it("should forward the ref and className to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Field ref={ref} className="custom">
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(ref.current).toBe(screen.getByTestId("field"));
    expect(screen.getByTestId("field")).toHaveClass("custom");
  });

  it("should throw a clear error when a part is used outside a Field", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => render(<Field.Label>Name</Field.Label>)).toThrow(
      "Field.Label must be rendered inside <Field>",
    );

    consoleError.mockRestore();
  });

  it("should show the validation error from react-hook-form and clear it once fixed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EmailForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: "ada@example.com" });
    expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeValid();
  });

  it.each<[string, FieldStateProps]>([
    ["default", {}],
    ["required", { required: true }],
    ["disabled", { disabled: true }],
    ["invalid", { invalid: true }],
  ])(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(
        <Field {...props}>
          <Field.Label>Name</Field.Label>
          <Input />
          <Field.Description>As on your passport.</Field.Description>
          <Field.Error>
            {props.invalid ? "Name is required" : undefined}
          </Field.Error>
        </Field>,
      );

      await expectNoA11yViolations();
    },
  );

  it("should be vertical by default", () => {
    render(
      <Field>
        <Field.Label>Name</Field.Label>
        <Input />
      </Field>,
    );

    expect(screen.getByTestId("field")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it.each(["vertical", "horizontal"] as const)(
    "should wire the label, description and error the same way when %s",
    async (orientation) => {
      const user = userEvent.setup();
      render(
        <Field orientation={orientation} invalid required>
          <Checkbox />
          <Field.Label>Accept the terms</Field.Label>
          <Field.Description>You can read them first.</Field.Description>
          <Field.Error>Accept the terms to continue</Field.Error>
        </Field>,
      );

      await user.click(screen.getByText("Accept the terms"));

      expect(screen.getByTestId("field")).toHaveAttribute(
        "data-orientation",
        orientation,
      );
      expect(
        screen.getByRole("checkbox", { name: /Accept the terms/ }),
      ).toBeChecked();
      expect(screen.getByRole("checkbox")).toBeInvalid();
      expect(screen.getByRole("checkbox")).toBeRequired();
      expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
        "You can read them first. Accept the terms to continue",
      );
    },
  );

  it("should keep the error as a live region in the horizontal orientation", () => {
    render(
      <Field orientation="horizontal">
        <Checkbox />
        <Field.Label>Accept the terms</Field.Label>
        <Field.Error />
      </Field>,
    );

    expect(screen.getByTestId("field-error")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(screen.getByTestId("field-error")).toBeEmptyDOMElement();
  });

  it("should have no accessibility violations when horizontal", async () => {
    render(
      <Field orientation="horizontal" required>
        <Checkbox />
        <Field.Label>Accept the terms</Field.Label>
        <Field.Description>You can read them first.</Field.Description>
        <Field.Error />
      </Field>,
    );

    await expectNoA11yViolations();
  });
});
