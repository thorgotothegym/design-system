import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { Switch } from "./switch";
import type { SwitchProps } from "./switch";

const ControlledSwitch = ({
  onCheckedChange,
}: {
  onCheckedChange: SwitchProps["onCheckedChange"];
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <Switch
      aria-label="Notifications"
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onCheckedChange?.(next);
      }}
    />
  );
};

const LabelledSwitch = (props: SwitchProps) => (
  <Field orientation="horizontal">
    <Switch {...props} />
    <Field.Label>Email notifications</Field.Label>
    <Field.Description>We send one email a week.</Field.Description>
    <Field.Error />
  </Field>
);

const FormExample = ({ onSubmit }: { onSubmit: (value: boolean) => void }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { notifications: false },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.notifications))}>
      <Controller
        control={control}
        name="notifications"
        render={({ field }) => (
          <Switch
            aria-label="Notifications"
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

describe("Switch", () => {
  it("should be announced as a switch that is off by default", () => {
    render(<Switch aria-label="Notifications" />);

    expect(
      screen.getByRole("switch", { name: "Notifications" }),
    ).not.toBeChecked();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("should be on when it starts on", () => {
    render(<Switch aria-label="Notifications" defaultChecked />);

    expect(screen.getByRole("switch")).toBeChecked();
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });

  it("should toggle on click when it is uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);

    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toBeChecked();

    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("should toggle with the Space key", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should toggle with the Enter key", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<ControlledSwitch onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));

    expect(screen.getByRole("switch")).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it("should not change or take focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" disabled />);

    await user.click(screen.getByRole("switch"));
    await user.tab();

    expect(screen.getByRole("switch")).toBeDisabled();
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(screen.getByRole("switch")).not.toHaveFocus();
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<Switch aria-label="Notifications" invalid />);

    expect(screen.getByRole("switch")).toBeInvalid();
    expect(screen.getByRole("switch")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<Switch aria-label="Notifications" />);

    expect(screen.getByRole("switch")).toBeValid();
  });

  it("should forward the ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch aria-label="Notifications" ref={ref} />);

    expect(ref.current).toBe(screen.getByRole("switch"));
  });

  it("should put className on the switch", () => {
    render(<Switch aria-label="Notifications" className="custom" />);

    expect(screen.getByRole("switch")).toHaveClass("custom");
  });

  it("should pass native props to the button", () => {
    render(
      <Switch aria-label="Notifications" name="notifications" title="Hint" />,
    );

    expect(screen.getByRole("switch")).toHaveAttribute("title", "Hint");
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Applies at once.</p>
        <Switch aria-label="Notifications" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("switch")).toHaveAccessibleDescription(
      "Applies at once.",
    );
  });

  it("should toggle when its label is clicked inside a Field", async () => {
    const user = userEvent.setup();
    render(<LabelledSwitch />);

    await user.click(screen.getByText("Email notifications"));

    expect(
      screen.getByRole("switch", { name: "Email notifications" }),
    ).toBeChecked();
  });

  it("should be described by the Field description", () => {
    render(<LabelledSwitch />);

    expect(screen.getByRole("switch")).toHaveAccessibleDescription(
      "We send one email a week.",
    );
  });

  it("should be invalid with the error linked when the Field says so", () => {
    render(
      <Field orientation="horizontal" invalid>
        <Switch />
        <Field.Label>Email notifications</Field.Label>
        <Field.Error>Turn this on to continue</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("switch")).toBeInvalid();
    expect(screen.getByRole("switch")).toHaveAccessibleDescription(
      "Turn this on to continue",
    );
  });

  it("should not be aria-required even when the Field is required", () => {
    render(
      <Field orientation="horizontal" required>
        <Switch />
        <Field.Label>Email notifications</Field.Label>
      </Field>,
    );

    expect(screen.getByRole("switch")).not.toHaveAttribute("aria-required");
    expect(screen.getByRole("switch")).not.toHaveAttribute("required");
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field orientation="horizontal" disabled>
        <Switch />
        <Field.Label>Email notifications</Field.Label>
      </Field>,
    );

    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("should only animate the thumb when the user has not asked for reduced motion", () => {
    render(<Switch aria-label="Notifications" />);

    const thumb = screen.getByTestId("switch-thumb");

    expect(thumb).toHaveClass("motion-safe:transition-transform");
    expect(thumb).not.toHaveClass("transition-transform");
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("switch", { name: "Notifications" }));
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
      render(<Switch aria-label="Notifications" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations when the Field is invalid", async () => {
    render(
      <Field orientation="horizontal" invalid>
        <Switch />
        <Field.Label>Email notifications</Field.Label>
        <Field.Error>Turn this on to continue</Field.Error>
      </Field>,
    );

    await expectNoA11yViolations();
  });

  it("should have no accessibility violations inside a Field with a label", async () => {
    render(<LabelledSwitch />);

    await expectNoA11yViolations();
  });
});
