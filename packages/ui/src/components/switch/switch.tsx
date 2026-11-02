import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

/**
 * The track is the Radix root (a `<button role="switch">`), so border, background and focus indicator
 * are on it. State comes from Radix's `data-state` and `data-disabled`, plus our `data-invalid`,
 * and is styled with Tailwind data variants, as in `Input`. There are no variants: a switch has
 * one size.
 *
 * With forced colors the browser paints every background as `Canvas`, which hid the thumb and the
 * on fill. The `forced-colors:` lines use system colors instead: on is a `Highlight` track with a
 * `HighlightText` thumb on the right, off an empty track with a `CanvasText` thumb on the left,
 * disabled is `GrayText` and invalid a dashed border.
 */
const switchClasses = [
  "m-0 box-border inline-flex h-6 w-12 shrink-0 appearance-none items-center rounded-lg border border-border-control bg-bg-input p-px",
  "not-data-invalid:not-data-disabled:hover:border-brand-primary",
  "not-data-invalid:not-data-disabled:active:border-brand-primary",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "not-data-disabled:data-[state=checked]:bg-brand-primary",
  "not-data-disabled:not-data-invalid:data-[state=checked]:border-brand-primary",
  "data-invalid:border-border-danger",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle",
  "forced-colors:not-data-disabled:data-[state=checked]:bg-[Highlight]",
  "forced-colors:data-invalid:border-dashed",
  "motion-safe:transition-[border-color]",
];

/**
 * The track is 48x24 with a 1px border and 1px padding, so the thumb (20px) has 22px of height
 * and 46px of width to move in, and slides by `translate-x-6`, the free width of the track. The
 * slide only runs when the user has not asked for reduced motion.
 */
const thumbClasses = [
  "pointer-events-none block size-5 rounded-md bg-text-muted",
  "data-[state=checked]:translate-x-6",
  "not-data-disabled:data-[state=checked]:bg-text-on-primary",
  "forced-colors:bg-[CanvasText] forced-colors:in-data-disabled:bg-[GrayText]",
  "forced-colors:not-data-disabled:data-[state=checked]:bg-[HighlightText]",
  "motion-safe:transition-transform",
];

export type SwitchProps = Omit<
  ComponentPropsWithRef<typeof SwitchPrimitive.Root>,
  | "checked"
  | "defaultChecked"
  | "onCheckedChange"
  | "required"
  | "aria-required"
> & {
  /** Controlled state: `true` for on, `false` for off. */
  checked?: boolean;
  /** Initial state when the switch manages its own state. */
  defaultChecked?: boolean;
  /** Called with the new state when the user toggles the switch. */
  onCheckedChange?: (checked: boolean) => void;
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * A control that turns a setting on or off. Use it for a setting that takes effect as soon as it
 * is toggled; use a Checkbox when the choice is only applied on submit or is one of several
 * options, and a RadioGroup to pick exactly one option. Inside a `Field`, place it beside the
 * `Field.Label` so that the label is clicked with it; on its own it needs an `aria-label` or an
 * external label.
 *
 * It is announced as a switch, with its state. Space (and Enter) toggles it. All native
 * `<button>` attributes are accepted and forwarded to the `<button>`, as are Radix's `name` and
 * `value`; `ref` and `className` go to the `<button>` too.
 *
 * It is never required: `required` and `aria-required` are not accepted, and a `required` `Field`
 * does not set them, because a switch acts as soon as it is toggled and `role="switch"` does not
 * support `aria-required`. Do not set `required` on a `Field` around a Switch: the Field would
 * still show its required marker, which the switch cannot honour. For a consent the user must
 * give, use a Checkbox.
 */
export const Switch = ({
  invalid,
  className,
  disabled,
  ...props
}: SwitchProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <SwitchPrimitive.Root
      {...props}
      id={state.id}
      disabled={state.disabled}
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
      // Never required (see above), even if an untyped caller passes them through.
      required={undefined}
      aria-required={undefined}
      data-slot="switch"
      data-invalid={state.invalid || undefined}
      className={cn(switchClasses, className)}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(thumbClasses)}
      />
    </SwitchPrimitive.Root>
  );
};
