import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { Field } from "../field";
import { DatePicker } from "./date-picker";

/**
 * Every story that shows the calendar uses a date in March 2025, a month in the past, so the
 * calendar never contains today and no snapshot depends on the day it is taken. Only `Today`
 * shows the current month, and it is left out of Chromatic.
 */
const FIXED_DATE = "2025-03-12";

const meta = {
  title: "Form components/DatePicker",
  component: DatePicker,
  args: { "aria-label": "Start date", locale: "en-US" },
  argTypes: {
    firstDayOfWeek: {
      control: "select",
      options: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A field to pick one date, by typing it part by part or by choosing it in a calendar. Use it for a date near today, such as an appointment or a deadline. **When not to use:** for a date that is known and far away (a date of birth), typing is faster than any calendar, so the calendar adds little; for a range of dates or a date with a time this component is not enough. The value is an ISO 8601 date string (`"2026-10-30"`) with no time or time zone, so it never moves by a day and goes into a form or a schema as it is. **Keyboard:** Tab moves between the parts (month, day, year, in the order of the locale) and then to the calendar button; typing digits fills a part and moves on; Up and Down change it; Alt + Down or Enter on the button opens the calendar, where the arrows move by day, Page Up and Page Down by month (with Shift, by year), Enter chooses and Escape closes. **Labels:** inside a `Field` the `Field.Label` names it through `aria-labelledby` (clicking the label does not focus the field); on its own it needs `aria-label`. **Validation:** a typed date outside `min` and `max` or rejected by `isDateDisabled` is marked invalid by React Aria, as is any date while `invalid` is set. The reason is always yours to give in a `Field.Error`: an invalid field without one is not announced as an error (see ValidationFlow). **Import:** from its own entry point, `@aleixvidal/ui/date-picker`; React Aria with the strings of every locale is about 60 kB, and your bundler can drop the locales you do not use with `@react-aria/optimize-locales-plugin`. **Server rendering:** set `locale`, or the field renders in `en-US` on the server and changes after hydration. **Content-Security-Policy:** React Aria adds one small `<style>` element at runtime (it sets `touch-action` so a tap is not delayed by double-tap zoom), and on iOS a second one while the calendar is open (it stops the page scrolling behind it). Give them a nonce with `<meta name="csp-nonce" content="...">`. Without it they are blocked, and the field still works: only that touch behavior is lost.',
      },
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * While the calendar is open React Aria hides the rest of the page from assistive technology and
 * keeps focus in the calendar, so axe reports the (unreachable) date parts under
 * `aria-hidden-focus`. This is the same false positive as the open Select list, and the only rule
 * turned off, for the stories that render the calendar open only.
 */
const openCalendarA11y = {
  config: { rules: [{ id: "aria-hidden-focus", enabled: false }] },
};

const calendarButton = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: /Calendar/ });

const dayCell = (name: RegExp) =>
  within(screen.getByRole("grid")).getByRole("button", { name });

export const Default: Story = {};

export const WithValue: Story = { args: { defaultValue: FIXED_DATE } };

/** Inside a `Field`: the label names the field, the description and the error describe it. */
export const InField: Story = {
  render: (args) => (
    <Field required>
      <Field.Label>Start date</Field.Label>
      <Field.Description>The first day of the course.</Field.Description>
      <DatePicker {...args} aria-label={undefined} />
      <Field.Error />
    </Field>
  ),
};

const ControlledExample = () => {
  const [date, setDate] = useState<string | null>(FIXED_DATE);

  return (
    <div className="flex flex-col gap-2">
      <DatePicker
        aria-label="Start date"
        locale="en-US"
        value={date}
        onValueChange={setDate}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Value: {date ?? "(none)"}
      </p>
    </div>
  );
};

/** The date lives in React state as an ISO string: `value` and `onValueChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * The calendar's states, in a fixed month: the selected day (filled), days before `min` and after
 * `max` (muted and struck through), unavailable weekend days (the same), and the focused day,
 * which carries the focus ring. Days of the previous and next month are not painted.
 */
export const CalendarStates: Story = {
  args: {
    defaultValue: FIXED_DATE,
    min: "2025-03-04",
    max: "2025-03-27",
    isDateDisabled: (date) => [0, 6].includes(new Date(date).getUTCDay()),
    defaultOpen: true,
  },
  parameters: { a11y: openCalendarA11y },
  play: async () => {
    await expect(await screen.findByRole("dialog")).toBeVisible();
    await waitFor(() =>
      expect(dayCell(/March 12, 2025/)).toHaveAttribute("data-focus-visible"),
    );
  },
};

