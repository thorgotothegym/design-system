import { parseDate } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import { useImperativeHandle, useRef, useState } from "react";
import type { FocusEventHandler, Ref } from "react";
import { Button } from "react-aria-components/Button";
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
} from "react-aria-components/Calendar";
import {
  DatePicker as AriaDatePicker,
  DateInput,
  DateSegment,
  Group,
} from "react-aria-components/DatePicker";
import { Dialog } from "react-aria-components/Dialog";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { Popover } from "react-aria-components/Popover";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

/**
 * The drawn box, as in `Input`: border, background and focus ring are on the group that holds
 * the segments and the calendar button. The ring shows while a segment has focus (the button has
 * its own). State comes from the `data-*` attributes React Aria sets on the root (`data-invalid`,
 * `data-disabled`, `data-readonly`) and on the group (`data-hovered`), styled with Tailwind data
 * variants.
 */
const groupClasses = [
  "box-border flex h-10 w-full items-center gap-2 rounded-lg border border-border-control bg-bg-input pr-1 pl-3 font-mono text-md text-text-default",
  "not-in-data-invalid:not-in-data-disabled:not-in-data-readonly:data-hovered:border-brand-primary",
  "has-data-focused:outline-2 has-data-focused:outline-solid has-data-focused:outline-offset-2 has-data-focused:outline-focus-ring",
  "in-data-invalid:border-border-danger",
  "in-data-readonly:bg-bg-subtle",
  "in-data-disabled:cursor-not-allowed in-data-disabled:bg-bg-subtle in-data-disabled:text-text-muted",
  "motion-safe:transition-[border-color]",
];

/**
 * One segment (month, day, year) or a literal separator. The segment being edited is filled with
 * `brand.primary`, which stands out from `bg.input` at 7:1 or more in both themes, so it is clear
 * which part the keys will change.
 */
const segmentClasses = [
  "box-border rounded-md px-px tabular-nums outline-transparent",
  "data-placeholder:text-text-placeholder in-data-disabled:text-text-muted",
  "data-focused:bg-brand-primary data-focused:text-text-on-primary",
];

/** A square icon button: the calendar trigger in the field and the month arrows in the popover. */
const iconButtonClasses = [
  "m-0 box-border flex size-8 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-lg border-0 bg-transparent p-0 text-text-muted outline-transparent",
  "data-hovered:text-text-default",
  "data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring",
  "data-disabled:cursor-not-allowed",
];

/**
 * Portalled and positioned by React Aria below the field, aligned to its start, flipping above
 * when there is no room. It uses the same layer token as the Select list (React Aria's own inline
 * z-index is replaced through `style`) and the same surface.
 */
const popoverClasses =
  "z-(--ds-z-dropdown) box-border rounded-lg border border-border-decorative bg-bg-surface p-2 font-mono text-text-default shadow-md outline-transparent";

/**
 * A day is a 40px square (above the 24px WCAG 2.2 minimum target). States, each a `data-*`
 * attribute from React Aria:
 * - selected: filled with `brand.primary` (7:1 or more against `bg.surface`);
 * - focused (keyboard): a `focus.ring` outline set 2px off the cell, so it shows on the selected
 *   fill too;
 * - today: a dot under the number (see `TodayDot`);
 * - disabled (outside `min` and `max`) or unavailable (`isDateDisabled`): muted and struck through,
 *   so they differ from the others without relying on color;
 * - hover: a `bg.subtle` fill, a pointer hint only (the keyboard indicator is the ring);
 * - outside the month: not painted, but it keeps its place in the grid.
 */
const cellClasses = [
  "relative m-0 box-border flex size-10 cursor-pointer items-center justify-center rounded-lg text-md text-text-default tabular-nums outline-transparent",
  "not-data-selected:not-data-disabled:not-data-unavailable:data-hovered:bg-bg-subtle",
  "data-selected:bg-brand-primary data-selected:text-text-on-primary",
  "data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring",
  "data-disabled:cursor-not-allowed data-disabled:line-through not-data-selected:data-disabled:text-text-muted",
  "data-unavailable:cursor-not-allowed data-unavailable:line-through not-data-selected:data-unavailable:text-text-muted",
  "data-outside-month:invisible",
];

/** Today: a 4px dot, `brand.primary` on the page, `text.on-primary` when today is also selected. */
const TodayDot = () => (
  <span
    aria-hidden="true"
    className="absolute bottom-1 size-1 rounded-full bg-brand-primary in-data-selected:bg-text-on-primary"
  />
);

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="size-4"
  >
    <rect x="2" y="3" width="12" height="11" rx="1" />
    <path d="M2 6.5h12M5 1.5v3M11 1.5v3" />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="size-4"
  >
    <path d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} />
  </svg>
);

