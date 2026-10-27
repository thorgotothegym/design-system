import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { Checkbox } from "./checkbox";
import type { CheckboxProps } from "./checkbox";

const ControlledCheckbox = ({
  onCheckedChange,
}: {
  onCheckedChange: CheckboxProps["onCheckedChange"];
}) => {
  const [checked, setChecked] = useState<CheckboxProps["checked"]>(false);

  return (
    <Checkbox
      aria-label="Subscribe"
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onCheckedChange?.(next);
      }}
    />
  );
};

const LabelledCheckbox = (props: CheckboxProps) => (
  <Field>
    <div>
      <Checkbox {...props} />
      <Field.Label>Accept the terms</Field.Label>
    </div>
    <Field.Description>You can change this later.</Field.Description>
    <Field.Error />
  </Field>
);

const GroupExample = () => {
  const [selected, setSelected] = useState<string[]>(["email"]);
  const options = ["email", "sms", "push"];
  const all =
    selected.length === options.length
      ? true
      : selected.length === 0
        ? false
        : "indeterminate";

  return (
    <fieldset>
      <legend>Notifications</legend>
      <Checkbox
        aria-label="All"
        checked={all}
        onCheckedChange={(next) => setSelected(next === true ? options : [])}
      />
      {options.map((option) => (
        <Checkbox
          key={option}
          aria-label={option}
          checked={selected.includes(option)}
          onCheckedChange={(next) =>
            setSelected((current) =>
              next === true
                ? [...current, option]
                : current.filter((item) => item !== option),
            )
          }
        />
      ))}
    </fieldset>
  );
};

const FormExample = ({ onSubmit }: { onSubmit: (value: boolean) => void }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { terms: false },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.terms))}>
      <Controller
        control={control}
        name="terms"
        render={({ field }) => (
          <Checkbox
            aria-label="Terms"
            ref={field.ref}
            checked={field.value}
            onCheckedChange={(next) => field.onChange(next === true)}
          />
        )}
      />
      <button type="submit">Send</button>
    </form>
  );
};

describe("Checkbox", () => {
  it("should render an unchecked checkbox by default", () => {
    render(<Checkbox aria-label="Subscribe" />);

    expect(
      screen.getByRole("checkbox", { name: "Subscribe" }),
    ).not.toBeChecked();
  });

  it("should render checked when it starts checked", () => {
    render(<Checkbox aria-label="Subscribe" defaultChecked />);

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("should be announced as partially checked when it is indeterminate", () => {
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);

    expect(screen.getByRole("checkbox")).toBePartiallyChecked();
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("should toggle on click when it is uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Subscribe" />);

    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();

    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("should toggle with the Space key", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Subscribe" />);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("should not toggle with the Enter key", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Subscribe" />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("should become checked when an indeterminate checkbox is activated", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Select all" defaultChecked="indeterminate" />);

    await user.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<ControlledCheckbox onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it("should not change when it is disabled", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Subscribe" disabled />);

    await user.click(screen.getByRole("checkbox"));
    await user.tab();

    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("checkbox")).not.toHaveFocus();
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<Checkbox aria-label="Subscribe" invalid />);

    expect(screen.getByRole("checkbox")).toBeInvalid();
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<Checkbox aria-label="Subscribe" />);

    expect(screen.getByRole("checkbox")).toBeValid();
  });

  it("should forward the ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Checkbox aria-label="Subscribe" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("checkbox"));
  });

  it("should put className on the checkbox", () => {
    render(<Checkbox aria-label="Subscribe" className="custom" />);

    expect(screen.getByRole("checkbox")).toHaveClass("custom");
  });

  it("should pass native props to the button", () => {
    render(
      <Checkbox
        aria-label="Subscribe"
        name="subscribe"
        value="yes"
        title="Hint"
      />,
    );

    expect(screen.getByRole("checkbox")).toHaveAttribute("value", "yes");
    expect(screen.getByRole("checkbox")).toHaveAttribute("title", "Hint");
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">We send one email a week.</p>
        <Checkbox aria-label="Subscribe" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "We send one email a week.",
    );
  });

  it("should toggle when its label is clicked inside a Field", async () => {
    const user = userEvent.setup();
    render(<LabelledCheckbox />);

    await user.click(screen.getByText("Accept the terms"));

    expect(
      screen.getByRole("checkbox", { name: "Accept the terms" }),
    ).toBeChecked();
  });

  it("should be described by the Field description", () => {
    render(<LabelledCheckbox />);

    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "You can change this later.",
    );
  });

  it("should be required and invalid with the error linked when the Field says so", () => {
    render(
      <Field invalid required>
        <div>
          <Checkbox />
          <Field.Label>Accept the terms</Field.Label>
        </div>
        <Field.Error>Accept the terms to continue</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeInvalid();
    expect(screen.getByRole("checkbox")).toHaveAccessibleDescription(
      "Accept the terms to continue",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field disabled>
        <div>
          <Checkbox />
          <Field.Label>Accept the terms</Field.Label>
        </div>
      </Field>,
    );

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("should work in a group whose parent is indeterminate", async () => {
    const user = userEvent.setup();
    render(<GroupExample />);

    expect(
      screen.getByRole("group", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "All" }),
    ).toBePartiallyChecked();

    await user.click(screen.getByRole("checkbox", { name: "All" }));
    expect(screen.getByRole("checkbox", { name: "All" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "sms" })).toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "sms" }));
    expect(
      screen.getByRole("checkbox", { name: "All" }),
    ).toBePartiallyChecked();
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("checkbox", { name: "Terms" }));
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledWith(true);
  });

  it.each([
    ["unchecked", {}],
    ["checked", { defaultChecked: true }],
    ["indeterminate", { checked: "indeterminate" }],
    ["disabled", { disabled: true }],
    ["disabled and checked", { disabled: true, defaultChecked: true }],
    ["invalid", { invalid: true }],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<Checkbox aria-label="Subscribe" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations inside a Field with a label", async () => {
    render(<LabelledCheckbox />);

    await expectNoA11yViolations();
  });
});
