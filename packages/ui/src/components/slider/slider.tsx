import * as SliderPrimitive from "@radix-ui/react-slider";
import { useId, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

/**
 * The root is the touch target: it is 48px tall (the track is a thin line in its middle) and
 * pressing anywhere on it moves the nearest thumb, so the target is well above the 44px that
 * touch guidance asks for, while the thumb itself (24px) meets the WCAG 2.2 minimum. State comes
 * from Radix's `data-disabled` plus our `data-invalid`, styled with Tailwind data variants.
 */
const sliderClasses =
  "relative flex h-12 w-full touch-none items-center select-none data-disabled:cursor-not-allowed";

/**
 * The track is a `bg.input` bar with a `border.control` outline: the outline keeps 3:1 against the
 * page, a card and a field, and the fill (`brand.primary`) sits on `bg.input`, which is also 3:1 or
 * more, so the filled part is told apart from the rest without relying on one fill against the other.
 * With forced colors the backgrounds are painted as `Canvas`, so the fill uses `Highlight` (`GrayText`
 * when disabled): filled against empty.
 */
const trackClasses =
  "relative box-border h-2 grow overflow-hidden rounded-lg border border-border-control bg-bg-input in-data-disabled:bg-bg-subtle forced-colors:in-data-disabled:border-[GrayText]";

/** The filled part: the value. It turns to the danger color when the slider is invalid. */
const rangeClasses =
  "absolute h-full bg-brand-primary in-data-invalid:bg-border-danger in-data-disabled:bg-text-muted forced-colors:bg-[Highlight] forced-colors:in-data-disabled:bg-[GrayText]";

const thumbClasses = [
  "m-0 box-border block size-6 cursor-grab appearance-none rounded-full border-2 border-brand-primary bg-bg-input p-0",
  "not-data-disabled:hover:bg-bg-subtle not-data-disabled:active:cursor-grabbing",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "in-data-invalid:border-border-danger",
  "data-disabled:cursor-not-allowed data-disabled:border-text-muted data-disabled:bg-bg-subtle",
  "forced-colors:in-data-invalid:border-dashed forced-colors:in-data-disabled:border-[GrayText]",
];

export type SliderProps = Omit<
  ComponentPropsWithRef<typeof SliderPrimitive.Root>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "orientation"
  | "dir"
  | "inverted"
  | "asChild"
  | "children"
  | "aria-label"
  | "aria-labelledby"
> & {
  /** Controlled value: one number, or two for a range. */
  value?: number[];
  /** Initial value when the slider manages its own state. One number, or two for a range. Defaults to the minimum. */
  defaultValue?: number[];
  /** Called with the new value (always an array) as the thumb moves. */
  onValueChange?: (value: number[]) => void;
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
  /** Shows the current value above the track, right-aligned. It is hidden from assistive technology, which reads the thumb. */
  showValue?: boolean;
  /**
   * Turns a value into text, such as `` `${value}%` ``. Used for the visible label and for
   * `aria-valuetext`, so a screen reader says "40%" instead of "40".
   */
  formatValue?: (value: number) => string;
  /**
   * Names of the thumbs of a range, for translation. They follow the slider's own name, so a
   * `Field.Label` of "Price" gives "Price Minimum" and "Price Maximum". Default: "Minimum" and
   * "Maximum" for two thumbs, "Value 1 of 3" and so on for more.
   */
  thumbLabels?: string[];
  /** The name of the slider when it is not inside a `Field`. Applied to every thumb. */
  "aria-label"?: string;
  /** The id of the element that names the slider. Added after the `Field.Label`. */
  "aria-labelledby"?: string;
};

const defaultThumbLabel = (index: number, count: number) => {
  if (count !== 2) return `Value ${index + 1} of ${count}`;
  return index === 0 ? "Minimum" : "Maximum";
};

/**
 * A control to pick a number, or a range between two numbers, by dragging a thumb or with the
 * keyboard. Use it for a value on a continuous or finely stepped scale where the approximate
 * position matters (volume, price range); use an Input for an exact number and a Select for a
 * few named options.
 *
 * Inside a `Field`, the `Field.Label` names it (through `aria-labelledby`, since a label cannot
 * name a slider) and `Field.Description` and `Field.Error` describe it. On its own it needs
 * `aria-label` or `aria-labelledby`. Each thumb is a `role="slider"` with `aria-valuenow`,
 * `aria-valuemin` and `aria-valuemax`; Left and Down lower it and Right and Up raise it by
 * `step`, Page Up and Page Down (or Shift with an arrow) by ten steps, Home and End go to the
 * ends. Radix does the keyboard, pointer and ARIA. A slider is never required: `required` and
 * `aria-required` are not accepted, and a required `Field` does not set them.
 *
 * It is horizontal only. All native attributes are accepted and forwarded to the root, as are
 * Radix's `min`, `max`, `step`, `minStepsBetweenThumbs`, `name`, `form`, `disabled` and
 * `onValueCommit`; `ref` and `className` go to the root.
 */
export const Slider = ({
  value,
  defaultValue,
  onValueChange,
  invalid,
  showValue = false,
  formatValue,
  thumbLabels,
  className,
  disabled,
  min = 0,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SliderProps) => {
  const generatedId = useId();
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });
  const baseId = state.id ?? generatedId;
  // Value state is kept here, not in Radix, only because the visible label and `aria-valuetext`
  // need the current numbers; Radix is controlled with them. `value` still wins when it is set.
  const [ownValue, setOwnValue] = useState(defaultValue ?? [min]);
  const current = value ?? ownValue;
  const text = (number: number) => formatValue?.(number) ?? String(number);
  const labelledBy =
    [state.labelledBy, ariaLabelledBy].filter(Boolean).join(" ") || undefined;
  const isRange = current.length > 1;

  return (
    <div className="flex w-full flex-col">
      {showValue && (
        <span
          aria-hidden="true"
          data-slot="slider-value"
          className="min-h-(--ds-text-sm-line-height) text-right font-mono text-sm text-text-muted tabular-nums"
        >
          {current.map(text).join(" – ")}
        </span>
      )}
      <SliderPrimitive.Root
        {...props}
        id={state.id}
        min={min}
        value={current}
        disabled={state.disabled}
        onValueChange={(next) => {
          setOwnValue(next);
          onValueChange?.(next);
        }}
        data-slot="slider"
        data-invalid={state.invalid || undefined}
        className={cn(sliderClasses, className)}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={trackClasses}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={rangeClasses}
          />
        </SliderPrimitive.Track>
        {current.map((thumbValue, index) => {
          const thumbId = `${baseId}-thumb-${index}`;
          const thumbLabel =
            thumbLabels?.[index] ?? defaultThumbLabel(index, current.length);

          return (
            <SliderPrimitive.Thumb
              // Thumbs have no identity but their position, so the index is the key.
              key={thumbId}
              id={isRange ? thumbId : undefined}
              data-slot="slider-thumb"
              // One thumb: the slider's name. A range: the slider's name, then the thumb's own
              // label, so "Price" gives "Price Minimum" (the thumb is named by itself too).
              aria-label={
                isRange
                  ? [labelledBy ? undefined : ariaLabel, thumbLabel]
                      .filter(Boolean)
                      .join(" ")
                  : ariaLabel
              }
              aria-labelledby={
                isRange
                  ? labelledBy
                    ? `${labelledBy} ${thumbId}`
                    : undefined
                  : labelledBy
              }
              aria-describedby={state["aria-describedby"]}
              aria-invalid={state["aria-invalid"]}
              aria-valuetext={
                formatValue === undefined ? undefined : text(thumbValue)
              }
              className={cn(thumbClasses)}
            />
          );
        })}
      </SliderPrimitive.Root>
    </div>
  );
};
