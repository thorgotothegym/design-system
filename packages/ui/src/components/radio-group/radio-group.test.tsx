import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { RadioGroup } from "./radio-group";
import type { RadioGroupProps } from "./radio-group";

const PLANS = [
  { value: "free", label: "Free", description: "One project." },
  { value: "pro", label: "Pro", description: "Unlimited projects." },
  { value: "team", label: "Team", description: "Shared billing." },
] as const;

type PlanFieldProps = RadioGroupProps & {
  invalid?: boolean;
  required?: boolean;
  disabledOption?: string;
  error?: string;
};

const PlanField = ({
  invalid,
  required,
  disabledOption,
  error,
  ...props
}: PlanFieldProps) => (
  <Field invalid={invalid} required={required}>
    <Field.Label>Plan</Field.Label>
    <RadioGroup {...props}>
      {PLANS.map((plan) => (
        <Field
          key={plan.value}
          orientation="horizontal"
          disabled={plan.value === disabledOption}
        >
          <RadioGroup.Item value={plan.value} />
          <Field.Label>{plan.label}</Field.Label>
          <Field.Description>{plan.description}</Field.Description>
        </Field>
      ))}
    </RadioGroup>
    <Field.Description>You can change it later.</Field.Description>
    <Field.Error>{error}</Field.Error>
  </Field>
);