/** Turns an ISO date string into the date object React Aria works with. */
const toCalendarDate = (value: string, prop: string) => {
  try {
    return parseDate(value);
  } catch {
    throw new Error(
      `DatePicker: ${prop} "${value}" is not a date in the YYYY-MM-DD format`,
    );
  }
};

/** `undefined` stays undefined (not set), `null` stays null (no date). */
const toOptionalDate = (value: string | null | undefined, prop: string) =>
  value == null ? value : toCalendarDate(value, prop);

export type DatePickerProps = {
  /** Controlled date, as an ISO 8601 date string (`"2026-10-30"`), or `null` for no date. */
  value?: string | null;
  /** Initial date when the component manages its own state, as an ISO 8601 date string. */
  defaultValue?: string | null;
  /**
   * Called with the new date as an ISO 8601 date string. While a date is typed it is called only
   * once every part has been entered. Clearing parts one by one keeps the last complete date as
   * the value until every part is empty, and then it is called with `null` (React Aria's behavior).
   */
  onValueChange?: (value: string | null) => void;
  /** The earliest date that can be chosen (`"YYYY-MM-DD"`). Earlier days are disabled in the calendar. */
  min?: string;
  /** The latest date that can be chosen (`"YYYY-MM-DD"`). Later days are disabled in the calendar. */
  max?: string;
  /** Called with each day (`"YYYY-MM-DD"`) shown in the calendar; return `true` to make it unavailable. */
  isDateDisabled?: (date: string) => boolean;
  /**
   * The locale (BCP 47, such as `"es-ES"`) that sets the order of the parts, the month names and
   * the first day of the week. Defaults to the enclosing React Aria locale or the browser's.
   * Set it when rendering on the server, where the browser's locale is unknown.
   */
  locale?: string;
  /** The first day of the week in the calendar. Defaults to the locale's. */
  firstDayOfWeek?: "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
  /** Opens the calendar when the field first renders, for a page whose first step is choosing the date. */
  defaultOpen?: boolean;
  /** Marks the date as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
  /** Disables the field and the calendar button. Inside a `Field`, the Field's `disabled` is used as well. */
  disabled?: boolean;
  /** The date can be read and focused but not changed, and the calendar does not open. */
  readOnly?: boolean;
  /** Marks the date as required (`aria-required`). Inside a `Field`, the Field's `required` is used as well. */
  required?: boolean;
  /** Submits the date with a form, as an ISO 8601 date string in a hidden input. */
  name?: string;
  /** The id of the field. Inside a `Field`, the Field's id is used. */
  id?: string;
  /** Classes for the root element, which holds the field and anchors the calendar. */
  className?: string;
  /** Focuses the first part of the date when the page loads. */
  autoFocus?: boolean;
  /** Called when focus moves into the field from outside it. */
  onFocus?: FocusEventHandler;
  /** Called when focus leaves the field and its calendar (react-hook-form's `onBlur`). */
  onBlur?: FocusEventHandler;
  /** The name of the field when it is not inside a `Field`. */
  "aria-label"?: string;
  /** The id of the element that names the field. Added after the `Field.Label`. */
  "aria-labelledby"?: string;
  /** Ids of elements that describe the field. Added after the Field's description and error. */
  "aria-describedby"?: string;
  /**
   * The first editable part of the date (the month in `en-US`, the day in `es-ES`), so that
   * `ref.current.focus()`, which react-hook-form calls on an invalid field, puts the caret there.
   */
  ref?: Ref<HTMLElement | null>;
};

/**
 * A field to pick one date, by typing it part by part or by choosing it in a calendar. Use it for
 * a date near today (an appointment, a deadline). For a date that is long known and far away (a
 * date of birth) typing alone is faster, so prefer three labelled inputs or this field without
 * opening the calendar; for a range of dates, or a date and a time, this component is not enough.
 *
 * Import it from `@aleixvidal/ui/date-picker`, its own entry point (see AGENTS.md section 5).
 *
 * Built on React Aria. The field is a group of spin buttons, one per part (month, day, year, in
 * the order of the locale): Tab moves between the parts and then to the calendar button, typing
 * digits fills a part and moves on, Up and Down change it, Backspace clears it. Alt + Down, or
 * Enter on the button, opens the calendar: the arrows move by day, Page Up and Page Down by month
 * (with Shift, by year), Home and End to the start and end of the week, Enter chooses the day and
 * closes, Escape closes without choosing. However the calendar closes (choosing a day, Escape, or
 * a click outside, which only closes it), focus goes back to where it was opened from: the
 * calendar button, or the part where Alt + Down was pressed.
 *
 * The value is an ISO 8601 date string (`"2026-10-30"`), with no time or time zone, so it does
 * not move by a day in other time zones and goes into a form or a schema as it is.
 *
 * Inside a `Field`, the `Field.Label` names it through `aria-labelledby`, since a label cannot
 * name a group: clicking the label does not focus the field. `Field.Description` and
 * `Field.Error` describe every part. On its own it needs `aria-label` or `aria-labelledby`.
 *
 * Validation: a typed date before `min`, after `max` or rejected by `isDateDisabled` is marked
 * invalid by React Aria itself (red border and `aria-invalid`), as is any date while `invalid` is
 * set; either one is enough. The message is always yours: put it in a `Field.Error` with the
 * Field's `invalid`. A field that is invalid with no `Field.Error` is not announced to screen
 * readers as an error and shows no reason, so validate the same rules in your form.
 *
 * `className` goes to the root; `ref` goes to the first editable part (see `ref`). React Aria
 * adds one small `<style>` element at runtime (and on iOS a second one while the calendar is
 * open); under a strict Content-Security-Policy, give them a nonce with `<meta name="csp-nonce">`.
 * Without it they are blocked and the field still works; only touch behavior is lost.
 */
