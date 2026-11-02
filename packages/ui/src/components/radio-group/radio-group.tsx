import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_ORIENTATION = "vertical";

/**
 * The group only lays out its options. `orientation` is also passed to Radix, which sets
 * `aria-orientation` and limits the arrow keys to that axis.
 */
const radioGroupVariants = cva("flex", {
  variants: {
    orientation: {
      vertical: "flex-col gap-2",
      horizontal: "flex-row flex-wrap gap-x-6 gap-y-2",
    },
  },
  defaultVariants: { orientation: DEFAULT_ORIENTATION },
});

/**
 * The circle is the Radix item (a `<button role="radio">`), so border, background and focus indicator
 * are on it, as in `Checkbox`. The group's invalid state reaches it through the `data-invalid`
 * on the group, so every option shows the danger border.
 *
 * With forced colors the backgrounds are painted as `Canvas`, so the dot uses `Highlight`
 * (`GrayText` when disabled) and invalid is a dashed border.
 */
const radioItemClasses = [
  "m-0 box-border inline-flex size-5 shrink-0 appearance-none items-center justify-center rounded-full border border-border-control bg-bg-input p-0 text-text-on-primary",
  "not-data-disabled:not-in-data-invalid:hover:border-brand-primary",
  "not-data-disabled:not-in-data-invalid:active:border-brand-primary",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "not-data-disabled:data-[state=checked]:bg-brand-primary",
  "not-data-disabled:not-in-data-invalid:data-[state=checked]:border-brand-primary",
  "in-data-invalid:border-border-danger",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
  "forced-colors:in-data-invalid:border-dashed",
  "motion-safe:transition-[border-color]",
];

type RadioGroupVariantProps = VariantProps<typeof radioGroupVariants>;

export type RadioGroupProps = ComponentPropsWithRef<
  typeof RadioGroupPrimitive.Root
> & {
  /**
   * How the options are laid out, and which arrow keys move between them: `vertical` (default)
   * uses Up and Down, `horizontal` uses Left and Right.
   */
  orientation?: RadioGroupVariantProps["orientation"];
  /** Marks the selection as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * A set of options of which exactly one can be selected. Use it for two to about five options
 * that should all be shown at once; use a Select for a longer list, a Checkbox for an independent
 * yes/no, and a Switch for a setting that applies at once.
 *
 * Inside a `Field`, the `Field.Label` names the group (through `aria-labelledby`, since a group
 * cannot be labelled with `htmlFor`), and `Field.Description` and `Field.Error` describe it. Each
 * option is a `RadioGroup.Item` inside its own `<Field orientation="horizontal">`, item first,
 * then its label and an optional description. On its own the group needs an `aria-label` or
 * `aria-labelledby`. Clicking the group's `Field.Label` does nothing, as clicking the legend of a
 * native `<fieldset>` does not; each option's own label selects it, and Tab reaches the group.
 *
 * Tab moves into the group (to the selected option, or the first one) and out of it; the arrow
 * keys move between options and select them; Space selects the focused option. Radix handles
 * the roving focus and the ARIA. All native `<div>` attributes and Radix's `name`, `required`,
 * `value`, `defaultValue`, `onValueChange` and `loop` are accepted; `ref` and `className` go to
 * the group `<div>`.
 */
const RadioGroupRoot = ({
  orientation,
  invalid,
  className,
  disabled,
  ...props
}: RadioGroupProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <RadioGroupPrimitive.Root
      {...props}
      id={state.id}
      orientation={orientation ?? DEFAULT_ORIENTATION}
      disabled={state.disabled}
      aria-labelledby={
        [state.labelledBy, props["aria-labelledby"]]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
      aria-required={state["aria-required"] ?? props["aria-required"]}
      data-slot="radio-group"
      data-orientation={orientation ?? DEFAULT_ORIENTATION}
      data-invalid={state.invalid || undefined}
      className={cn(radioGroupVariants({ orientation }), className)}
    />
  );
};

export type RadioGroupItemProps = ComponentPropsWithRef<
  typeof RadioGroupPrimitive.Item
>;

/**
 * One option. Inside a `<Field orientation="horizontal">` its `Field.Label` names it and its
 * `Field.Description` describes it; a disabled option is a `disabled` item (or a disabled Field).
 * All native `<button>` attributes are accepted; `value` is required, and `ref` and `className`
 * go to the `<button>`.
 */
const RadioGroupItem = ({
  className,
  disabled,
  ...props
}: RadioGroupItemProps) => {
  const state = useFieldState({
    id: props.id,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <RadioGroupPrimitive.Item
      {...props}
      id={state.id}
      disabled={state.disabled}
      aria-describedby={state["aria-describedby"]}
      data-slot="radio-group-item"
      className={cn(radioItemClasses, className)}
    >
      <RadioGroupPrimitive.Indicator className="block size-2 rounded-full bg-current forced-colors:bg-[Highlight] forced-colors:in-data-disabled:bg-[GrayText]" />
    </RadioGroupPrimitive.Item>
  );
};

// Marked pure so a bundler can drop the whole compound when RadioGroup is not imported.
export const RadioGroup = /* @__PURE__ */ Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
});
