import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { Slider } from "./slider";
import type { SliderProps } from "./slider";

const ControlledSlider = ({
  onValueChange,
}: {
  onValueChange: (value: number[]) => void;
}) => {
  const [value, setValue] = useState([30]);

  return (
    <Slider
      aria-label="Volume"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

const LabelledSlider = (props: SliderProps) => (
  <Field>
    <Field.Label>Volume</Field.Label>
    <Slider {...props} />
    <Field.Description>Applies to every room.</Field.Description>
    <Field.Error />
  </Field>
);

const FormExample = ({ onSubmit }: { onSubmit: (value: number[]) => void }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { volume: [20] },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.volume))}>
      <Controller
        control={control}
        name="volume"
        render={({ field }) => (
          <Slider
            aria-label="Volume"
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

describe("Slider", () => {
  it("should be a slider with its value, minimum and maximum exposed", () => {
    render(<Slider aria-label="Volume" defaultValue={[40]} />);

    const thumb = screen.getByRole("slider", { name: "Volume" });

    expect(thumb).toHaveAttribute("aria-valuenow", "40");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "100");
    expect(thumb).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("should start at the minimum when it has no value", () => {
    render(<Slider aria-label="Volume" min={10} max={50} />);

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "10");
  });

  it("should be a range with two named thumbs when it has two values", () => {
    render(<Slider aria-label="Price" defaultValue={[20, 80]} />);

    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(
      screen.getByRole("slider", { name: "Price Minimum" }),
    ).toHaveAttribute("aria-valuenow", "20");
    expect(
      screen.getByRole("slider", { name: "Price Maximum" }),
    ).toHaveAttribute("aria-valuenow", "80");
  });

  it("should use its own thumb labels for a range", () => {
    render(
      <Slider
        aria-label="Precio"
        defaultValue={[20, 80]}
        thumbLabels={["Mínimo", "Máximo"]}
      />,
    );

    expect(
      screen.getByRole("slider", { name: "Precio Mínimo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Precio Máximo" }),
    ).toBeInTheDocument();
  });

  it("should number the thumbs when there are more than two", () => {
    render(<Slider aria-label="Levels" defaultValue={[10, 40, 70]} />);

    expect(
      screen.getByRole("slider", { name: "Levels Value 2 of 3" }),
    ).toHaveAttribute("aria-valuenow", "40");
  });

  it("should raise and lower the value by one step with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={[40]} step={5} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{ArrowUp}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");

    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
  });

  it("should move by ten steps with Page Up and Page Down", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={[40]} />);

    await user.tab();
    await user.keyboard("{PageUp}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");

    await user.keyboard("{PageDown}{PageDown}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("should move by ten steps with Shift and an arrow", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={[40]} step={2} />);

    await user.tab();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "60");
  });

  it("should jump to the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={[40]} />);

    await user.tab();
    await user.keyboard("{End}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");

    await user.keyboard("{Home}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
  });

  it("should not go past the ends", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={[98]} />);

    await user.tab();
    await user.keyboard("{PageUp}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });

  it("should move each thumb of a range on its own with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Price" defaultValue={[20, 80]} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");
    await user.tab();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");

    expect(
      screen.getByRole("slider", { name: "Price Minimum" }),
    ).toHaveAttribute("aria-valuenow", "21");
    expect(
      screen.getByRole("slider", { name: "Price Maximum" }),
    ).toHaveAttribute("aria-valuenow", "78");
  });

  it("should keep the thumbs apart by the minimum number of steps", async () => {
    const user = userEvent.setup();
    render(
      <Slider
        aria-label="Price"
        defaultValue={[40, 50]}
        minStepsBetweenThumbs={10}
      />,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("slider", { name: "Price Minimum" }),
    ).toHaveAttribute("aria-valuenow", "40");
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledSlider onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "31");
    expect(onValueChange).toHaveBeenLastCalledWith([31]);
  });

  it("should report the new value as an array when it is uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        aria-label="Volume"
        defaultValue={[40]}
        onValueChange={onValueChange}
      />,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onValueChange).toHaveBeenCalledWith([41]);
  });

  it("should report the committed value when a key press ends", async () => {
    const user = userEvent.setup();
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="Volume"
        defaultValue={[40]}
        onValueCommit={onValueCommit}
      />,
    );

    await user.tab();
    await user.keyboard("{End}");

    expect(onValueCommit).toHaveBeenCalledWith([100]);
  });

  it("should show the value above the track, hidden from assistive technology", () => {
    render(<Slider aria-label="Volume" defaultValue={[40]} showValue />);

    expect(screen.getByText("40")).toHaveAttribute("aria-hidden", "true");
  });

  it("should show a range as two values and follow the thumb", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Price" defaultValue={[20, 80]} showValue />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByText("21 – 80")).toBeInTheDocument();
  });

  it("should not show the value unless asked to", () => {
    render(<Slider aria-label="Volume" defaultValue={[40]} />);

    expect(screen.queryByText("40")).not.toBeInTheDocument();
  });

  it("should format the visible value and the value text read by assistive technology", async () => {
    const user = userEvent.setup();
    render(
      <Slider
        aria-label="Volume"
        defaultValue={[40]}
        showValue
        formatValue={(value) => `${value}%`}
      />,
    );

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "41%");
  });

  it("should not set a value text when it has no formatter", () => {
    render(<Slider aria-label="Volume" defaultValue={[40]} />);

    expect(screen.getByRole("slider")).not.toHaveAttribute("aria-valuetext");
  });

  it("should not change or take focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={[40]} disabled />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("slider")).not.toHaveFocus();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByTestId("slider")).toHaveAttribute("data-disabled");
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<Slider aria-label="Volume" invalid />);

    expect(screen.getByRole("slider")).toBeInvalid();
    expect(screen.getByTestId("slider")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<Slider aria-label="Volume" />);

    expect(screen.getByRole("slider")).toBeValid();
  });

  it("should be named by the Field label", () => {
    render(<LabelledSlider defaultValue={[40]} />);

    expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  });

  it("should name each thumb of a range by the Field label and its own label", () => {
    render(<LabelledSlider defaultValue={[20, 80]} />);

    expect(
      screen.getByRole("slider", { name: "Volume Minimum" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Volume Maximum" }),
    ).toBeInTheDocument();
  });

  it("should be described by the Field description, on every thumb", () => {
    render(<LabelledSlider defaultValue={[20, 80]} />);

    for (const thumb of screen.getAllByRole("slider")) {
      expect(thumb).toHaveAccessibleDescription("Applies to every room.");
    }
  });

  it("should be invalid with the error linked when the Field says so", () => {
    render(
      <Field invalid>
        <Field.Label>Volume</Field.Label>
        <Slider defaultValue={[40]} />
        <Field.Error>Keep it under 80</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("slider")).toBeInvalid();
    expect(screen.getByRole("slider")).toHaveAccessibleDescription(
      "Keep it under 80",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field disabled>
        <Field.Label>Volume</Field.Label>
        <Slider defaultValue={[40]} />
      </Field>,
    );

    expect(screen.getByTestId("slider")).toHaveAttribute("data-disabled");
  });

  it("should not be aria-required even when the Field is required", () => {
    render(
      <Field required>
        <Field.Label>Volume</Field.Label>
        <Slider defaultValue={[40]} />
      </Field>,
    );

    expect(screen.getByRole("slider")).not.toHaveAttribute("aria-required");
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Applies to every room.</p>
        <Slider aria-label="Volume" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("slider")).toHaveAccessibleDescription(
      "Applies to every room.",
    );
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.tab();
    await user.keyboard("{PageUp}");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith([30]);
  });

  it("should forward the ref and className to the root", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Slider aria-label="Volume" ref={ref} className="custom" />);

    expect(ref.current).toBe(screen.getByTestId("slider"));
    expect(screen.getByTestId("slider")).toHaveClass("custom");
  });

  it("should pass native props to the root", () => {
    render(<Slider aria-label="Volume" title="Hint" />);

    expect(screen.getByTestId("slider")).toHaveAttribute("title", "Hint");
  });

  it("should keep a target of at least 44px for the pointer and 24px for the thumb", () => {
    render(<Slider aria-label="Volume" />);

    // jsdom does no layout, so the sizes are asserted as classes: `h-12` is 48px (the root takes
    // the pointer anywhere along its height) and `size-6` is 24px. The Chrome measurement at a
    // small viewport is in the `TouchTargets` story.
    expect(screen.getByTestId("slider")).toHaveClass("h-12");
    expect(screen.getByTestId("slider-thumb")).toHaveClass("size-6");
  });

  it.each<[string, SliderProps]>([
    ["single", { defaultValue: [40] }],
    ["range", { defaultValue: [20, 80] }],
    ["with a visible value", { defaultValue: [40], showValue: true }],
    [
      "with a formatter",
      { defaultValue: [40], formatValue: (v: number) => `${v}%` },
    ],
    ["disabled", { defaultValue: [40], disabled: true }],
    ["invalid", { defaultValue: [40], invalid: true }],
  ])(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<Slider aria-label="Volume" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations inside a Field with an error", async () => {
    render(
      <Field invalid>
        <Field.Label>Price</Field.Label>
        <Slider defaultValue={[20, 80]} showValue />
        <Field.Description>Per night.</Field.Description>
        <Field.Error>Keep it under 80</Field.Error>
      </Field>,
    );

    await expectNoA11yViolations();
  });
});
