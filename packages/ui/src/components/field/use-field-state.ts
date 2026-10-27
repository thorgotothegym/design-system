import { useFieldContext } from "./field-context";

type FieldStateOptions = {
  /** The control's own `id`. Ignored inside a Field, whose id must match the label. */
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** The control's own `aria-describedby`, appended after the Field's ids. */
  "aria-describedby"?: string;
};

/**
 * Merges the state of the enclosing Field (if any) with a control's own props, and returns the
 * attributes that wire the control to its label, description and error. Every form control calls
 * this, so they all behave the same inside a Field and on their own.
 */
export const useFieldState = (options: FieldStateOptions) => {
  const field = useFieldContext();
  const invalid = Boolean(options.invalid) || Boolean(field?.invalid);
  const describedBy = [
    field?.hasDescription ? field.descriptionId : undefined,
    invalid ? field?.errorId : undefined,
    options["aria-describedby"],
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: field?.id ?? options.id,
    invalid,
    disabled: Boolean(options.disabled) || Boolean(field?.disabled),
    "aria-describedby": describedBy === "" ? undefined : describedBy,
    "aria-invalid": invalid ? (true as const) : undefined,
    "aria-required": field?.required ? (true as const) : undefined,
  };
};