/** `min` and `max`: the days outside them are disabled, and so are the arrows past them. */
export const MinMax: Story = {
  args: {
    defaultValue: FIXED_DATE,
    min: "2025-03-10",
    max: "2025-03-20",
    defaultOpen: true,
  },
  parameters: { a11y: openCalendarA11y },
};

/** `isDateDisabled` rejects days one by one; here, weekends. */
export const DisabledDates: Story = {
  args: {
    defaultValue: FIXED_DATE,
    isDateDisabled: (date) => [0, 6].includes(new Date(date).getUTCDay()),
    defaultOpen: true,
  },
  parameters: { a11y: openCalendarA11y },
};

/** The week starts on Monday, whatever the locale says. */
export const FirstDayOfWeek: Story = {
  args: { defaultValue: FIXED_DATE, firstDayOfWeek: "mon", defaultOpen: true },
  parameters: { a11y: openCalendarA11y },
};

/** The locale sets the order of the parts, the separators, the month names and the first day. */
export const Locales: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {["en-US", "en-GB", "es-ES", "de-DE", "ja-JP"].map((locale) => (
        <DatePicker
          key={locale}
          aria-label={`Start date (${locale})`}
          locale={locale}
          defaultValue={FIXED_DATE}
        />
      ))}
    </div>
  ),
};

/** In Spanish the calendar names the months and days in Spanish and starts on Monday. */
export const SpanishCalendar: Story = {
  args: { locale: "es-ES", defaultValue: FIXED_DATE, defaultOpen: true },
  parameters: { a11y: openCalendarA11y },
};

/**
 * Today is marked with a dot under the number. This story opens on the current month, so it
 * changes every day: it is the only calendar story left out of Chromatic snapshots.
 */
export const Today: Story = {
  args: { defaultOpen: true },
  parameters: { a11y: openCalendarA11y, chromatic: { disableSnapshot: true } },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: FIXED_DATE },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: FIXED_DATE },
};

export const Invalid: Story = {
  render: (args) => (
    <Field invalid>
      <Field.Label>Start date</Field.Label>
      <DatePicker {...args} aria-label={undefined} defaultValue={FIXED_DATE} />
      <Field.Error>The course is full on this date.</Field.Error>
    </Field>
  ),
};

export const Required: Story = {
  render: (args) => (
    <Field required>
      <Field.Label>Start date</Field.Label>
      <DatePicker {...args} aria-label={undefined} />
      <Field.Error />
    </Field>
  ),
};

/** The field takes the hover border while the pointer is over it. */
export const Hovered: Story = {
  args: { defaultValue: FIXED_DATE },
  play: async ({ canvasElement }) => {
    await userEvent.hover(
      within(canvasElement).getByRole("group", { name: "Start date" }),
    );
  },
};

/**
 * The part being edited is filled and the field has the focus ring. The addon cannot force it
 * (React Aria sets `data-focused` in script), so this story focuses the day.
 */
export const Focused: Story = {
  args: { defaultValue: FIXED_DATE },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("spinbutton", { name: /^day/ }),
    );
  },
};

/** The calendar button with the keyboard focus ring. */
export const ButtonFocused: Story = {
  args: { defaultValue: FIXED_DATE },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(calendarButton(canvasElement)).toHaveFocus();
  },
};

/**
 * Typing, step by step: Tab lands on the month, digits fill each part and move on, and the value
 * is reported once the date is complete. Then Up raises the day by one.
 */
export const TypedEntry: Story = {
  render: () => <ControlledEmptyExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const month = canvas.getByRole("spinbutton", { name: /^month/ });

    await user.tab();
    await expect(month).toHaveFocus();

    await user.keyboard("03");
    await expect(
      canvas.getByRole("spinbutton", { name: /^day/ }),
    ).toHaveFocus();

    await user.keyboard("12");
    await user.keyboard("2025");
    await expect(canvas.getByText("Value: 2025-03-12")).toBeVisible();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    await user.keyboard("{ArrowUp}");
    await expect(canvas.getByText("Value: 2025-03-13")).toBeVisible();
  },
};

const ControlledEmptyExample = () => {
  const [date, setDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <DatePicker
        aria-label="Start date"
        locale="en-US"
        value={date}
        onValueChange={setDate}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Value: {date ?? "(none)"}
      </p>
    </div>
  );
};

