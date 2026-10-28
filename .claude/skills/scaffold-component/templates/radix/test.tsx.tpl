import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { __Name__ } from "./__name__";
import type { __Name__Props } from "./__name__";

const Controlled__Name__ = ({
  onCheckedChange,
}: {
  onCheckedChange: __Name__Props["onCheckedChange"];
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <__Name__
      aria-label="Setting"
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onCheckedChange?.(next);
      }}
    />
  );
};

const Labelled__Name__ = (props: __Name__Props) => (
  <Field orientation="horizontal">
    <__Name__ {...props} />
    <Field.Label>Setting label</Field.Label>
    <Field.Description>Describes the setting.</Field.Description>
    <Field.Error />
  </Field>
);

// Radix renders a hidden form input inside a <form>; jsdom needs the ResizeObserver stub that
// already lives in src/test/setup.ts, so nothing extra is needed here.
const FormExample = ({ onSubmit }: { onSubmit: (value: boolean) => void }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { setting: false },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.setting))}>
      <Controller
        control={control}
        name="setting"
        render={({ field }) => (
          <__Name__
            aria-label="Setting"
            ref={field.ref}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};

describe("__Name__", () => {
  it("should be announced with its role and be off by default", () => {
    render(<__Name__ aria-label="Setting" />);

    expect(screen.getByRole("__role__", { name: "Setting" })).not.toBeChecked();
  });

  it("should be on when it starts on", () => {
    render(<__Name__ aria-label="Setting" defaultChecked />);

    expect(screen.getByRole("__role__")).toBeChecked();
    expect(screen.getByRole("__role__")).toHaveAttribute("data-state", "checked");
  });

  it("should toggle on click when it is uncontrolled", async () => {
    const user = userEvent.setup();
    render(<__Name__ aria-label="Setting" />);

    await user.click(screen.getByRole("__role__"));
    expect(screen.getByRole("__role__")).toBeChecked();

    await user.click(screen.getByRole("__role__"));
    expect(screen.getByRole("__role__")).not.toBeChecked();
  });

  it("should toggle with the Space key", async () => {
    const user = userEvent.setup();
    render(<__Name__ aria-label="Setting" />);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("__role__")).toBeChecked();
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Controlled__Name__ onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("__role__"));

    expect(screen.getByRole("__role__")).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it("should not change or take focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<__Name__ aria-label="Setting" disabled />);

    await user.click(screen.getByRole("__role__"));
    await user.tab();

    expect(screen.getByRole("__role__")).toBeDisabled();
    expect(screen.getByRole("__role__")).not.toBeChecked();
    expect(screen.getByRole("__role__")).not.toHaveFocus();
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<__Name__ aria-label="Setting" invalid />);

    expect(screen.getByRole("__role__")).toBeInvalid();
    expect(screen.getByRole("__role__")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<__Name__ aria-label="Setting" />);

    expect(screen.getByRole("__role__")).toBeValid();
  });

  it("should forward the ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<__Name__ aria-label="Setting" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("__role__"));
  });

  it("should put className on the control", () => {
    render(<__Name__ aria-label="Setting" className="custom" />);

    expect(screen.getByRole("__role__")).toHaveClass("custom");
  });

  it("should pass native props to the button", () => {
    render(<__Name__ aria-label="Setting" name="setting" title="Hint" />);

    expect(screen.getByRole("__role__")).toHaveAttribute("title", "Hint");
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Applies at once.</p>
        <__Name__ aria-label="Setting" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("__role__")).toHaveAccessibleDescription(
      "Applies at once.",
    );
  });

  it("should toggle when its label is clicked inside a Field", async () => {
    const user = userEvent.setup();
    render(<Labelled__Name__ />);

    await user.click(screen.getByText("Setting label"));

    expect(screen.getByRole("__role__", { name: "Setting label" })).toBeChecked();
  });

  it("should be described by the Field description", () => {
    render(<Labelled__Name__ />);

    expect(screen.getByRole("__role__")).toHaveAccessibleDescription(
      "Describes the setting.",
    );
  });

//#if requiredSupported
  it("should be required and invalid with the error linked when the Field says so", () => {
    render(
      <Field orientation="horizontal" invalid required>
        <__Name__ />
        <Field.Label>Setting label</Field.Label>
        <Field.Error>Turn this on to continue</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("__role__")).toBeRequired();
    expect(screen.getByRole("__role__")).toBeInvalid();
    expect(screen.getByRole("__role__")).toHaveAccessibleDescription(
      "Turn this on to continue",
    );
  });
//#endif
//#if-not requiredSupported
  // A __role__ does not support aria-required, so the Field's `required` is not forwarded to it.
  it("should be invalid with the error linked but not aria-required when the Field says so", () => {
    render(
      <Field orientation="horizontal" invalid required>
        <__Name__ />
        <Field.Label>Setting label</Field.Label>
        <Field.Error>Turn this on to continue</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("__role__")).not.toHaveAttribute("aria-required");
    expect(screen.getByRole("__role__")).toBeInvalid();
    expect(screen.getByRole("__role__")).toHaveAccessibleDescription(
      "Turn this on to continue",
    );
  });
//#endif

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field orientation="horizontal" disabled>
        <__Name__ />
        <Field.Label>Setting label</Field.Label>
      </Field>,
    );

    expect(screen.getByRole("__role__")).toBeDisabled();
  });

  it("should only animate its moving part when the user has not asked for reduced motion", () => {
    // On: a Radix Indicator is only mounted while the control is checked.
    render(<__Name__ aria-label="Setting" defaultChecked />);

    const part = screen.getByTestId("__name__-__partKebab__");

    expect(part).toHaveClass("motion-safe:transition-transform");
    expect(part).not.toHaveClass("transition-transform");
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("__role__", { name: "Setting" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(true);
  });

  it.each([
    ["off", {}],
    ["on", { defaultChecked: true }],
    ["disabled", { disabled: true }],
    ["disabled and on", { disabled: true, defaultChecked: true }],
    ["invalid", { invalid: true }],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<__Name__ aria-label="Setting" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations inside a Field that is required and invalid", async () => {
    render(
      <Field orientation="horizontal" invalid required>
        <__Name__ />
        <Field.Label>Setting label</Field.Label>
        <Field.Description>Describes the setting.</Field.Description>
        <Field.Error>Turn this on to continue</Field.Error>
      </Field>,
    );

    await expectNoA11yViolations();
  });
});
