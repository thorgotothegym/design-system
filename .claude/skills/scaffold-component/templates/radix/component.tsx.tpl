import * as __Namespace__ from "__primitive__";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

/**
 * The Radix root is the control (a `<button role="__role__">`), so border, background and focus
 * ring are on it. State comes from Radix's `data-state` and `data-disabled`, plus our
 * `data-invalid`, and is styled with Tailwind data variants. There are no variants until a second
 * size or look is needed. Only semantic tokens: no raw palette values, no arbitrary values.
 */
const __nameCamel__Classes = [
  "m-0 box-border inline-flex h-6 w-12 shrink-0 appearance-none items-center rounded-lg border border-border-control bg-bg-input p-px",
  "not-data-invalid:not-data-disabled:hover:border-brand-primary",
  "not-data-invalid:not-data-disabled:active:border-brand-primary",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "not-data-disabled:data-[state=checked]:bg-brand-primary",
  "not-data-disabled:not-data-invalid:data-[state=checked]:border-brand-primary",
  "data-invalid:border-border-danger",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle",
  "motion-safe:transition-[border-color]",
];

/** The moving part. It only animates when the user has not asked for reduced motion. */
const __nameCamel__PartClasses = [
  "pointer-events-none block size-5 rounded-md bg-text-muted",
  "data-[state=checked]:translate-x-6",
  "not-data-disabled:data-[state=checked]:bg-text-on-primary",
  "motion-safe:transition-transform",
];

export type __Name__Props = Omit<
  ComponentPropsWithRef<typeof __Namespace__.Root>,
  | "checked"
  | "defaultChecked"
  | "onCheckedChange"
//#if-not requiredSupported
  | "required"
  | "aria-required"
//#endif
> & {
  /** Controlled state. Change the type if the primitive has more states (a checkbox is also `"indeterminate"`). */
  checked?: boolean;
  /** Initial state when the control manages its own state. */
  defaultChecked?: boolean;
  /** Called with the new state when the user toggles the control. */
  onCheckedChange?: (checked: boolean) => void;
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * SCAFFOLD-PLACEHOLDER: write when to use this component and when to use another one.
 *
 * Inside a `Field`, put it next to the `Field.Label` (`<Field orientation="horizontal">`, control
 * first) so that the label is clicked with it; on its own it needs an `aria-label` or an external
 * label. All native `<button>` attributes are accepted and forwarded to the `<button>`, as are
 * Radix's `name` and `value`; `ref` and `className` go to the `<button>` too.
 */
export const __Name__ = ({
  invalid,
  className,
  disabled,
  ...props
}: __Name__Props) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <__Namespace__.Root
      {...props}
      id={state.id}
      disabled={state.disabled}
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
//#if requiredSupported
      aria-required={state["aria-required"] ?? props["aria-required"]}
//#endif
      data-slot="__name__"
      data-invalid={state.invalid || undefined}
      className={cn(__nameCamel__Classes, className)}
    >
      <__Namespace__.__Part__
        data-slot="__name__-__partKebab__"
        className={cn(__nameCamel__PartClasses)}
      />
    </__Namespace__.Root>
  );
};
