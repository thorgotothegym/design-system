import { OTPInput } from "input-otp";
import { useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { cn } from "../../lib/cn";
import { useFieldState } from "../field/use-field-state";

const DEFAULT_LENGTH = 6;

/** Letters and digits, or digits only: the `pattern` input-otp checks every change against. */
const PATTERNS = {
  numeric: "^\\d*$",
  alphanumeric: "^[a-zA-Z0-9]*$",
} as const;

/** Codes are often shown as "123 456" or "123-456": spaces and hyphens are dropped when pasting. */
const stripSeparators = (pasted: string) => pasted.replace(/[\s-]/g, "");

const isDevelopment =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

/**
 * One box per character, drawn over a single transparent `<input>` (that is how input-otp works),
 * so the browser sees one field: one tab stop, one caret and a working autofill and paste. Box
 * state is `data-*` attributes on the root, styled with Tailwind data variants, as in `Input`.
 * With forced colors, invalid is a dashed border, disabled is `GrayText` and the caret `CanvasText`.
 */
const slotClasses = [
  "relative box-border flex h-12 w-10 items-center justify-center rounded-lg border border-border-control bg-bg-input font-mono text-lg text-text-default",
  "data-hovering:border-brand-primary",
  "data-active:outline-2 data-active:outline-solid data-active:outline-offset-2 data-active:outline-focus-ring",
  "in-data-invalid:border-border-danger",
  "in-data-readonly:bg-bg-subtle",
  "in-data-disabled:cursor-not-allowed in-data-disabled:bg-bg-subtle in-data-disabled:text-text-muted",
  "forced-colors:in-data-invalid:border-dashed",
  "forced-colors:in-data-disabled:border-[GrayText] forced-colors:in-data-disabled:text-[GrayText]",
  "motion-safe:transition-[border-color]",
];

export type OtpInputProps = Omit<
  ComponentPropsWithRef<"input">,
  | "children"
  | "value"
  | "defaultValue"
  | "onChange"
  | "type"
  | "size"
  | "maxLength"
  | "pattern"
  | "inputMode"
  | "autoComplete"
> & {
  /** Controlled code. */
  value?: string;
  /** Initial code when the component manages its own state. */
  defaultValue?: string;
  /** Called with the new code (a string, not an event) as characters are typed, pasted or deleted. */
  onValueChange?: (value: string) => void;
  /** Called once with the code when every character has been entered. It does not submit anything. */
  onComplete?: (value: string) => void;
  /** Number of characters. */
  length?: number;
  /**
   * Splits the boxes into groups with a separator between them, such as `[3, 3]` for "123 – 456".
   * The sizes must add up to `length`; in development it throws when they do not.
   */
  groups?: number[];
  /** `numeric` (default) accepts digits and opens the numeric keypad; `alphanumeric` accepts letters and digits. */
  type?: "numeric" | "alphanumeric";
  /** Marks the code as invalid. Inside a `Field`, the Field's `invalid` is used as well. */
  invalid?: boolean;
};

/**
 * A field for a one-time code, such as the six digits sent by SMS or an authenticator. Use it for
 * a short code of a set length; use an Input for anything else.
 *
 * Import it from `@aleixvidal/ui/otp-input`, its own entry point (see AGENTS.md section 5).
 *
 * It is one logical field: a single text input (with `autocomplete="one-time-code"`, so a code
 * received by SMS can be filled in from the keyboard suggestion) that a screen reader announces
 * once, with the name from the `Field.Label`. The boxes are only drawn over it and are hidden from
 * assistive technology. Typing moves along, Backspace deletes, the arrows, Home and End move the
 * caret, and pasting a whole code fills every box (spaces and hyphens are removed). Announce the
 * result of checking the code in the `Field.Error`, which is already a live region; this control
 * announces nothing on its own.
 *
 * Inside a `Field` it is labelled, described and validated automatically; on its own it needs an
 * `aria-label` or an external label. All native `<input>` attributes are accepted and forwarded
 * to the `<input>`, except `value`, `defaultValue`, `onChange`, `type`, `size`, `maxLength`,
 * `pattern`, `inputMode` and `autoComplete`, which the props above replace. A strict
 * Content-Security-Policy needs `nonce`: see the note in the Storybook docs. `ref` goes to the
 * `<input>`; `className` goes to the box around it.
 */
export const OtpInput = ({
  value,
  defaultValue,
  onValueChange,
  onComplete,
  length = DEFAULT_LENGTH,
  groups = [length],
  type = "numeric",
  invalid,
  className,
  disabled,
  readOnly,
  ...props
}: OtpInputProps) => {
  const state = useFieldState({
    id: props.id,
    invalid,
    disabled,
    "aria-describedby": props["aria-describedby"],
  });
  const [ownValue, setOwnValue] = useState(defaultValue ?? "");

  if (isDevelopment && groups.reduce((sum, size) => sum + size, 0) !== length) {
    throw new Error(
      `OtpInput: groups [${groups.join(", ")}] add up to ${groups.reduce((sum, size) => sum + size, 0)}, but length is ${length}`,
    );
  }

  return (
    <div
      data-slot="otp-input"
      data-type={type}
      data-invalid={state.invalid || undefined}
      data-disabled={state.disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn("flex w-fit", className)}
    >
      <OTPInput
        {...props}
        id={state.id}
        maxLength={length}
        value={value ?? ownValue}
        onChange={(next) => {
          setOwnValue(next);
          onValueChange?.(next);
        }}
        onComplete={onComplete}
        pattern={PATTERNS[type]}
        inputMode={type === "numeric" ? "numeric" : "text"}
        autoComplete="one-time-code"
        pasteTransformer={stripSeparators}
        disabled={state.disabled}
        readOnly={readOnly}
        aria-describedby={state["aria-describedby"]}
        aria-invalid={state["aria-invalid"] ?? props["aria-invalid"]}
        aria-required={state["aria-required"] ?? props["aria-required"]}
        // input-otp makes the input's text transparent; forced colors would paint it over the boxes.
        className="forced-color-adjust-none"
        containerClassName="flex items-center gap-2"
        render={({ slots, isHovering }) => {
          let position = 0;

          return groups.map((size, group) => {
            const groupSlots = slots.slice(position, position + size);
            position += size;

            return (
              <div
                // Groups are set by `groups`, so the position is a stable identity.
                key={group}
                data-slot="otp-input-group"
                className="flex items-center gap-2"
              >
                {group > 0 && (
                  <span
                    aria-hidden="true"
                    className="flex w-3 justify-center font-mono text-lg text-text-muted"
                  >
                    –
                  </span>
                )}
                {groupSlots.map((slot, index) => (
                  <div
                    key={position - size + index}
                    aria-hidden="true"
                    data-slot="otp-input-slot"
                    data-active={slot.isActive || undefined}
                    data-hovering={isHovering || undefined}
                    className={cn(slotClasses)}
                  >
                    {slot.char}
                    {slot.hasFakeCaret && (
                      <span className="absolute h-5 w-px bg-text-default motion-safe:animate-pulse forced-colors:bg-[CanvasText]" />
                    )}
                  </div>
                ))}
              </div>
            );
          });
        }}
      />
    </div>
  );
};
