import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

/**
 * The box is the Radix root (a `<button role="checkbox">`), so border, background and focus indicator
 * are on it. State comes from Radix's `data-state` and `data-disabled`, plus our `data-invalid`,
 * and is styled with Tailwind data variants, as in `Input`. There are no variants: a checkbox
 * has one size.
 */
const checkboxClasses = [
  "m-0 box-border inline-flex size-5 shrink-0 appearance-none items-center justify-center rounded-md border border-border-control bg-bg-input p-0 text-text-on-primary",
  "not-data-invalid:not-data-disabled:hover:border-brand-primary",
  "not-data-invalid:not-data-disabled:active:border-brand-primary",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "not-data-disabled:data-[state=checked]:bg-brand-primary not-data-disabled:data-[state=indeterminate]:bg-brand-primary",
  "not-data-disabled:not-data-invalid:data-[state=checked]:border-brand-primary not-data-disabled:not-data-invalid:data-[state=indeterminate]:border-brand-primary",
  "data-invalid:border-border-danger",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
  "forced-colors:data-invalid:border-dashed",
  "motion-safe:transition-[border-color]",
];

export type CheckboxProps = Omit<
  ComponentPropsWithRef<typeof CheckboxPrimitive.Root>,
  "checked" | "defaultChecked" | "onCheckedChange"
> & {
  /** Controlled state: `true`, `false` or `"indeterminate"` (some, not all, of a set are selected). */
  checked?: CheckedState;
  /** Initial state when the checkbox manages its own state. */
  defaultChecked?: CheckedState;
  /** Called with the new state when the user toggles the checkbox. */
  onCheckedChange?: (checked: CheckedState) => void;
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

const CheckMark = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    className="hidden size-4 in-data-[state=checked]:block"
  >
    <path
      d="M3.5 8.5l3 3 6-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DashMark = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    className="hidden size-4 in-data-[state=indeterminate]:block"
  >
    <path
      d="M4 8h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * A box that is checked, unchecked or indeterminate. Use it for an independent yes/no choice or
 * for picking several options from a set; use a Switch for a setting that takes effect at once
 * and a RadioGroup to pick exactly one option. Inside a `Field`, put it next to the `Field.Label`
 * so that the label is clicked with it; on its own it needs an `aria-label` or an external label.
 *
 * The state is exposed as `aria-checked` (`mixed` when indeterminate). Space toggles it. All
 * native `<button>` attributes are accepted and forwarded to the `<button>`, as are Radix's
 * `name`, `value` and `required`; `ref` and `className` go to the `<button>` too.
 */
export const Checkbox = ({
  invalid,
  className,
  disabled,
  ...props
}: CheckboxProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <CheckboxPrimitive.Root
      {...props}
      id={state.id}
      disabled={state.disabled}
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
      aria-required={state["aria-required"] ?? props["aria-required"]}
      data-slot="checkbox"
      data-invalid={state.invalid || undefined}
      className={cn(checkboxClasses, className)}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <CheckMark />
        <DashMark />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
