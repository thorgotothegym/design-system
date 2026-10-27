import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_SIZE = "md";

/**
 * The `<textarea>` is its own box (there is no prefix or suffix to share it with), so the border,
 * background and focus ring are on the element itself. States are `data-*` attributes set from
 * props and styled with Tailwind data variants, as in `Input`.
 */
const textareaVariants = cva(
  [
    "m-0 box-border block w-full resize-y rounded-lg border border-border-control bg-bg-input px-3 py-2 font-mono text-text-default placeholder:text-text-placeholder",
    "not-data-invalid:not-data-disabled:not-data-readonly:hover:border-brand-primary",
    "not-data-invalid:not-data-disabled:not-data-readonly:active:border-brand-primary",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    "data-invalid:border-border-danger",
    "data-readonly:bg-bg-subtle",
    "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
    "motion-safe:transition-[border-color]",
  ],
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-md",
        lg: "text-lg",
      },
      // `field-sizing: content` grows the box with its text with no script, so the layout never
      // jumps. Where it is not supported the textarea keeps its rows and its resize handle.
      autoGrow: {
        true: "min-h-24 field-sizing-content supports-[field-sizing:content]:resize-none",
        false: "",
      },
    },
    defaultVariants: { size: DEFAULT_SIZE, autoGrow: false },
  },
);

type TextareaVariantProps = VariantProps<typeof textareaVariants>;

export type TextareaProps = Omit<ComponentPropsWithRef<"textarea">, "size"> & {
  /** Text size of the textarea. The type comes from the cva variants, so it cannot drift. */
  size?: TextareaVariantProps["size"];
  /**
   * Grow with the text instead of scrolling. Set a maximum height with `className` (for example
   * `max-h-64`); past it the textarea scrolls. Browsers without `field-sizing` keep `rows` and
   * the resize handle.
   */
  autoGrow?: TextareaVariantProps["autoGrow"];
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * A multi-line text input. Use it for long free text such as a message or a description; use an
 * Input for a single line. Inside a `Field` it is labelled, described and validated
 * automatically; on its own it needs an `aria-label` or an external label.
 *
 * All native `<textarea>` attributes are accepted and forwarded to the `<textarea>` (`rows`,
 * `name`, `value`, `placeholder`, `maxLength`, `aria-*` and so on), except `size`, which is
 * replaced by the prop below. `ref` and `className` go to the `<textarea>` too, since it is the
 * only element. By default it can be resized vertically.
 */
export const Textarea = ({
  size,
  autoGrow,
  invalid,
  className,
  disabled,
  readOnly,
  ...props
}: TextareaProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <textarea
      rows={3}
      {...props}
      id={state.id}
      disabled={state.disabled}
      readOnly={readOnly}
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
      aria-required={state["aria-required"] ?? props["aria-required"]}
      data-slot="textarea"
      data-size={size ?? DEFAULT_SIZE}
      data-invalid={state.invalid || undefined}
      data-disabled={state.disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(textareaVariants({ size, autoGrow }), className)}
    />
  );
};