export const DatePicker = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  isDateDisabled,
  locale,
  firstDayOfWeek,
  defaultOpen,
  invalid,
  disabled,
  readOnly,
  required,
  name,
  id,
  className,
  autoFocus,
  onFocus,
  onBlur,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ref,
}: DatePickerProps) => {
  const state = useFieldState({
    id,
    invalid,
    disabled,
    "aria-describedby": ariaDescribedBy,
  });
  const labelledBy =
    [state.labelledBy, ariaLabelledBy].filter(Boolean).join(" ") || undefined;
  const groupRef = useRef<HTMLDivElement>(null);

  useImperativeHandle<HTMLElement | null, HTMLElement | null>(
    ref,
    () =>
      groupRef.current?.querySelector<HTMLElement>('[role="spinbutton"]') ??
      null,
  );

  // Only the first value matters, as with a native `defaultValue`.
  const [initialDate] = useState(() =>
    toOptionalDate(defaultValue, "defaultValue"),
  );

  const picker = (
    <AriaDatePicker<CalendarDate>
      id={state.id}
      value={toOptionalDate(value, "value")}
      defaultValue={initialDate}
      onChange={(date) =>
        onValueChange?.(date === null ? null : date.toString())
      }
      minValue={toOptionalDate(min, "min")}
      maxValue={toOptionalDate(max, "max")}
      isDateUnavailable={
        isDateDisabled && ((date) => isDateDisabled(date.toString()))
      }
      firstDayOfWeek={firstDayOfWeek}
      defaultOpen={defaultOpen}
      granularity="day"
      // `undefined`, not `false`, when valid: `false` would hide React Aria's own range check.
      isInvalid={state.invalid || undefined}
      isDisabled={state.disabled}
      isReadOnly={readOnly}
      isRequired={Boolean(required) || Boolean(state["aria-required"])}
      validationBehavior="aria"
      name={name}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={state["aria-describedby"]}
      data-slot="date-picker"
      className={cn("w-full", className)}
    >
      <Group
        ref={groupRef}
        data-slot="date-picker-field"
        className={cn(groupClasses)}
      >
        <DateInput className="flex flex-1 items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              data-slot="date-picker-segment"
              className={cn(segmentClasses)}
            />
          )}
        </DateInput>
        <Button
          data-slot="date-picker-button"
          className={cn(iconButtonClasses)}
        >
          <CalendarIcon />
        </Button>
      </Group>
      <Popover
        placement="bottom start"
        offset={4}
        // The same 10px margin from the viewport edge as the Select list. With it a 320px viewport
        // still fits the calendar (seven 40px days plus padding and border: 298px).
        containerPadding={10}
        style={{ zIndex: "var(--ds-z-dropdown)" }}
        data-slot="date-picker-popover"
        className={popoverClasses}
      >
        <Dialog className="outline-transparent">
          <Calendar data-slot="date-picker-calendar">
            <header className="flex items-center gap-2 pb-2">
              <Button slot="previous" className={cn(iconButtonClasses)}>
                <ChevronIcon direction="left" />
              </Button>
              <Heading className="m-0 flex-1 text-center font-mono text-md font-medium" />
              <Button slot="next" className={cn(iconButtonClasses)}>
                <ChevronIcon direction="right" />
              </Button>
            </header>
            <CalendarGrid className="border-collapse [&_td]:p-0">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="size-10 p-0 font-sans text-sm font-regular text-text-muted">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell date={date} className={cn(cellClasses)}>
                    {({ formattedDate, isToday }) => (
                      <>
                        {formattedDate}
                        {isToday && <TodayDot />}
                      </>
                    )}
                  </CalendarCell>
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );

  return locale === undefined ? (
    picker
  ) : (
    <I18nProvider locale={locale}>{picker}</I18nProvider>
  );
};
