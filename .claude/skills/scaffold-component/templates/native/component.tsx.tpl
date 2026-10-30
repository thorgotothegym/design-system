__checklist__
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_SIZE = "md";

/**
 * The native `<__element__>` is its own box, so the border, background and focus ring are on the
 * element itself. States are `data-*` attributes set from props and styled with Tailwind data
 * variants, not cva variants. Only semantic tokens: no raw palette values, no arbitrary values.
 */
const __nameCamel__Variants = cva(
  [
    "m-0 box-border block w-full rounded-lg border border-border-control bg-bg-input px-3 py-2 font-mono text-text-default placeholder:text-text-placeholder",
    "not-data-invalid:not-data-disabled:not-data-readonly:hover:border-brand-primary",
    "not-data-invalid:not-data-disabled:not-data-readonly:active:border-brand-primary",
    "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    "data-invalid:border-border-danger",
    "data-readonly:bg-bg-subtle",
    "data-disabled:cursor-not-allowed data-disabled:bg-bg-subtle data-disabled:text-text-muted",
    "motion-safe:transition-[border-color]",
//#if textarea
    "resize-y",
//#endif
  ],
  {
    variants: {
      size: {
//#if input
        sm: "h-8 text-sm",
        md: "h-10 text-md",
        lg: "h-12 text-lg",
//#endif
//#if textarea
        sm: "text-sm",
        md: "text-md",
        lg: "text-lg",
//#endif
      },
    },
    defaultVariants: { size: DEFAULT_SIZE },
  },
);

type __Name__VariantProps = VariantProps<typeof __nameCamel__Variants>;

export type __Name__Props = Omit<ComponentPropsWithRef<"__element__">, "size"> & {
  /** Size of the control. The type comes from the cva variants, so it cannot drift. */
  size?: __Name__VariantProps["size"];
  /** Marks the value as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * SCAFFOLD-PLACEHOLDER: write when to use this component and when to use another one.
 *
 * Inside a `Field` it is labelled, described and validated automatically; on its own it needs an
 * `aria-label` or an external label. All native `<__element__>` attributes are accepted and
 * forwarded to the `<__element__>` (except `size`, which is replaced by the prop above). `ref` and
 * `className` go to the `<__element__>` too, since it is the only element.
 */
export const __Name__ = ({
  size,
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
    <__element__
      {...props}
      id={state.id}
      disabled={state.disabled}
      readOnly={readOnly}
      aria-describedby={state["aria-describedby"]}
      aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
      aria-required={state["aria-required"] ?? props["aria-required"]}
      data-slot="__name__"
      data-size={size ?? DEFAULT_SIZE}
      data-invalid={state.invalid || undefined}
      data-disabled={state.disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(__nameCamel__Variants({ size }), className)}
    />
  );
};
