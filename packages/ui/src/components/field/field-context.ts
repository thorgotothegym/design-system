import { createContext, useContext } from "react";

export type FieldContextValue = {
  /** Id of the control, also the `htmlFor` of the label. The other ids derive from it. */
  id: string;
  descriptionId: string;
  /** True while a `Field.Description` is rendered, so the control only references an element that exists. */
  hasDescription: boolean;
  setHasDescription: (present: boolean) => void;
  errorId: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
};

export const FieldContext = createContext<FieldContextValue | undefined>(
  undefined,
);

/** The enclosing Field, or `undefined` when the control is used on its own. */
export const useFieldContext = () => useContext(FieldContext);

/** The enclosing Field. Throws when a Field part is rendered outside of one. */
export const useRequiredFieldContext = (part: string): FieldContextValue => {
  const field = useFieldContext();
  if (field === undefined) {
    throw new Error(`${part} must be rendered inside <Field>`);
  }
  return field;
};
