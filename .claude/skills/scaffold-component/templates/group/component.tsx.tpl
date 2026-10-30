__checklist__
import * as __Namespace__ from "__primitive__";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_ORIENTATION = "vertical";

/**
 * The group only lays out its items. `orientation` is also passed to Radix, which sets
 * `aria-orientation` and limits the arrow keys to that axis.
 */
const __nameCamel__Variants = cva("flex", {
  variants: {
    orientation: {
      vertical: "flex-col gap-2",
      horizontal: "flex-row flex-wrap gap-x-6 gap-y-2",
    },
  },
  defaultVariants: { orientation: DEFAULT_ORIENTATION },
});

/**
 * Each item is the Radix item (a `<button role="__itemRole__">`), so border, background and focus
 * ring are on it. The group's invalid state reaches it through the `data-invalid` on the group, so
 * every item shows the danger border. Only semantic tokens: no raw palette values.
 */
const __nameCamel__ItemClasses = [
  "m-0 box-border inline-flex size-5 shrink-0 appearance-none items-center justify-center rounded-full border border-border-control bg-bg-input p-0 text-text-on-primary",
  "not-data-disabled:not-in-data-invalid:hover:border-brand-primary",
  "not-data-disabled:not-in-data-invalid:active:border-brand-primary",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "not-data-disabled:data-[state=checked]:bg-brand-primary",
  "not-data-disabled:not-in-data-invalid:data-[state=checked]:border-brand-primary",
  "in-data-invalid:border-border-danger",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
  "motion-safe:transition-[border-color]",
];

type __Name__VariantProps = VariantProps<typeof __nameCamel__Variants>;

export type __Name__Props = Omit<
  ComponentPropsWithRef<typeof __Namespace__.Root>,
  "orientation"
//#if-not requiredSupported
  | "required"
  | "aria-required"
//#endif
> & {
  /**
   * How the items are laid out, and which arrow keys move between them: `vertical` (default)
   * uses Up and Down, `horizontal` uses Left and Right.
   */
  orientation?: __Name__VariantProps["orientation"];
  /** Marks the selection as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * SCAFFOLD-PLACEHOLDER: write when to use this component and when to use another one.
 *
 * Inside a `Field`, the `Field.Label` names the group (through `aria-labelledby`, since a group
 * cannot be labelled with `htmlFor`), and `Field.Description` and `Field.Error` describe it. Each
 * item is a `__Name__.Item` inside its own `<Field orientation="horizontal">`, item first, then
 * its label and an optional description. On its own the group needs an `aria-label` or
 * `aria-labelledby`.
 *
 * Tab moves into the group (to the selected item, or the first one) and out of it; the arrow keys
 * move between items and select them; Space selects the focused item. Radix handles the roving
 * focus and the ARIA. All native `<div>` attributes and Radix's props are accepted; `ref` and
 * `className` go to the group `<div>`.
 */
const __Name__Root = ({
  orientation,
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
      orientation={orientation ?? DEFAULT_ORIENTATION}
      disabled={state.disabled}
      aria-labelledby={
        [state.labelledBy, props["aria-labelledby"]]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
//#if requiredSupported
      aria-required={state["aria-required"] ?? props["aria-required"]}
//#endif
      data-slot="__name__"
      data-orientation={orientation ?? DEFAULT_ORIENTATION}
      data-invalid={state.invalid || undefined}
      className={cn(__nameCamel__Variants({ orientation }), className)}
    />
  );
};

export type __Name__ItemProps = ComponentPropsWithRef<
  typeof __Namespace__.Item
>;

/**
 * One item. Inside a `<Field orientation="horizontal">` its `Field.Label` names it and its
 * `Field.Description` describes it; a disabled item is a `disabled` item (or a disabled Field).
 * All native `<button>` attributes are accepted; `value` is required, and `ref` and `className`
 * go to the `<button>`.
 */
const __Name__Item = ({
  className,
  disabled,
  ...props
}: __Name__ItemProps) => {
  const state = useFieldState({
    id: props.id,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <__Namespace__.Item
      {...props}
      id={state.id}
      disabled={state.disabled}
      aria-describedby={state["aria-describedby"]}
      data-slot="__name__-item"
      className={cn(__nameCamel__ItemClasses, className)}
    >
      <__Namespace__.Indicator className="block size-2 rounded-full bg-current" />
    </__Namespace__.Item>
  );
};

// Marked pure so a bundler can drop the whole compound when __Name__ is not imported.
export const __Name__ = /* @__PURE__ */ Object.assign(__Name__Root, {
  Item: __Name__Item,
});
