import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_SIZE = "md";

/**
 * The drawn box: border, background and focus ring live on the wrapper, so a prefix and a
 * suffix sit inside the same box as the `<input>`. States are `data-*` attributes set from props
 * and styled with Tailwind data variants, not cva variants.
 */
const inputVariants = cva(
  [
    "box-border flex w-full items-center gap-2 rounded-lg border border-border-control bg-bg-input px-3 font-mono text-text-default",
    "not-data-invalid:not-data-disabled:not-data-readonly:hover:border-brand-primary",
    "not-data-invalid:not-data-disabled:not-data-readonly:active:border-brand-primary",
    "has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring",
    "data-invalid:border-border-danger",
    "data-readonly:bg-bg-subtle",
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

type InputVariantProps = VariantProps<typeof inputVariants>;

export type InputProps = Omit<
  ComponentPropsWithRef<"input">,
  "size" | "prefix"
> & {
  /** Height and text size of the input. The type comes from the cva variants, so it cannot drift. */
  size?: InputVariantProps["size"];
  /** Content before the value, such as a `$` prompt. Decorative content should be `aria-hidden`. */
  prefix?: ReactNode;
  /** Content after the value, such as a unit or a clear button. Interactive content stays clickable. */
  suffix?: ReactNode;
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
  /**
   * An asynchronous check or format is in progress. The input stays editable (it is not
   * disabled); it gets `aria-busy` and a spinner. Announce the result through `Field.Error`.
   */
  loading?: boolean;
};

/** Focuses the input when the box itself (padding, prefix) is pressed, as a native input would. */
const focusInput = (event: MouseEvent<HTMLDivElement>) => {
  const target = event.target;
  if (
    !(target instanceof Element) ||
    target.closest("input, button, a, select, textarea, [tabindex]")
  ) {
    return;
  }
  event.preventDefault();
  event.currentTarget.querySelector("input")?.focus();
};

const Spinner = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    className="size-4 shrink-0 animate-spin text-text-muted motion-reduce:animate-none"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="3"
      opacity="0.25"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * A single-line text input. Use it for short free text; use a Textarea for long text and a Select
 * for a closed set of choices. Inside a `Field` it is labelled, described and validated
 * automatically; on its own it needs an `aria-label` or an external label.
 *
 * All native `<input>` attributes are accepted and forwarded to the `<input>` (`type`, `name`,
 * `value`, `placeholder`, `autoComplete`, `inputMode`, `aria-*` and so on), except `size` and
 * `prefix`, which are replaced by the props below. `ref` goes to the `<input>` too; `className`
 * goes to the box around it.
 */
export const Input = ({
  size,
  prefix,
  suffix,
  invalid,
  loading = false,
  className,
  disabled,
  readOnly,
  ...props
}: InputProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <div
      data-slot="input"
      data-size={size ?? DEFAULT_SIZE}
      data-invalid={state.invalid || undefined}
      data-disabled={state.disabled || undefined}
      data-readonly={readOnly || undefined}
      data-loading={loading || undefined}
      className={cn(inputVariants({ size }), className)}
      onMouseDown={focusInput}
    >
      {prefix !== undefined && (
        <span className="flex shrink-0 items-center text-text-muted">
          {prefix}
        </span>
      )}
      <input
        {...props}
        id={state.id}
        disabled={state.disabled}
        readOnly={readOnly}
        aria-describedby={state["aria-describedby"]}
        aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
        aria-required={state["aria-required"] ?? props["aria-required"]}
        aria-busy={loading || undefined}
        className="m-0 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-inherit outline-transparent [font:inherit] placeholder:text-text-placeholder disabled:cursor-not-allowed"
      />
      {suffix !== undefined && (
        <span className="flex shrink-0 items-center text-text-muted">
          {suffix}
        </span>
      )}
      {loading && <Spinner />}
    </div>
  );
};