const ControlledPlan = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("free");

  return (
    <PlanField
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

const FormExample = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { plan: "" } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.plan))}>
      <Controller
        control={control}
        name="plan"
        render={({ field }) => (
          <PlanField
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
 * newly focused option while the arrow is still held, so the key is released after that timeout.
 */
const pressArrow = async (user: User, key: string) => {
  await user.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await user.keyboard(`{/${key}}`);
};

describe("RadioGroup", () => {
  it("should render a radio group named by the Field label", () => {
    render(<PlanField />);

    expect(
      screen.getByRole("radiogroup", { name: "Plan" }),
    ).toBeInTheDocument();
  });

  it("should name each option with its own label", () => {
    render(<PlanField />);

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Pro" })).toBeInTheDocument();
  });

  it("should describe the group with the Field description", () => {
    render(<PlanField />);

    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      "You can change it later.",
    );
  });

  it("should describe each option with its own description", () => {
    render(<PlanField />);

    expect(
      screen.getByRole("radio", { name: "Pro" }),
    ).toHaveAccessibleDescription("Unlimited projects.");
  });

  it("should have no option selected by default", () => {
    render(<PlanField />);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("should select an option when its label is clicked", async () => {
    const user = userEvent.setup();
    render(<PlanField />);

    await user.click(screen.getByText("Team"));

    expect(screen.getByRole("radio", { name: "Team" })).toBeChecked();
  });

  it("should move focus into the group on the selected option with Tab", async () => {
    const user = userEvent.setup();
    render(<PlanField defaultValue="pro" />);

    await user.tab();

    expect(screen.getByRole("radio", { name: "Pro" })).toHaveFocus();
  });

  it("should move focus into the group on the first option with Tab when none is selected", async () => {
    const user = userEvent.setup();
    render(<PlanField />);

    await user.tab();

    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();
  });

  it("should keep a single tab stop for the whole group", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PlanField defaultValue="free" />
        <button type="button">Next</button>
      </>,
    );

    await user.tab();
    await user.tab();

    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
  });

  it("should move focus and select with the Down and Up arrows when vertical", async () => {
    const user = userEvent.setup();
    render(<PlanField defaultValue="free" />);

    await user.tab();
    await pressArrow(user, "ArrowDown");

    expect(screen.getByRole("radio", { name: "Pro" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();

    await pressArrow(user, "ArrowUp");

    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
  });

  it("should wrap from the last option to the first", async () => {
    const user = userEvent.setup();
    render(<PlanField defaultValue="team" />);

    await user.tab();
    await pressArrow(user, "ArrowDown");

    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
  });

  it("should use the Left and Right arrows when horizontal", async () => {
    const user = userEvent.setup();
    render(<PlanField orientation="horizontal" defaultValue="free" />);

    await user.tab();
    await pressArrow(user, "ArrowDown");

    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();

    await pressArrow(user, "ArrowRight");

    expect(screen.getByRole("radio", { name: "Pro" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("should expose its orientation", () => {
    render(<PlanField orientation="horizontal" />);

    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
  });

  it("should be vertical by default", () => {
    render(<PlanField />);

    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("should select the focused option with Space", async () => {
    const user = userEvent.setup();
    render(<PlanField />);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
  });

  it("should skip a disabled option with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<PlanField defaultValue="free" disabledOption="pro" />);

    await user.tab();
    await pressArrow(user, "ArrowDown");

    expect(screen.getByRole("radio", { name: "Pro" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Team" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Team" })).toBeChecked();
  });

  it("should not select a disabled option when it is clicked", async () => {
    const user = userEvent.setup();
    render(<PlanField disabledOption="pro" />);

    await user.click(screen.getByRole("radio", { name: "Pro" }));

    expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
  });

  it("should disable every option when the group is disabled", async () => {
    const user = userEvent.setup();
    render(<PlanField disabled />);

    await user.tab();

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
    expect(document.body).toHaveFocus();
  });

  it("should be invalid with the error linked when the Field says so", () => {
    render(<PlanField invalid error="Choose a plan" />);

    expect(screen.getByRole("radiogroup")).toBeInvalid();
    expect(screen.getByRole("radiogroup")).toHaveAttribute("data-invalid");
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      "You can change it later. Choose a plan",
    );
  });

  it("should be invalid when its own invalid prop is set", () => {
    render(<RadioGroup aria-label="Plan" invalid />);

    expect(screen.getByRole("radiogroup")).toBeInvalid();
  });

  it("should not be invalid by default", () => {
    render(<PlanField />);

    expect(screen.getByRole("radiogroup")).toBeValid();
  });

  it("should be required when the Field is required", () => {
    render(<PlanField required />);

    expect(screen.getByRole("radiogroup")).toBeRequired();
  });

  it("should not be required by default", () => {
    render(<PlanField />);

    expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-required");
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledPlan onValueChange={onValueChange} />);

    await user.click(screen.getByRole("radio", { name: "Team" }));

    expect(screen.getByRole("radio", { name: "Team" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Free" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("team");
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("radio", { name: "Pro" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("pro");
  });

  it("should keep its own aria-labelledby and aria-describedby when used on its own", () => {
    render(
      <>
        <p id="heading">Plan</p>
        <p id="hint">Billed monthly.</p>
        <RadioGroup aria-labelledby="heading" aria-describedby="hint">
          <RadioGroup.Item value="free" aria-label="Free" />
        </RadioGroup>
      </>,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Plan" }),
    ).toHaveAccessibleDescription("Billed monthly.");
  });

  it("should forward the ref and className of the group to its element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<RadioGroup aria-label="Plan" ref={ref} className="custom" />);

    expect(ref.current).toBe(screen.getByRole("radiogroup"));
    expect(screen.getByRole("radiogroup")).toHaveClass("custom");
  });

  it("should forward the ref and className of an option to its button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <RadioGroup aria-label="Plan">
        <RadioGroup.Item
          value="free"
          aria-label="Free"
          ref={ref}
          className="custom"
        />
      </RadioGroup>,
    );

    expect(ref.current).toBe(screen.getByRole("radio"));
    expect(screen.getByRole("radio")).toHaveClass("custom");
  });

  it("should pass native props to the group", () => {
    render(<RadioGroup aria-label="Plan" title="Hint" />);

    expect(screen.getByRole("radiogroup")).toHaveAttribute("title", "Hint");
  });

  it.each([
    ["default", {}],
    ["selected", { defaultValue: "pro" }],
    ["horizontal", { orientation: "horizontal" }],
    ["disabled", { disabled: true, defaultValue: "pro" }],
    ["with a disabled option", { disabledOption: "pro" }],
    [
      "invalid and required",
      { invalid: true, required: true, error: "Choose a plan" },
    ],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<PlanField {...props} />);

      await expectNoA11yViolations();
    },
  );
});
