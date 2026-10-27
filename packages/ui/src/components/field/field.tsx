import * as LabelPrimitive from "@radix-ui/react-label";
import { useId, useLayoutEffect, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { FieldContext, useRequiredFieldContext } from "./field-context";

export type FieldProps = Omit<ComponentPropsWithRef<"div">, "id"> & {
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
 * Use it around every form control. Do not use it for a control that already has a visible label
 * of its own, such as a button.
 */
const FieldRoot = ({
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
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn("flex flex-col gap-1", className)}
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

/** The visible name of the control. Rendered with `htmlFor` pointing at the control. */
const FieldLabel = ({ className, children, ...props }: FieldLabelProps) => {
  const field = useRequiredFieldContext("Field.Label");

  return (
    <LabelPrimitive.Root
      {...props}
      data-slot="field-label"
      htmlFor={field.id}
      className={cn(
        "box-border font-mono text-sm font-medium text-text-default",
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
      className={cn("m-0 font-sans text-sm text-text-muted", className)}
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
        "m-0 min-h-(--ds-text-sm-line-height) font-sans text-sm text-text-danger",
        className,
      )}
    />
  );
};

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
});
