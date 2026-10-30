__checklist__
import * as __Namespace__ from "__primitive__";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_SIZE = "md";

/**
 * The trigger is the drawn box, as in `Input`: border, background and focus ring are on it. States
 * are `data-*` attributes (Radix's `data-state`, `data-disabled` and `data-placeholder`, plus our
 * `data-invalid`) styled with Tailwind data variants. The height is fixed per size and the value
 * is truncated, so choosing a long option never resizes it.
 */
const __nameCamel__TriggerVariants = cva(
  [
    "m-0 box-border flex w-full cursor-pointer appearance-none items-center gap-2 rounded-lg border border-border-control bg-bg-input px-3 text-left font-mono text-text-default data-placeholder:text-text-placeholder",
    "not-data-invalid:not-data-disabled:hover:border-brand-primary",
    "not-data-invalid:not-data-disabled:active:border-brand-primary",
    "not-data-invalid:data-[state=open]:border-brand-primary",
    "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    "data-invalid:border-border-danger",
    "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
    "motion-safe:transition-[border-color]",
  ],
  {
    variants: {
      size: {
        sm: "h-8 text-sm",
        md: "h-10 text-md",
        lg: "h-12 text-lg",
      },
    },
    defaultVariants: { size: DEFAULT_SIZE },
  },
);

/**
 * The list is portalled and positioned by Radix (popper mode). Its width and height are capped by
 * the space Radix measures between the trigger and the viewport edge (minus a 10px collision
 * padding), so it never overflows the viewport and scrolls inside instead; it flips above the
 * trigger when there is no room below. The gap to the trigger is a spacing step, applied as a
 * translate so that it does not change the measured size. The size variables are named after the
 * primitive (`--radix-select-*` here; `--radix-popover-*` or `--radix-dropdown-menu-*` in others):
 * rename them if the primitive is not Radix Select.
 */
const __nameCamel__ContentVariants = cva(
  [
    "z-(--ds-z-dropdown) box-border min-w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width) max-h-(--radix-select-content-available-height) overflow-hidden rounded-lg border border-border-decorative bg-bg-surface font-mono text-text-default shadow-md",
    "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
  ],
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-md",
        lg: "text-lg",
      },
    },
    defaultVariants: { size: DEFAULT_SIZE },
  },
);

type __Name__VariantProps = VariantProps<typeof __nameCamel__TriggerVariants>;

type __Name__RootProps = ComponentPropsWithRef<typeof __Namespace__.Root>;

export type __Name__Props = Omit<
  ComponentPropsWithRef<typeof __Namespace__.Trigger>,
  "children" | "value" | "defaultValue" | "dir" | "size"
> &
  Pick<
    __Name__RootProps,
    | "value"
    | "defaultValue"
    | "onValueChange"
    | "open"
    | "defaultOpen"
    | "onOpenChange"
    | "name"
    | "required"
    | "autoComplete"
    | "form"
    | "dir"
  > & {
    /** The options: `__Name__.Item`, optionally inside `__Name__.Group` with a `__Name__.Label`, and `__Name__.Separator`. */
    children: ReactNode;
    /** Shown in the trigger while no option is selected. A controlled `value` of `""` shows it again. */
    placeholder?: ReactNode;
    /** Height and text size of the trigger and the list. The type comes from the cva variants. */
    size?: __Name__VariantProps["size"];
    /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
    invalid?: boolean;
  };

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    className={cn("size-4 shrink-0", className)}
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const scrollButtonClasses =
  "flex h-6 cursor-default items-center justify-center text-text-muted";

/**
 * SCAFFOLD-PLACEHOLDER: write when to use this component and when to use another one.
 *
 * A trigger that opens a list over the page. Inside a `Field` it is labelled, described and
 * validated automatically; on its own it needs an `aria-label` or an external label. Radix handles
 * focus, keyboard and ARIA: say here which keys open, move, choose and close. The list is portalled
 * on `z-(--ds-z-dropdown)`, stays inside the viewport and scrolls inside; opening it locks the page
 * scroll without shifting the page sideways.
 *
 * All native `<button>` attributes are accepted and forwarded to the trigger, as are Radix's root
 * props listed in the type; `ref` and `className` go to the trigger too. `defaultOpen` is there
 * for stories that show the open list: they start open instead of opening it in `play`.
 */
