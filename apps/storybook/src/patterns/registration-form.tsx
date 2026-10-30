import {
  Checkbox,
  Field,
  Input,
  RadioGroup,
  Select,
  Slider,
  Switch,
  TagInput,
  Textarea,
} from "@aleixvidal/ui";
import { DatePicker } from "@aleixvidal/ui/date-picker";
import { OtpInput } from "@aleixvidal/ui/otp-input";
import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";

/** The fictional event. Every date in the pattern comes from here (fixed, so stories do not change). */
export const EVENT = {
  name: "Interface Week",
  /** The earliest and latest arrival dates the form accepts. */
  arrivalFrom: "2027-03-13",
  arrivalUntil: "2027-03-19",
} as const;

/** A registered address, so the form can show a server error (stories use it). */
export const TAKEN_EMAIL = "taken@example.com";

/** The one-time code the verification step accepts in this demo. */
export const DEMO_CODE = "246810";

const formatDay = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));

const TICKETS = [
  {
    value: "standard",
    label: "Standard",
    description: "In person, all five days.",
  },
  {
    value: "student",
    label: "Student",
    description: "In person, with a valid student card.",
  },
  {
    value: "online",
    label: "Online",
    description: "Live stream and recordings only.",
  },
] as const;

const COUNTRIES = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Japan",
  "Kenya",
  "Mexico",
  "Spain",
  "United Kingdom",
  "United States",
];

export type RegistrationValues = {
  fullName: string;
  email: string;
  bio: string;
  ticket: string;
  country: string;
  arrival: string | null;
  interests: string[];
  experience: number[];
  updates: boolean;
  terms: boolean;
};

const EMPTY: RegistrationValues = {
  fullName: "",
  email: "",
  bio: "",
  ticket: "",
  country: "",
  arrival: null,
  interests: [],
  experience: [3],
  updates: false,
  terms: false,
};

/** A complete registration, for the stories that start filled in. */
export const FILLED: RegistrationValues = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  bio: "Front-end engineer. I like forms that tell you what went wrong.",
  ticket: "standard",
  country: "United Kingdom",
  arrival: "2027-03-14",
  interests: ["Design systems", "Accessibility"],
  experience: [4],
  updates: true,
  terms: true,
};

/** The fields that can be invalid, in the order they appear: the order of the error summary. */
const FIELD_ORDER = [
  "fullName",
  "email",
  "bio",
  "ticket",
  "country",
  "arrival",
  "interests",
  "terms",
] as const;

type ValidatedField = (typeof FIELD_ORDER)[number];

const fieldId = (name: string) => `registration-${name}`;

/** Resolves after `delay` milliseconds, or never: the "server" of the demo. */
const wait = (delay: number | "never") =>
  new Promise<void>((resolve) => {
    if (delay !== "never") setTimeout(resolve, delay);
  });

const focusRingClasses =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

type SubmitButtonProps = ComponentPropsWithRef<"button"> & {
  /** While a submission runs, the button stays focusable (`aria-disabled`) and ignores clicks. */
  busy?: boolean;
};

/**
 * STORY-LOCAL, NOT PART OF THE LIBRARY. `@aleixvidal/ui` has no Button on purpose (yet); this one
 * only exists so the pattern can be submitted. Semantic tokens only. While busy it uses
 * `aria-disabled` instead of `disabled`: disabling the focused button would drop focus to the page.
 */
const SubmitButton = ({
  busy,
  className,
  onClick,
  ...props
}: SubmitButtonProps) => (
  <button
    type="submit"
    {...props}
    aria-disabled={busy || undefined}
    onClick={(event) => {
      if (busy) event.preventDefault();
      else onClick?.(event);
    }}
    className={[
      "m-0 box-border inline-flex h-10 cursor-pointer items-center justify-center self-start rounded-lg border-0 bg-brand-primary px-4 font-mono text-md font-bold text-text-on-primary",
      focusRingClasses,
      "aria-disabled:cursor-progress",
      "disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-muted",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  />
);

/** A heading that takes focus when it appears after a step, so the next step is announced. */
const StepHeading = ({
  takeFocus,
  children,
}: {
  takeFocus: boolean;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (takeFocus) ref.current?.focus();
  }, [takeFocus]);

  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className={`m-0 font-mono text-xl font-bold text-text-default ${focusRingClasses}`}
    >
      {children}
    </h2>
  );
};

type ErrorSummaryProps = {
  errors: FieldErrors<RegistrationValues>;
  focusRequest: number;
  onSelect: (name: ValidatedField) => void;
};

