import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Controller, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { DatePicker } from "./date-picker";
import type { DatePickerProps } from "./date-picker";

type StartDateProps = DatePickerProps & {
  fieldInvalid?: boolean;
  fieldRequired?: boolean;
  fieldDisabled?: boolean;
  error?: string;
};

const StartDate = ({
  fieldInvalid,
  fieldRequired,
  fieldDisabled,
  error,
  ...props
}: StartDateProps) => (
  <Field
    invalid={fieldInvalid}
    required={fieldRequired}
    disabled={fieldDisabled}
  >
    <Field.Label>Start date</Field.Label>
    <Field.Description>The first day of the course.</Field.Description>
    <DatePicker locale="en-US" {...props} />
    <Field.Error>{error}</Field.Error>
  </Field>
);

const ControlledStartDate = ({
  onValueChange,
}: {
  onValueChange: (value: string | null) => void;
}) => {
  const [value, setValue] = useState<string | null>("2026-10-14");

  return (
    <>
      <StartDate
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange(next);
        }}
      />
      <button type="button" onClick={() => setValue(null)}>
        Clear
      </button>
    </>
  );
};

const FormExample = ({
  onSubmit,
}: {
  onSubmit: (value: string | null) => void;
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ start: string | null }>({ defaultValues: { start: null } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.start))}>
      <Controller
        control={control}
        name="start"
        rules={{
          required: "Choose a start date",
          validate: (value) =>
            value === null ||
            value >= "2026-10-05" ||
            "The course starts on October 5 or later",
        }}
        render={({ field }) => (
          <Field invalid={errors.start !== undefined} required>
            <Field.Label>Start date</Field.Label>
            <DatePicker
              locale="en-US"
              min="2026-10-05"
              ref={field.ref}
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
            <Field.Error>{errors.start?.message}</Field.Error>
          </Field>
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};

const segment = (part: "month" | "day" | "year") =>
  screen.getByRole("spinbutton", { name: new RegExp(`^${part}`) });

const openCalendar = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /Calendar/ }));

  return screen.getByRole("dialog");
};

/** A day cell's button, found by its full accessible name, such as "Wednesday, October 14, 2026". */
const day = (name: RegExp) =>
  within(screen.getByRole("grid")).getByRole("button", { name });

