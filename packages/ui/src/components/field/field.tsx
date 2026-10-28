import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { useId, useLayoutEffect, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { FieldContext, useRequiredFieldContext } from "./field-context";

const DEFAULT_ORIENTATION = "vertical";

/**
 * Vertical stacks the parts in a column. Horizontal puts the control and the label side by side in
 * a two-column grid: the control (first in the DOM) in the narrow column, the label next to it, and
 * the description and error under the label. Placement is by grid flow, never reordered.
 */
const fieldVariants = cva("", {
  variants: {
    orientation: {
      vertical: "flex flex-col gap-1",
      horizontal: "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1",
    },
  },
  defaultVariants: { orientation: DEFAULT_ORIENTATION },
});

type FieldVariantProps = VariantProps<typeof fieldVariants>;

export type FieldProps = Omit<ComponentPropsWithRef<"div">, "id"> & {
  /**
   * Where the label goes. `vertical` (default) stacks label, control, description and error in
   * that order, as written. `horizontal` is for a checkbox, switch or radio option: write the
   * control first, then the label, so that the visual order and the DOM order match; the
   * description and error go under the label. Horizontal expects exactly one control.
   */
  orientation?: FieldVariantProps["orientation"];
  /** Id of the control. Defaults to a generated id; the label, description and error derive theirs from it. */
  id?: string;
  /** Marks the control as invalid: `aria-invalid` is set and the error is linked to it. */
  invalid?: boolean;
  /** Marks the control as required: `aria-required` is set and the label shows a marker. */
  required?: boolean;
  /** Disables the control and dims the label. */
  disabled?: boolean;
};

/**
 * Groups a form control with its label, description and error, and wires them together.
 * Use it around every form control. Do not use it for a control that already has a label
 * of its own, such as a button.
 *
 * The control inside keeps all its native attributes: `Input` accepts every native `<input>`
 * attribute and forwards it to the `<input>`, and `Field` only adds the `id`, `aria-describedby`,
 * `aria-invalid`, `aria-required` and `disabled` it needs. Native `<div>` props go to the root.
 */
const FieldRoot = ({
  orientation,
  id,
  invalid = false,
  required = false,
  disabled = false,
  className,
  children,
  ...props
}: FieldProps) => {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const [hasDescription, setHasDescription] = useState(false);

  return (
    <FieldContext
      value={{
        id: baseId,
        descriptionId: `${baseId}-description`,
        hasDescription,
        setHasDescription,
        errorId: `${baseId}-error`,
        invalid,
        required,
        disabled,
      }}
    >
      <div
        {...props}
        data-slot="field"
        data-orientation={orientation ?? DEFAULT_ORIENTATION}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(fieldVariants({ orientation }), className)}
      >
        {children}
      </div>
    </FieldContext>
  );
};

export type FieldLabelProps = Omit<
  ComponentPropsWithRef<typeof LabelPrimitive.Root>,
  "htmlFor"
>;

/** The name of the control. Rendered with `htmlFor` pointing at the control. */
const FieldLabel = ({ className, children, ...props }: FieldLabelProps) => {
  const field = useRequiredFieldContext("Field.Label");

  return (
    <LabelPrimitive.Root
      {...props}
      data-slot="field-label"
      htmlFor={field.id}
      className={cn(
        "box-border font-mono text-sm font-medium text-text-default in-data-[orientation=horizontal]:self-center",
        field.disabled && "text-text-muted",
        className,
      )}
    >
      {children}
      {field.required && (
        <span aria-hidden="true" className="text-text-danger">
          {" *"}
        </span>
      )}
    </LabelPrimitive.Root>
  );
};

export type FieldDescriptionProps = ComponentPropsWithRef<"p">;

/** Helper text under the control. It is read after the label when the control is focused. */
const FieldDescription = ({ className, ...props }: FieldDescriptionProps) => {
  const field = useRequiredFieldContext("Field.Description");
  const { setHasDescription } = field;

  // Tell the Field this element exists, before paint, so aria-describedby never points at nothing.
  useLayoutEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  return (
    <p
      {...props}
      data-slot="field-description"
      id={field.descriptionId}
      className={cn(
        "m-0 font-sans text-sm text-text-muted in-data-[orientation=horizontal]:col-start-2",
        className,
      )}
    />
  );
};

export type FieldErrorProps = ComponentPropsWithRef<"p">;

/**
 * The error message. Always render it and pass the message as children, or nothing while the
 * control is valid: the element is a live region, and a live region must already be in the page
 * for its changes to be announced. One line of space is reserved so that the message appearing
 * does not shift the layout; keep messages short, a message that wraps does shift it.
 */
const FieldError = ({ className, ...props }: FieldErrorProps) => {
  const field = useRequiredFieldContext("Field.Error");

  return (
    <p
      {...props}
      data-slot="field-error"
      id={field.errorId}
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "m-0 min-h-(--ds-text-sm-line-height) font-sans text-sm text-text-danger in-data-[orientation=horizontal]:col-start-2",
        className,
      )}
    />
  );
};

// Marked pure so a bundler can drop the whole compound when only `Input` is imported.
export const Field = /* @__PURE__ */ Object.assign(FieldRoot, {
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
});