/**
 * The calendar with the keyboard only, step by step: Alt + Down opens it on the selected day, the
 * arrows move by day, Page Down by month, Enter chooses and closes, and focus goes back to where
 * the calendar was opened from (here the month). Escape closes without choosing.
 */
export const KeyboardCalendar: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const month = canvas.getByRole("spinbutton", { name: /^month/ });

    await user.tab();
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(await screen.findByRole("dialog")).toBeVisible();
    await waitFor(() => expect(dayCell(/March 12, 2025/)).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    await expect(dayCell(/March 13, 2025/)).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    await expect(dayCell(/March 20, 2025/)).toHaveFocus();

    await user.keyboard("{PageDown}");
    await expect(dayCell(/April 20, 2025/)).toHaveFocus();

    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByText("Value: 2025-04-20")).toBeVisible();
    await waitFor(() => expect(month).toHaveFocus());

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(await screen.findByRole("dialog")).toBeVisible();
    await user.keyboard("{ArrowLeft}{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByText("Value: 2025-04-20")).toBeVisible();
  },
};

const MIN_START = "2025-03-03";

const ValidationExample = () => {
  const [date, setDate] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const error =
    date === null
      ? "Choose a start date"
      : date < MIN_START
        ? "The course starts on March 3, 2025 or later"
        : undefined;
  const showError = touched && error !== undefined;

  return (
    <Field invalid={showError} required>
      <Field.Label>Start date</Field.Label>
      <Field.Description>March 3, 2025 or later.</Field.Description>
      <DatePicker
        locale="en-US"
        min={MIN_START}
        value={date}
        onValueChange={setDate}
        onBlur={() => setTouched(true)}
      />
      <Field.Error>{showError ? error : undefined}</Field.Error>
    </Field>
  );
};

/**
 * The right pattern for validation: the form checks the same rule as `min` and puts the reason
 * in the `Field.Error` (a live region, read with the field), with the Field's `invalid`. React
 * Aria already marks a date before `min` as invalid by itself, but without the `Field.Error` that
 * state has no message and is not announced. Step by step: an early date shows the error, a valid
 * one clears it.
 */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const month = canvas.getByRole("spinbutton", { name: /^month/ });

    await user.click(month);
    await user.keyboard("03012025");
    await user.tab();
    await user.tab();

    await expect(
      canvas.getByText("The course starts on March 3, 2025 or later"),
    ).toBeVisible();
    await expect(month).toHaveAttribute("aria-invalid", "true");
    // In a browser React Aria also puts the selected date first ("Selected Date: ..."), so only
    // the end of the description is checked.
    await expect(month).toHaveAccessibleDescription(
      /March 3, 2025 or later\. The course starts on March 3, 2025 or later$/,
    );

    await user.click(canvas.getByRole("spinbutton", { name: /^day/ }));
    await user.keyboard("10");
    await user.tab();

    await waitFor(() =>
      expect(
        canvas.queryByText("The course starts on March 3, 2025 or later"),
      ).toBeNull(),
    );
    await expect(month).not.toHaveAttribute("aria-invalid");
  },
};

/** Fails when an element's box leaves the visible viewport. */
const expectInsideViewport = async (element: Element) => {
  const box = element.getBoundingClientRect();

  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.top).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
};

/**
 * A narrow screen (320px wide, the mobile1 viewport) with the field at the bottom: the calendar
 * (298px wide) flips above the field and stays within the viewport.
 */
export const SmallViewport: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  args: { defaultValue: FIXED_DATE },
  render: (args) => (
    <div className="flex min-h-screen items-end">
      <DatePicker {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(calendarButton(canvasElement));
    const dialog = await screen.findByRole("dialog");
    const popover = dialog.closest("[data-slot=date-picker-popover]") ?? dialog;

    await waitFor(() =>
      expect(popover).toHaveAttribute("data-placement", "top"),
    );
    await expectInsideViewport(popover);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/**
 * A page taller than the viewport, so it has a vertical scrollbar. Opening the calendar locks the
 * page scroll; React Aria keeps the scrollbar's gap (`scrollbar-gutter: stable`), so the page
 * does not shift sideways.
 */
export const PageWithScrollbar: Story = {
  args: { defaultValue: FIXED_DATE },
  render: (args) => (
    <div className="h-[200vh]">
      <DatePicker {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole("group", {
      name: "Start date",
    });
    const before = field.getBoundingClientRect().left;

    await userEvent.click(calendarButton(canvasElement));
    await screen.findByRole("dialog");

    await expect(field.getBoundingClientRect().left).toBe(before);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};
