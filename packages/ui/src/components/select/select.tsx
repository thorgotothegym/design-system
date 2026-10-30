import * as SelectPrimitive from "@radix-ui/react-select";
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
const triggerVariants = cva(
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
 * translate so that it does not change the measured size.
 */
const contentVariants = cva(
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

type SelectVariantProps = VariantProps<typeof triggerVariants>;

type SelectRootProps = ComponentPropsWithRef<typeof SelectPrimitive.Root>;

export type SelectProps = Omit<
  ComponentPropsWithRef<typeof SelectPrimitive.Trigger>,
  "children" | "value" | "defaultValue" | "dir" | "size"
> &
  Pick<
    SelectRootProps,
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
    /** The options: `Select.Item`, optionally inside `Select.Group` with a `Select.Label`, and `Select.Separator`. */
    children: ReactNode;
    /** Shown in the trigger while no option is selected. A controlled `value` of `""` shows it again. */
    placeholder?: ReactNode;
    /** Height and text size of the trigger and the list. The type comes from the cva variants. */
    size?: SelectVariantProps["size"];
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
 * A button that opens a list of options to pick one from. Use it for a single choice from a
 * list too long to show at once (more than about five options); use a RadioGroup when the
 * options should all stay visible, and a Checkbox group to pick several.
 *
 * When not to use: for a simple, flat list on a mobile-first form, a native `<select>` is usually
 * better: the platform's own picker is easier to use on a phone and costs no JavaScript.
 *
 * Inside a `Field` it is labelled, described and validated automatically; on its own it needs an
 * `aria-label` or an external label. It is announced as a combo box with the selected option as
 * its value. Enter, Space and the arrow keys open it; the arrows move between options, typing
 * jumps to a matching option (also while closed), Enter or Space selects, and Escape closes. Radix
 * handles focus, keyboard and ARIA. There is no clear button: to make it optional, add an option
 * such as "No preference", or set a controlled `value` back to `""` to show the placeholder.
 *
 * All native `<button>` attributes are accepted and forwarded to the trigger, as are Radix's
 * `value`, `defaultValue`, `onValueChange`, `open`, `defaultOpen`, `onOpenChange`, `name`,
 * `required`, `autoComplete`, `form` and `dir`; `ref` and `className` go to the trigger too.
 */
const SelectRoot = ({
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
}: SelectProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <SelectPrimitive.Root
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
      <SelectPrimitive.Trigger
        {...props}
        id={state.id}
        aria-describedby={state["aria-describedby"]}
        aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
        aria-required={
          state["aria-required"] ??
          props["aria-required"] ??
          (required || undefined)
        }
        data-slot="select"
        data-size={size ?? DEFAULT_SIZE}
        data-invalid={state.invalid || undefined}
        className={cn(triggerVariants({ size }), className)}
      >
        <span className="min-w-0 flex-1 truncate">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronIcon className="text-text-muted" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          data-slot="select-content"
          className={contentVariants({ size })}
        >
          <SelectPrimitive.ScrollUpButton className={scrollButtonClasses}>
            <ChevronIcon className="rotate-180" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {children}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className={scrollButtonClasses}>
            <ChevronIcon />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};

export type SelectItemProps = ComponentPropsWithRef<
  typeof SelectPrimitive.Item
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
const SelectItem = ({ className, children, ...props }: SelectItemProps) => (
  <SelectPrimitive.Item
    {...props}
    data-slot="select-item"
    className={cn(
      "relative flex cursor-pointer items-center rounded-md py-2 pr-3 pl-8 outline-transparent select-none data-highlighted:bg-bg-subtle data-highlighted:outline-2 data-highlighted:outline-solid data-highlighted:-outline-offset-2 data-highlighted:outline-focus-ring data-disabled:cursor-not-allowed data-disabled:text-text-muted",
      className,
    )}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center text-brand-primary">
      <SelectPrimitive.ItemIndicator>
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
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

export type SelectGroupProps = ComponentPropsWithRef<
  typeof SelectPrimitive.Group
>;

/** A set of related options. Its `Select.Label` names it for assistive technology. */
const SelectGroup = (props: SelectGroupProps) => (
  <SelectPrimitive.Group {...props} data-slot="select-group" />
);

export type SelectLabelProps = ComponentPropsWithRef<
  typeof SelectPrimitive.Label
>;

/** The heading of a `Select.Group`. The arrow keys skip it. */
const SelectLabel = ({ className, ...props }: SelectLabelProps) => (
  <SelectPrimitive.Label
    {...props}
    data-slot="select-label"
    className={cn(
      "py-1 pr-3 pl-8 text-sm font-medium text-text-muted",
      className,
    )}
  />
);

export type SelectSeparatorProps = ComponentPropsWithRef<
  typeof SelectPrimitive.Separator
>;

/** A line between groups. It is decorative and hidden from assistive technology. */
const SelectSeparator = ({ className, ...props }: SelectSeparatorProps) => (
  <SelectPrimitive.Separator
    {...props}
    data-slot="select-separator"
    className={cn("my-1 h-px bg-border-decorative", className)}
  />
);

// Marked pure so a bundler can drop the whole compound when Select is not imported.
export const Select = /* @__PURE__ */ Object.assign(SelectRoot, {
  Item: SelectItem,
  Group: SelectGroup,
  Label: SelectLabel,
  Separator: SelectSeparator,
});
