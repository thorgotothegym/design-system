import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { __Name__ } from "./__name__";
import type { __Name__Props } from "./__name__";

const OPTIONS = [
  { value: "one", label: "Option one", description: "The first option." },
  { value: "two", label: "Option two", description: "The second option." },
  { value: "three", label: "Option three", description: "The third option." },
] as const;

type ExampleFieldProps = __Name__Props & {
  invalid?: boolean;
  required?: boolean;
  disabledOption?: string;
  error?: string;
};

const ExampleField = ({
  invalid,
  required,
  disabledOption,
  error,
  ...props
}: ExampleFieldProps) => (
  <Field invalid={invalid} required={required}>
    <Field.Label>Choice</Field.Label>
    <__Name__ {...props}>
      {OPTIONS.map((option) => (
        <Field
          key={option.value}
          orientation="horizontal"
          disabled={option.value === disabledOption}
        >
          <__Name__.Item value={option.value} />
          <Field.Label>{option.label}</Field.Label>
          <Field.Description>{option.description}</Field.Description>
        </Field>
      ))}
    </__Name__>
    <Field.Description>You can change it later.</Field.Description>
    <Field.Error>{error}</Field.Error>
  </Field>
);

const ControlledExample = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("one");

  return (
    <ExampleField
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

const FormExample = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { choice: "" } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.choice))}>
      <Controller
        control={control}
        name="choice"
        render={({ field }) => (
          <ExampleField
            ref={field.ref}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};

type User = ReturnType<typeof userEvent.setup>;

/**
 * Presses an arrow key the way a person does: Radix moves focus in a timeout and only selects the
 * newly focused item while the arrow is still held, so the key is released after that timeout.
 */
const pressArrow = async (user: User, key: string) => {
  await user.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await user.keyboard(`{/${key}}`);
};

describe("__Name__", () => {
  it("should render a group named by the Field label, with one named item per option", () => {
    render(<ExampleField />);

    expect(
      screen.getByRole("__role__", { name: "Choice" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("__itemRole__")).toHaveLength(3);
    expect(
      screen.getByRole("__itemRole__", { name: "Option two" }),
    ).toHaveAccessibleDescription("The second option.");
  });

  it("should describe the group with the Field description", () => {
    render(<ExampleField />);

    expect(screen.getByRole("__role__")).toHaveAccessibleDescription(
      "You can change it later.",
    );
  });

  it("should select an item when its label is clicked", async () => {
    const user = userEvent.setup();
    render(<ExampleField />);

    await user.click(screen.getByText("Option three"));

    expect(
      screen.getByRole("__itemRole__", { name: "Option three" }),
    ).toBeChecked();
  });

  it("should keep a single tab stop, on the selected item", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ExampleField defaultValue="two" />
        <button type="button">Next</button>
      </>,
    );

    await user.tab();

    expect(screen.getByRole("__itemRole__", { name: "Option two" })).toHaveFocus();

    await user.tab();

    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
  });

  it("should move focus and select with the Down and Up arrows when vertical", async () => {
    const user = userEvent.setup();
    render(<ExampleField defaultValue="one" />);

    await user.tab();
    await pressArrow(user, "ArrowDown");

    expect(screen.getByRole("__itemRole__", { name: "Option two" })).toHaveFocus();
    expect(screen.getByRole("__itemRole__", { name: "Option two" })).toBeChecked();

    await pressArrow(user, "ArrowUp");

    expect(screen.getByRole("__itemRole__", { name: "Option one" })).toBeChecked();
  });

  it("should use the Left and Right arrows when horizontal", async () => {
    const user = userEvent.setup();
    render(<ExampleField orientation="horizontal" defaultValue="one" />);

    await user.tab();
    await pressArrow(user, "ArrowRight");

    expect(screen.getByRole("__role__")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(screen.getByRole("__itemRole__", { name: "Option two" })).toBeChecked();
  });

  it("should skip a disabled item with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<ExampleField defaultValue="one" disabledOption="two" />);

    await user.tab();
    await pressArrow(user, "ArrowDown");

    expect(screen.getByRole("__itemRole__", { name: "Option two" })).toBeDisabled();
    expect(screen.getByRole("__itemRole__", { name: "Option three" })).toHaveFocus();
  });

  it("should disable every item when the group is disabled", async () => {
    const user = userEvent.setup();
    render(<ExampleField disabled />);

    await user.tab();

    for (const item of screen.getAllByRole("__itemRole__")) {
      expect(item).toBeDisabled();
    }
    expect(document.body).toHaveFocus();
  });

  it("should be invalid with the error linked when the Field says so", () => {
    render(<ExampleField invalid error="Choose an option" />);

    expect(screen.getByRole("__role__")).toBeInvalid();
    expect(screen.getByRole("__role__")).toHaveAccessibleDescription(
      "You can change it later. Choose an option",
    );
  });

  it("should not be invalid by default", () => {
    render(<ExampleField />);

    expect(screen.getByRole("__role__")).toBeValid();
  });

//#if requiredSupported
  it("should be required when the Field is required", () => {
    render(<ExampleField required />);

    expect(screen.getByRole("__role__")).toBeRequired();
  });
//#endif
//#if-not requiredSupported
  // A __role__ does not support aria-required, so the Field's `required` is not forwarded to it.
  it("should not be aria-required when the Field is required", () => {
    render(<ExampleField required />);

    expect(screen.getByRole("__role__")).not.toHaveAttribute("aria-required");
  });
//#endif

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledExample onValueChange={onValueChange} />);

    await user.click(screen.getByRole("__itemRole__", { name: "Option three" }));

    expect(screen.getByRole("__itemRole__", { name: "Option three" })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("three");
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("__itemRole__", { name: "Option two" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("two");
  });

  it("should keep its own aria-labelledby and aria-describedby when used on its own", () => {
    render(
      <>
        <p id="heading">Choice</p>
        <p id="hint">Pick one.</p>
        <__Name__ aria-labelledby="heading" aria-describedby="hint">
          <__Name__.Item value="one" aria-label="Option one" />
        </__Name__>
      </>,
    );

    expect(
      screen.getByRole("__role__", { name: "Choice" }),
    ).toHaveAccessibleDescription("Pick one.");
  });

  it("should forward the ref, className and native props of the group", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <__Name__ aria-label="Choice" ref={ref} className="custom" title="Hint" />,
    );

    expect(ref.current).toBe(screen.getByRole("__role__"));
    expect(screen.getByRole("__role__")).toHaveClass("custom");
    expect(screen.getByRole("__role__")).toHaveAttribute("title", "Hint");
  });

  it("should forward the ref and className of an item to its button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <__Name__ aria-label="Choice">
        <__Name__.Item
          value="one"
          aria-label="Option one"
          ref={ref}
          className="custom"
        />
      </__Name__>,
    );

    expect(ref.current).toBe(screen.getByRole("__itemRole__"));
    expect(screen.getByRole("__itemRole__")).toHaveClass("custom");
  });

  it.each([
    ["default", {}],
    ["selected", { defaultValue: "two" }],
    ["horizontal", { orientation: "horizontal" }],
    ["disabled", { disabled: true, defaultValue: "two" }],
    ["with a disabled item", { disabledOption: "two" }],
    [
      "invalid and required",
      { invalid: true, required: true, error: "Choose an option" },
    ],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<ExampleField {...props} />);

      await expectNoA11yViolations();
    },
  );
});
