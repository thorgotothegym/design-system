import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { __Name__ } from "./__name__";
import type { __Name__Props } from "./__name__";

type ExampleProps = Omit<__Name__Props, "children">;

const ExampleOptions = () => (
  <>
    <__Name__.Group>
      <__Name__.Label>Fruit</__Name__.Label>
      <__Name__.Item value="apple">Apple</__Name__.Item>
      <__Name__.Item value="banana" disabled>
        Banana
      </__Name__.Item>
      <__Name__.Item value="cherry">Cherry</__Name__.Item>
    </__Name__.Group>
    <__Name__.Separator />
    <__Name__.Group>
      <__Name__.Label>Vegetables</__Name__.Label>
      <__Name__.Item value="leek">Leek</__Name__.Item>
      <__Name__.Item value="pea">Pea</__Name__.Item>
    </__Name__.Group>
  </>
);

const Example = (props: ExampleProps) => (
  <__Name__ aria-label="Produce" placeholder="Choose one" {...props}>
    <ExampleOptions />
  </__Name__>
);

type ExampleFieldProps = ExampleProps & {
  fieldInvalid?: boolean;
  fieldRequired?: boolean;
  fieldDisabled?: boolean;
  error?: string;
};

const ExampleField = ({
  fieldInvalid,
  fieldRequired,
  fieldDisabled,
  error,
  ...props
}: ExampleFieldProps) => (
  <Field
    invalid={fieldInvalid}
    required={fieldRequired}
    disabled={fieldDisabled}
  >
    <Field.Label>Produce</Field.Label>
    <__Name__ placeholder="Choose one" {...props}>
      <ExampleOptions />
    </__Name__>
    <Field.Description>Picked fresh.</Field.Description>
    <Field.Error>{error}</Field.Error>
  </Field>
);

const ControlledExample = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("apple");

  return (
    <Example
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

const FormExample = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { produce: "" } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.produce))}>
      <Controller
        control={control}
        name="produce"
        render={({ field }) => (
          <Example
            ref={field.ref}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};

describe("__Name__", () => {
  it("should render a closed combo box that shows the placeholder", () => {
    render(<Example />);

    expect(screen.getByRole("combobox", { name: "Produce" })).toHaveTextContent(
      "Choose one",
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it.each(["sm", "md", "lg"] as const)("should apply the %s size", (size) => {
    render(<Example size={size} />);

    expect(screen.getByRole("combobox")).toHaveAttribute("data-size", size);
  });

  it("should start open with defaultOpen, for stories that show the list", () => {
    render(<Example defaultOpen />);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should open with Enter, choose with the arrows and Enter, then close and return focus", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example defaultValue="apple" onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Cherry");
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("cherry");
  });

  it("should close with Escape without changing the value", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="apple" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Apple");
  });

  it("should draw the highlighted option as an inset focus ring, not only a fill", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="apple" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");

    // The fill alone is about 1.1:1 against the popover, so the inset ring is the indicator
    // (WCAG 1.4.11). jsdom loads no stylesheet, so the classes are what can be asserted.
    const highlighted = screen.getByRole("option", { name: "Cherry" });
    expect(highlighted).toHaveAttribute("data-highlighted");
    expect(highlighted).toHaveClass(
      "data-highlighted:outline-2",
      "data-highlighted:outline-solid",
      "data-highlighted:-outline-offset-2",
      "data-highlighted:outline-focus-ring",
    );
  });

  it("should put the list on the dropdown layer", async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole("combobox"));

    // The z-index token is the whole point here, and the content has no role of its own.
    expect(screen.getByTestId("__name__-content")).toHaveClass(
      "z-(--ds-z-dropdown)",
    );
  });

  it("should skip a disabled option with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Example defaultValue="apple" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveFocus();
  });

  it("should not open or take focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<Example disabled />);

    await user.click(screen.getByRole("combobox"));
    await user.tab();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<Example invalid />);

    expect(screen.getByRole("combobox")).toBeInvalid();
    expect(screen.getByRole("combobox")).toHaveAttribute("data-invalid");
  });

  it("should be labelled and described by the Field", () => {
    render(<ExampleField />);

    expect(screen.getByLabelText("Produce")).toBe(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Picked fresh.",
    );
  });

  it("should be required and invalid with the error linked when the Field says so", () => {
    render(<ExampleField fieldInvalid fieldRequired error="Choose one" />);

    expect(screen.getByRole("combobox")).toBeRequired();
    expect(screen.getByRole("combobox")).toBeInvalid();
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Picked fresh. Choose one",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(<ExampleField fieldDisabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledExample onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Leek" }));

    expect(screen.getByRole("combobox")).toHaveTextContent("Leek");
    expect(onValueChange).toHaveBeenLastCalledWith("leek");
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("combobox", { name: "Produce" }));
    await user.click(screen.getByRole("option", { name: "Pea" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("pea");
  });

  it("should forward the ref, className and native props to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Example ref={ref} className="custom" title="Hint" />);

    expect(ref.current).toBe(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveClass("custom");
    expect(screen.getByRole("combobox")).toHaveAttribute("title", "Hint");
  });

  it.each([
    ["with a placeholder", {}],
    ["with a value", { defaultValue: "cherry" }],
    ["disabled", { disabled: true }],
    [
      "invalid and required",
      { fieldInvalid: true, fieldRequired: true, error: "Choose one" },
    ],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<ExampleField {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<ExampleField defaultValue="apple" />);

    await user.click(screen.getByRole("combobox"));

    await expectNoA11yViolations();
  });
});