/**
 * The problems after a failed submit, one link per invalid field, in the order of the form. It
 * appears only once a submit has failed (`focusRequest` above 0), so an error shown on blur does
 * not push the form down; then it takes focus after each failed submit, follows the errors as
 * they are fixed, and is hidden once there are none. Each link moves focus to its field.
 */
const ErrorSummary = ({
  errors,
  focusRequest,
  onSelect,
}: ErrorSummaryProps) => {
  const ref = useRef<HTMLElement>(null);
  const problems = FIELD_ORDER.flatMap((name) => {
    const message = errors[name]?.message;
    return typeof message === "string" ? [{ name, message }] : [];
  });

  useEffect(() => {
    if (focusRequest > 0) ref.current?.focus();
  }, [focusRequest]);

  if (focusRequest === 0 || problems.length === 0) return null;

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="registration-summary-heading"
      data-testid="error-summary"
      className={`box-border flex flex-col gap-2 rounded-lg border-2 border-border-danger p-4 ${focusRingClasses}`}
    >
      <h2
        id="registration-summary-heading"
        className="m-0 font-mono text-md font-bold text-text-default"
      >
        Fix {problems.length} {problems.length === 1 ? "problem" : "problems"}{" "}
        to continue
      </h2>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {problems.map(({ name, message }) => (
          <li key={name}>
            <a
              href={`#${fieldId(name)}`}
              onClick={(event) => {
                event.preventDefault();
                onSelect(name);
              }}
              className={`font-sans text-sm text-text-danger underline ${focusRingClasses}`}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

const sectionClasses = "m-0 flex min-w-0 flex-col gap-4 border-0 p-0";
const legendClasses = "mb-4 p-0 font-mono text-lg font-bold text-text-default";

export type RegistrationFormProps = {
  /** Values to start from, for the stories that start filled in. */
  defaultValues?: Partial<RegistrationValues>;
  /** `disabled` disables every control; `readOnly` makes every control read-only where it can be. */
  mode?: "editable" | "disabled" | "readOnly";
  /** The step to start on, for the stories that show a later step. */
  initialStep?: "details" | "verify" | "done";
  /** How long the demo "server" takes to answer, in milliseconds, or `"never"`. */
  submitDelay?: number | "never";
};

/**
 * A conference registration that composes the form components as a system: every control in a
 * `Field`, react-hook-form for state and validation, an error summary that takes focus after a
 * failed submit, a submitting state that keeps focus, and a second step with a one-time code.
 */
export const RegistrationForm = ({
  defaultValues,
  mode = "editable",
  initialStep = "details",
  submitDelay = 800,
}: RegistrationFormProps) => {
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(defaultValues?.email ?? FILLED.email);
  const [focusRequest, setFocusRequest] = useState(0);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationValues>({
    defaultValues: { ...EMPTY, ...defaultValues },
    mode: "onTouched",
    // The error summary takes focus instead, and links to each field.
    shouldFocusError: false,
  });

  const disabled = mode === "disabled" || isSubmitting;
  const readOnly = mode === "readOnly";
  // These five have no read-only mode (Radix offers none), so a read-only form disables them.
  const lockedInReadOnly = disabled || readOnly;

  const onValid = async (values: RegistrationValues) => {
    await wait(submitDelay);
    if (values.email === TAKEN_EMAIL) {
      setError("email", {
        type: "server",
        message: "That email is already registered: use another one",
      });
      setFocusRequest((count) => count + 1);
      return;
    }
    setEmail(values.email);
    setStep("verify");
  };

  if (step === "verify") {
    return (
      <VerifyStep
        email={email}
        takeFocus={initialStep !== "verify"}
        onVerified={() => setStep("done")}
      />
    );
  }

  if (step === "done") {
    return (
      <div className="flex max-w-xl flex-col gap-2">
        <StepHeading takeFocus={initialStep !== "done"}>
          You are registered
        </StepHeading>
        <p className="m-0 font-sans text-md text-text-default">
          See you at {EVENT.name}. Your ticket is on its way to {email}.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      aria-label={`Register for ${EVENT.name}`}
      aria-busy={isSubmitting || undefined}
      onSubmit={handleSubmit(onValid, () =>
        setFocusRequest((count) => count + 1),
      )}
      className="flex max-w-xl flex-col gap-8"
    >
      <ErrorSummary
        errors={errors}
        focusRequest={focusRequest}
        onSelect={(name) => setFocus(name)}
      />

      <fieldset className={sectionClasses}>
        <legend className={legendClasses}>About you</legend>
        <Field
          id={fieldId("fullName")}
          invalid={errors.fullName !== undefined}
          required
          disabled={disabled}
        >
          <Field.Label>Full name</Field.Label>
          <Input
            autoComplete="name"
            readOnly={readOnly}
            {...register("fullName", {
              required: "Enter your full name",
              minLength: { value: 2, message: "Enter at least 2 characters" },
              maxLength: { value: 80, message: "Use 80 characters or fewer" },
            })}
          />
          <Field.Error>{errors.fullName?.message}</Field.Error>
        </Field>

        <Field
          id={fieldId("email")}
          invalid={errors.email !== undefined}
          required
          disabled={disabled}
        >
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            autoComplete="email"
            readOnly={readOnly}
            {...register("email", {
              required: "Enter your email address",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter an email address like name@example.com",
              },
            })}
          />
          <Field.Description>We send your ticket here.</Field.Description>
          <Field.Error>{errors.email?.message}</Field.Error>
        </Field>

        <Field
          id={fieldId("bio")}
          invalid={errors.bio !== undefined}
          disabled={disabled}
        >
          <Field.Label>Short bio</Field.Label>
          <Textarea
            rows={3}
            readOnly={readOnly}
            {...register("bio", {
              maxLength: { value: 280, message: "Use 280 characters or fewer" },
            })}
          />
          <Field.Description>
            Optional. Shown on your badge page, up to 280 characters.
          </Field.Description>
          <Field.Error>{errors.bio?.message}</Field.Error>
        </Field>
      </fieldset>

      <fieldset className={sectionClasses}>
        <legend className={legendClasses}>Your ticket</legend>
        <Controller
          control={control}
          name="ticket"
          rules={{ required: "Choose a ticket type" }}
          render={({ field }) => (
            <Field
              id={fieldId("ticket")}
              invalid={errors.ticket !== undefined}
              required
              disabled={disabled}
            >
              <Field.Label>Ticket type</Field.Label>
              <RadioGroup
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={lockedInReadOnly}
              >
                {TICKETS.map((ticket, index) => (
                  <Field
                    key={ticket.value}
                    orientation="horizontal"
                    disabled={lockedInReadOnly}
                  >
                    {/* The group root cannot take focus; the first option is where a link to the field lands. */}
                    <RadioGroup.Item
                      value={ticket.value}
                      ref={index === 0 ? field.ref : undefined}
                    />
                    <Field.Label>{ticket.label}</Field.Label>
                    <Field.Description>{ticket.description}</Field.Description>
                  </Field>
                ))}
              </RadioGroup>
              <Field.Error>{errors.ticket?.message}</Field.Error>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="country"
          rules={{ required: "Choose your country" }}
          render={({ field }) => (
            <Field
              id={fieldId("country")}
              invalid={errors.country !== undefined}
              required
              disabled={disabled}
            >
              <Field.Label>Country</Field.Label>
              {/* No onBlur: opening the list moves focus out of the trigger, which would show the
                  error while the person is still choosing. The Select is checked on change and submit. */}
              <Select
                ref={field.ref}
                name={field.name}
                placeholder="Choose a country"
                value={field.value}
                onValueChange={field.onChange}
                disabled={lockedInReadOnly}
              >
                {COUNTRIES.map((country) => (
                  <Select.Item key={country} value={country}>
                    {country}
                  </Select.Item>
                ))}
              </Select>
              <Field.Description>For your invoice.</Field.Description>
              <Field.Error>{errors.country?.message}</Field.Error>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="arrival"
          rules={{
            // The field reports null both when it is empty and when it is only partly filled, so
            // one message covers both.
            required: "Enter a complete date (month, day and year)",
            validate: (value) =>
              value === null ||
              (value >= EVENT.arrivalFrom && value <= EVENT.arrivalUntil) ||
              `Choose a date from ${formatDay(EVENT.arrivalFrom)} to ${formatDay(EVENT.arrivalUntil)}`,
          }}
          render={({ field }) => (
            <Field
              id={fieldId("arrival")}
              invalid={errors.arrival !== undefined}
              required
              disabled={disabled}
            >
              <Field.Label>Arrival date</Field.Label>
              <DatePicker
                ref={field.ref}
                name={field.name}
                locale="en-US"
                min={EVENT.arrivalFrom}
                max={EVENT.arrivalUntil}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                readOnly={readOnly}
              />
              <Field.Description>
                From {formatDay(EVENT.arrivalFrom)} to{" "}
                {formatDay(EVENT.arrivalUntil)}.
              </Field.Description>
              <Field.Error>{errors.arrival?.message}</Field.Error>
            </Field>
          )}
        />
      </fieldset>

      <fieldset className={sectionClasses}>
        <legend className={legendClasses}>Preferences</legend>
        <Controller
          control={control}
          name="interests"
          rules={{
            validate: (value) =>
              value.length > 0 || "Add at least one interest",
          }}
          render={({ field }) => (
            <Field
              id={fieldId("interests")}
              invalid={errors.interests !== undefined}
              required
              disabled={disabled}
            >
              <Field.Label>Interests</Field.Label>
              <TagInput
                ref={field.ref}
                name={field.name}
                placeholder="Design systems"
                max={5}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                readOnly={readOnly}
              />
              <Field.Description>
                Up to 5. Press Enter or a comma after each one.
              </Field.Description>
              <Field.Error>{errors.interests?.message}</Field.Error>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="experience"
          render={({ field }) => (
            <Field id={fieldId("experience")} disabled={disabled}>
              <Field.Label>Experience with design systems</Field.Label>
              <Slider
                ref={field.ref}
                name={field.name}
                min={1}
                max={5}
                showValue
                formatValue={(value) => `${value} of 5`}
                value={field.value}
                onValueChange={field.onChange}
                disabled={lockedInReadOnly}
              />
              <Field.Description>
                1 is new to them, 5 is building one.
              </Field.Description>
              <Field.Error />
            </Field>
          )}
        />

        <Controller
          control={control}
          name="updates"
          render={({ field }) => (
            <Field orientation="horizontal" disabled={disabled}>
              <Switch
                ref={field.ref}
                name={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={lockedInReadOnly}
              />
              <Field.Label>Email me about the programme</Field.Label>
              <Field.Description>At most one email a week.</Field.Description>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="terms"
          rules={{
            validate: (value) => value || "Accept the terms to register",
          }}
          render={({ field }) => (
            <Field
              id={fieldId("terms")}
              orientation="horizontal"
              invalid={errors.terms !== undefined}
              required
              disabled={disabled}
            >
              <Checkbox
                ref={field.ref}
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={lockedInReadOnly}
              />
              <Field.Label>I accept the terms of attendance</Field.Label>
              <Field.Error>{errors.terms?.message}</Field.Error>
            </Field>
          )}
        />
      </fieldset>

      {mode === "editable" && (
        <div className="flex flex-col gap-2">
          <SubmitButton busy={isSubmitting}>Register</SubmitButton>
          {/* Its line is always there, so the text appearing moves nothing. */}
          <p
            role="status"
            className="m-0 min-h-(--ds-text-sm-line-height) font-sans text-sm text-text-muted"
          >
            {isSubmitting ? "Registering…" : ""}
          </p>
        </div>
      )}
    </form>
  );
};

type VerifyStepProps = {
  email: string;
  takeFocus: boolean;
  onVerified: () => void;
};

/** The second step: the one-time code sent by email. */
const VerifyStep = ({ email, takeFocus, onVerified }: VerifyStepProps) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<{ code: string }>({
    defaultValues: { code: "" },
    mode: "onTouched",
  });

  return (
    <form
      noValidate
      aria-label="Verify your email"
      onSubmit={handleSubmit(({ code }) => {
        if (code === DEMO_CODE) onVerified();
        else
          setError(
            "code",
            {
              message: "That code is not right: check the email and try again",
            },
            { shouldFocus: true },
          );
      })}
      className="flex max-w-xl flex-col gap-6"
    >
      <StepHeading takeFocus={takeFocus}>Check your email</StepHeading>
      <Controller
        control={control}
        name="code"
        rules={{
          validate: (value) => value.length === 6 || "Enter the 6-digit code",
        }}
        render={({ field }) => (
          <Field
            id={fieldId("code")}
            invalid={errors.code !== undefined}
            required
          >
            <Field.Label>Verification code</Field.Label>
            <OtpInput
              ref={field.ref}
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
            <Field.Description>
              We sent a 6-digit code to {email}. In this demo the code is{" "}
              {DEMO_CODE}.
            </Field.Description>
            <Field.Error>{errors.code?.message}</Field.Error>
          </Field>
        )}
      />
      <SubmitButton>Verify</SubmitButton>
    </form>
  );
};