describe("DatePicker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render a group of date parts named by the Field label", () => {
    render(<StartDate />);

    expect(
      screen.getByRole("group", { name: "Start date" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    expect(segment("month")).toHaveAccessibleName("month, Start date");
  });

  it("should describe the field with the Field description", () => {
    render(<StartDate />);

    expect(segment("month")).toHaveAccessibleDescription(
      "The first day of the course.",
    );
  });

  it("should show the initial date when it is uncontrolled", () => {
    render(<StartDate defaultValue="2026-10-14" />);

    expect(segment("month")).toHaveTextContent("10");
    expect(segment("day")).toHaveTextContent("14");
    expect(segment("year")).toHaveTextContent("2026");
  });

  it("should call onValueChange with an ISO date once every part is typed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<StartDate onValueChange={onValueChange} />);

    await user.click(segment("month"));
    await user.keyboard("1014");

    expect(onValueChange).not.toHaveBeenCalled();

    await user.keyboard("2026");

    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-14");
  });

  it("should move between the parts with Tab and change a part with the arrows", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.tab();

    expect(segment("month")).toHaveFocus();

    await user.tab();

    expect(segment("day")).toHaveFocus();

    await user.keyboard("{ArrowUp}");

    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-15");

    await user.tab();
    await user.tab();

    expect(screen.getByRole("button", { name: /Calendar/ })).toHaveFocus();
  });

  it("should follow the controlled value and report changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledStartDate onValueChange={onValueChange} />);

    await user.click(segment("day"));
    await user.keyboard("{ArrowDown}");

    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-13");
    expect(segment("day")).toHaveTextContent("13");

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(segment("day")).toHaveAttribute("aria-valuetext", "Empty");
  });

  it("should emit the date the field shows when one digit of the day is deleted", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("day"));
    await user.keyboard("{Backspace}");

    // "14" becomes "1": a complete date that the field shows, October 1.
    expect(segment("day")).toHaveTextContent("1");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-01");
  });

  it("should emit null when the day is cleared, while the field still shows the month and year", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("day"));
    await user.keyboard("{Backspace}{Backspace}");

    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(segment("day")).toHaveAttribute("aria-valuetext", "Empty");
    expect(segment("month")).toHaveTextContent("10");
    expect(segment("year")).toHaveTextContent("2026");
  });

  it("should emit null when only the month is cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("month"));
    await user.keyboard("{Backspace}{Backspace}");

    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("should never emit a year with fewer than four digits while the year is deleted", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("year"));
    await user.keyboard("{Backspace}{Backspace}{Backspace}");

    expect(segment("year")).toHaveTextContent("2");
    expect(onValueChange.mock.calls.flat()).toEqual([null]);
  });

  it("should emit null when the year is empty", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("year"));
    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}");

    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("should emit null when every part is cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("month"));
    await user.keyboard("{Backspace}{Backspace}");
    await user.click(segment("day"));
    await user.keyboard("{Backspace}{Backspace}");
    await user.click(segment("year"));
    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}");

    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(segment("month")).toHaveAttribute("aria-valuetext", "Empty");
  });

  it("should emit the date again when a cleared part is typed back", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await user.click(segment("month"));
    await user.keyboard("{Backspace}{Backspace}");
    await user.keyboard("10");

    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-14");
  });

  it("should end on the typed date, with no other complete date, when a date is typed digit by digit", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<StartDate onValueChange={onValueChange} />);

    await user.click(segment("month"));
    await user.keyboard("03122025");

    const emitted = onValueChange.mock.calls.flat();
    expect(emitted.at(-1)).toBe("2025-03-12");
    expect(emitted.filter((value) => value !== null)).toEqual(["2025-03-12"]);
  });

  it("should keep showing what was typed when a controlled date is partly cleared", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledStartDate onValueChange={onValueChange} />);

    await user.click(segment("day"));
    await user.keyboard("{Backspace}{Backspace}");

    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(segment("month")).toHaveTextContent("10");
    expect(segment("year")).toHaveTextContent("2026");
  });

  it("should open the calendar from the button on the selected month", async () => {
    const user = userEvent.setup();
    render(<StartDate defaultValue="2026-10-14" />);

    const dialog = await openCalendar(user);

    expect(dialog).toHaveAccessibleName(/Start date/);
    expect(within(dialog).getByRole("heading")).toHaveTextContent(
      "October 2026",
    );
    expect(day(/October 14, 2026/)).toHaveFocus();
  });

  it("should open the calendar with Alt and Down from the field", async () => {
    const user = userEvent.setup();
    render(<StartDate defaultValue="2026-10-14" />);

    await user.click(segment("month"));
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should move the focused day with the arrows and Page Down and choose it with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await openCalendar(user);
    await user.keyboard("{ArrowRight}{ArrowDown}");

    expect(day(/October 22, 2026/)).toHaveFocus();

    await user.keyboard("{PageDown}");

    expect(day(/November 22, 2026/)).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-22");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // React Aria gives focus back on the next animation frame.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Calendar/ })).toHaveFocus();
    });
  });

  it("should close the calendar with Escape without changing the date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await openCalendar(user);
    await user.keyboard("{ArrowRight}{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(segment("day")).toHaveTextContent("14");
  });

  it("should give focus back to the part the calendar was opened from, not to the button", async () => {
    const user = userEvent.setup();
    render(<StartDate defaultValue="2026-10-14" />);

    await user.click(segment("year"));
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // React Aria gives focus back on the next animation frame.
    await waitFor(() => {
      expect(segment("year")).toHaveFocus();
    });
  });

  it("should choose a day with the pointer", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate defaultValue="2026-10-14" onValueChange={onValueChange} />,
    );

    await openCalendar(user);
    await user.click(day(/October 20, 2026/));

    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-20");
  });

  it("should disable the days before min and after max", async () => {
    const user = userEvent.setup();
    render(
      <StartDate defaultValue="2026-10-14" min="2026-10-05" max="2026-10-25" />,
    );

    await openCalendar(user);

    expect(day(/October 4, 2026/)).toHaveAttribute("aria-disabled", "true");
    expect(day(/October 5, 2026/)).not.toHaveAttribute("aria-disabled");
    expect(day(/October 26, 2026/)).toHaveAttribute("aria-disabled", "true");
  });

  it("should make the days rejected by isDateDisabled unavailable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate
        defaultValue="2026-10-14"
        isDateDisabled={(date) => date === "2026-10-15"}
        onValueChange={onValueChange}
      />,
    );

    await openCalendar(user);
    await user.click(day(/October 15, 2026/));

    expect(day(/October 15, 2026/)).toHaveAttribute("data-unavailable");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("should mark a typed date outside min and max as invalid without a Field error", async () => {
    const user = userEvent.setup();
    render(<StartDate min="2026-10-05" />);

    await user.click(segment("month"));
    await user.keyboard("10012026");

    expect(screen.getByTestId("date-picker")).toHaveAttribute("data-invalid");
    expect(segment("month")).toHaveAttribute("aria-invalid", "true");
  });

  it("should not be invalid when it is required and still empty", () => {
    render(<StartDate fieldRequired />);

    expect(segment("month")).toHaveAttribute("aria-required", "true");
    expect(segment("month")).not.toHaveAttribute("aria-invalid");
  });

  it("should be invalid and described by the error inside an invalid Field", () => {
    render(<StartDate fieldInvalid error="Choose a start date" />);

    expect(screen.getByTestId("date-picker")).toHaveAttribute("data-invalid");
    expect(segment("month")).toHaveAttribute("aria-invalid", "true");
    expect(segment("month")).toHaveAccessibleDescription(
      "The first day of the course. Choose a start date",
    );
  });

  it("should be invalid when the invalid prop is set", () => {
    render(<DatePicker aria-label="Start date" invalid />);

    expect(screen.getByTestId("date-picker")).toHaveAttribute("data-invalid");
  });

  it("should order the parts and name the months by locale", async () => {
    const user = userEvent.setup();
    render(<StartDate defaultValue="2026-10-14" locale="es-ES" />);

    const parts = screen
      .getAllByRole("spinbutton")
      .map((part) => part.textContent);

    expect(parts).toEqual(["14", "10", "2026"]);

    await openCalendar(user);

    expect(
      within(screen.getByRole("dialog")).getByRole("heading"),
    ).toHaveTextContent("octubre de 2026");
  });

  it("should start the week on the locale's first day or on firstDayOfWeek", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<StartDate defaultValue="2026-10-14" />);

    await openCalendar(user);

    expect(
      screen.getAllByRole("columnheader", { hidden: true })[0],
    ).toHaveTextContent("S");

    unmount();
    render(<StartDate defaultValue="2026-10-14" firstDayOfWeek="mon" />);
    await openCalendar(user);

    expect(
      screen.getAllByRole("columnheader", { hidden: true })[0],
    ).toHaveTextContent("M");
  });

  it("should mark today in the calendar", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 20, 12));
    const user = userEvent.setup();
    render(<StartDate defaultValue="2026-10-14" />);

    await openCalendar(user);

    expect(day(/October 20, 2026/)).toHaveAccessibleName(/^Today/);
    expect(day(/October 20, 2026/)).toHaveAttribute("data-today");
  });

  it("should not let a disabled field be focused or opened", async () => {
    const user = userEvent.setup();
    render(<StartDate fieldDisabled defaultValue="2026-10-14" />);

    await user.tab();

    expect(document.body).toHaveFocus();
    expect(screen.getByRole("button", { name: /Calendar/ })).toBeDisabled();
    expect(screen.getByTestId("date-picker")).toHaveAttribute("data-disabled");
  });

  it("should let a read-only field be focused but not changed or opened", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StartDate
        readOnly
        defaultValue="2026-10-14"
        onValueChange={onValueChange}
      />,
    );

    await user.tab();
    await user.keyboard("{ArrowUp}");

    expect(segment("month")).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Calendar/ })).toBeDisabled();
    expect(screen.getByTestId("date-picker")).toHaveAttribute("data-readonly");
  });

  it("should submit the date as an ISO string with a native form", () => {
    render(
      <form aria-label="Course">
        <DatePicker
          aria-label="Start date"
          name="start"
          defaultValue="2026-10-14"
        />
      </form>,
    );

    expect(
      new FormData(screen.getByRole("form", { name: "Course" })).getAll(
        "start",
      ),
    ).toEqual(["2026-10-14"]);
  });

  it("should work with react-hook-form, including the error message and focus", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Choose a start date")).toBeInTheDocument();
    expect(segment("month")).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.keyboard("10012026");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("The course starts on October 5 or later"),
    ).toBeInTheDocument();
    expect(segment("month")).toHaveAccessibleDescription(
      /The course starts on October 5 or later/,
    );

    await user.click(segment("day"));
    await user.keyboard("12");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("2026-10-12");
  });

  it("should submit no date with a native form while the date is only partly filled", async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Course">
        <StartDate name="start" defaultValue="2026-10-14" />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>("form", { name: "Course" });

    expect(new FormData(form).get("start")).toBe("2026-10-14");

    await user.click(segment("day"));
    await user.keyboard("{Backspace}{Backspace}");

    expect(new FormData(form).get("start")).toBe("");
  });

  it("should fail react-hook-form's required rule while the date is only partly filled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(segment("month"));
    await user.keyboard("10122026");
    await user.click(segment("day"));
    await user.keyboard("{Backspace}{Backspace}");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Choose a start date")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should forward the ref to the first part and className to the root", () => {
    const ref = createRef<HTMLElement>();
    render(<StartDate ref={ref} className="custom" locale="es-ES" />);

    // es-ES puts the day first.
    expect(ref.current).toBe(screen.getAllByRole("spinbutton")[0]);
    expect(ref.current).toHaveTextContent("dd");
    expect(screen.getByTestId("date-picker")).toHaveClass("custom");
  });

  it("should keep its own aria-label and aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Weekdays only.</p>
        <DatePicker aria-label="Start date" aria-describedby="hint" />
      </>,
    );

    expect(
      screen.getByRole("group", { name: "Start date" }),
    ).toBeInTheDocument();
    expect(segment("month")).toHaveAccessibleDescription("Weekdays only.");
  });

  it("should throw a clear error for a value that is not an ISO date", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      render(<DatePicker aria-label="Start date" value="14/10/2026" />),
    ).toThrow(
      'DatePicker: value "14/10/2026" is not a date in the YYYY-MM-DD format',
    );

    vi.mocked(console.error).mockRestore();
  });

  it("should hydrate server markup without a mismatch when the locale is set", async () => {
    const onRecoverableError = vi.fn();
    const ui = (
      <DatePicker
        aria-label="Start date"
        locale="de-DE"
        defaultValue="2026-10-14"
      />
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(ui);
    document.body.append(container);

    await act(async () => {
      hydrateRoot(container, ui, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(
      within(container)
        .getAllByRole("spinbutton")
        .map((part) => part.textContent),
    ).toEqual(["14", "10", "2026"]);

    container.remove();
  });

  it.each([
    ["empty", {}],
    ["with a value", { defaultValue: "2026-10-14" }],
    ["disabled", { fieldDisabled: true, defaultValue: "2026-10-14" }],
    ["read-only", { readOnly: true, defaultValue: "2026-10-14" }],
    [
      "invalid and required",
      { fieldInvalid: true, fieldRequired: true, error: "Choose a start date" },
    ],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<StartDate {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations with the calendar open", async () => {
    const user = userEvent.setup();
    render(
      <StartDate
        defaultValue="2026-10-14"
        min="2026-10-05"
        isDateDisabled={(date) => date === "2026-10-16"}
      />,
    );

    await openCalendar(user);

    await expectNoA11yViolations();
  });
});
