__checklist__
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

/**
 * The drawn box, as in `Input` and `OtpInput`: border, background and focus ring live on the box,
 * which holds the control. The ring shows for keyboard focus inside it (`:focus-visible`), and the
 * control itself keeps a transparent outline so the browser does not draw a second ring. States
 * are `data-*` attributes on the box, styled with Tailwind data variants.
 */
const boxClasses = [
  "box-border flex h-10 w-full items-center rounded-lg border border-border-control bg-bg-input px-3 font-mono text-md text-text-default",
  "not-data-invalid:not-data-disabled:not-data-readonly:hover:border-brand-primary",
  "has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring",
  "data-invalid:border-border-danger",
  "data-readonly:bg-bg-subtle",
  "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
  "motion-safe:transition-[border-color]",
];

export type __Name__Props = ComponentPropsWithRef<"input"> & {
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * SCAFFOLD-PLACEHOLDER: write when to use this component and when to use another one.
 *
 * Import it from `@aleixvidal/ui/__name__`, its own entry point (see AGENTS.md section 5):
 * SCAFFOLD-PLACEHOLDER: say why (__dependency__ cannot be tree-shaken, or it is heavy) and, if
 * __dependency__ adds `<style>` elements, how to pass a CSP nonce.
 *
 * Inside a `Field` it is labelled, described and validated automatically; on its own it needs an
 * `aria-label` or an external label. All native `<input>` attributes are accepted and forwarded to
 * the `<input>`; `ref` goes to the `<input>` and `className` to the box around it.
 */
export const __Name__ = ({
  invalid,
  className,
  disabled,
  readOnly,
  ...props
}: __Name__Props) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });

  return (
    <div
      data-slot="__name__"
      data-invalid={state.invalid || undefined}
      data-disabled={state.disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(boxClasses, className)}
    >
      {/* SCAFFOLD-PLACEHOLDER: replace this input with the control built on __dependency__. */}
      <input
        {...props}
        id={state.id}
        disabled={state.disabled}
        readOnly={readOnly}
        aria-describedby={state["aria-describedby"]}
        aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
        aria-required={state["aria-required"] ?? props["aria-required"]}
        className="m-0 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-inherit outline-transparent [font:inherit] placeholder:text-text-placeholder disabled:cursor-not-allowed"
      />
    </div>
  );
};