const __Name__Root = ({
  children,
  placeholder,
  size,
  invalid,
  className,
  disabled,
  required,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  name,
  autoComplete,
  form,
  dir,
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
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      name={name}
      required={required}
      autoComplete={autoComplete}
      form={form}
      dir={dir}
      disabled={state.disabled}
    >
      <__Namespace__.Trigger
        {...props}
        id={state.id}
        aria-describedby={state["aria-describedby"]}
        aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
        aria-required={
          state["aria-required"] ??
          props["aria-required"] ??
          (required || undefined)
        }
        data-slot="__name__"
        data-size={size ?? DEFAULT_SIZE}
        data-invalid={state.invalid || undefined}
        className={cn(__nameCamel__TriggerVariants({ size }), className)}
      >
        <span className="min-w-0 flex-1 truncate">
          <__Namespace__.Value placeholder={placeholder} />
        </span>
        <__Namespace__.Icon asChild>
          <ChevronIcon className="text-text-muted" />
        </__Namespace__.Icon>
      </__Namespace__.Trigger>
      <__Namespace__.Portal>
        <__Namespace__.Content
          position="popper"
          data-slot="__name__-content"
          className={__nameCamel__ContentVariants({ size })}
        >
          <__Namespace__.ScrollUpButton className={scrollButtonClasses}>
            <ChevronIcon className="rotate-180" />
          </__Namespace__.ScrollUpButton>
          <__Namespace__.Viewport className="p-1">
            {children}
          </__Namespace__.Viewport>
          <__Namespace__.ScrollDownButton className={scrollButtonClasses}>
            <ChevronIcon />
          </__Namespace__.ScrollDownButton>
        </__Namespace__.Content>
      </__Namespace__.Portal>
    </__Namespace__.Root>
  );
};

export type __Name__ItemProps = ComponentPropsWithRef<
  typeof __Namespace__.Item
>;

/**
 * One option. The highlighted option (keyboard focus, and the pointer too: Radix highlights on
 * pointer move) is an inset `focus.ring` outline over a `bg.subtle` fill. The fill alone is about
 * 1.1:1 against the popover, so the ring is the indicator (WCAG 1.4.11, 3:1 against `bg.surface`
 * and `bg.subtle`, both in the contrast gate).
 *
 * `value` is required and `children` is its text, which is also what the trigger shows once it is
 * selected. A `disabled` option is skipped by the arrow keys and by typing. The check
 * mark has a reserved slot, so the text does not move when the option is selected.
 */
const __Name__Item = ({ className, children, ...props }: __Name__ItemProps) => (
  <__Namespace__.Item
    {...props}
    data-slot="__name__-item"
    className={cn(
      "relative flex cursor-pointer items-center rounded-md py-2 pr-3 pl-8 outline-transparent select-none data-highlighted:bg-bg-subtle data-highlighted:outline-2 data-highlighted:outline-solid data-highlighted:-outline-offset-2 data-highlighted:outline-focus-ring data-disabled:cursor-not-allowed data-disabled:text-text-muted",
      className,
    )}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center text-brand-primary">
      <__Namespace__.ItemIndicator>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className="size-4"
        >
          <path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </__Namespace__.ItemIndicator>
    </span>
    <__Namespace__.ItemText>{children}</__Namespace__.ItemText>
  </__Namespace__.Item>
);

export type __Name__GroupProps = ComponentPropsWithRef<
  typeof __Namespace__.Group
>;

/** A set of related options. Its `__Name__.Label` names it for assistive technology. */
const __Name__Group = (props: __Name__GroupProps) => (
  <__Namespace__.Group {...props} data-slot="__name__-group" />
);

export type __Name__LabelProps = ComponentPropsWithRef<
  typeof __Namespace__.Label
>;

/** The heading of a `__Name__.Group`. The arrow keys skip it. */
const __Name__Label = ({ className, ...props }: __Name__LabelProps) => (
  <__Namespace__.Label
    {...props}
    data-slot="__name__-label"
    className={cn(
      "py-1 pr-3 pl-8 text-sm font-medium text-text-muted",
      className,
    )}
  />
);

export type __Name__SeparatorProps = ComponentPropsWithRef<
  typeof __Namespace__.Separator
>;

/** A line between groups. It is decorative and hidden from assistive technology. */
const __Name__Separator = ({ className, ...props }: __Name__SeparatorProps) => (
  <__Namespace__.Separator
    {...props}
    data-slot="__name__-separator"
    className={cn("my-1 h-px bg-border-decorative", className)}
  />
);

// Marked pure so a bundler can drop the whole compound when __Name__ is not imported.
export const __Name__ = /* @__PURE__ */ Object.assign(__Name__Root, {
  Item: __Name__Item,
  Group: __Name__Group,
  Label: __Name__Label,
  Separator: __Name__Separator,
});
