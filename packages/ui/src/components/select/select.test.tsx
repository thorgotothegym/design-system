import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { Select } from "./select";
import type { SelectProps } from "./select";

type CountrySelectProps = Omit<SelectProps, "children">;

const CountryOptions = () => (
  <>
    <Select.Group>
      <Select.Label>Europe</Select.Label>
      <Select.Item value="es">Spain</Select.Item>
      <Select.Item value="pt" disabled>
        Portugal
      </Select.Item>
      <Select.Item value="fr">France</Select.Item>
    </Select.Group>
    <Select.Separator />
    <Select.Group>
      <Select.Label>Americas</Select.Label>
      <Select.Item value="pe">Peru</Select.Item>
      <Select.Item value="ca">Canada</Select.Item>
    </Select.Group>
  </>
);

const CountrySelect = (props: CountrySelectProps) => (
  <Select aria-label="Country" placeholder="Choose a country" {...props}>
    <CountryOptions />
  </Select>
);

type CountryFieldProps = CountrySelectProps & {
  fieldInvalid?: boolean;
  fieldRequired?: boolean;
  fieldDisabled?: boolean;
  error?: string;
};

const CountryField = ({
  fieldInvalid,
  fieldRequired,
  fieldDisabled,
  error,
  ...props
}: CountryFieldProps) => (
  <Field
    invalid={fieldInvalid}
    required={fieldRequired}
    disabled={fieldDisabled}
  >
    <Field.Label>Country</Field.Label>
    <Select placeholder="Choose a country" {...props}>
      <CountryOptions />
    </Select>
    <Field.Description>Where you pay taxes.</Field.Description>
    <Field.Error>{error}</Field.Error>
  </Field>
);

const ControlledCountry = ({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) => {
  const [value, setValue] = useState("es");

  return (
    <>
      <CountrySelect
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange(next);
        }}
      />
      <button type="button" onClick={() => setValue("")}>
        Reset
      </button>
    </>
  );
};

const FormExample = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { country: "" } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.country))}>
      <Controller
        control={control}
        name="country"
        render={({ field }) => (
          <CountrySelect
            ref={field.ref}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};

describe("Select", () => {
  it("should render a combo box that shows the placeholder", () => {
    render(<CountrySelect />);

    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent(
      "Choose a country",
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("data-placeholder");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("should show the selected option as its value", () => {
    render(<CountrySelect defaultValue="fr" />);

    expect(screen.getByRole("combobox", { name: "Country" })).toHaveTextContent(
      "France",
    );
    expect(screen.getByRole("combobox")).not.toHaveAttribute(
      "data-placeholder",
    );
  });

  it("should use the medium size by default", () => {
    render(<CountrySelect />);

    expect(screen.getByRole("combobox")).toHaveAttribute("data-size", "md");
  });

  it.each(["sm", "md", "lg"] as const)("should apply the %s size", (size) => {
    render(<CountrySelect size={size} />);

    expect(screen.getByRole("combobox")).toHaveAttribute("data-size", size);
  });

  it.each(["{Enter}", " ", "{ArrowDown}", "{ArrowUp}"])(
    "should open with the %s key",
    async (key) => {
      const user = userEvent.setup();
      render(<CountrySelect />);

      await user.tab();
      await user.keyboard(key);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { hidden: true })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    },
  );

  it("should open when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<CountrySelect />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should close with Escape without changing the value and return focus", async () => {
    const user = userEvent.setup();
    render(<CountrySelect defaultValue="es" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(screen.getByRole("combobox")).toHaveTextContent("Spain");
  });

  it("should focus the selected option when it opens", async () => {
    const user = userEvent.setup();
    render(<CountrySelect defaultValue="fr" />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("option", { name: "France" })).toHaveFocus();
    expect(screen.getByRole("option", { name: "France" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("should select an option with the arrow keys and Enter, then close", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CountrySelect defaultValue="es" onValueChange={onValueChange} />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("France");
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("fr");
  });

  it("should select an option when it is clicked", async () => {
    const user = userEvent.setup();
    render(<CountrySelect />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Canada" }));

    expect(screen.getByRole("combobox")).toHaveTextContent("Canada");
  });

  it("should skip a disabled option with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<CountrySelect defaultValue="es" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("option", { name: "Portugal" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("option", { name: "France" })).toHaveFocus();
  });

  it("should not select a disabled option when it is clicked", async () => {
    const user = userEvent.setup();
    render(<CountrySelect defaultValue="es" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Portugal" }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { hidden: true })).toHaveTextContent(
      "Spain",
    );
  });

  it("should select the matching option when typing while closed, as a native select does", async () => {
    const user = userEvent.setup();
    render(<CountrySelect />);

    await user.tab();
    await user.keyboard("c");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Canada");
  });

  it("should skip a disabled option when typing", async () => {
    const user = userEvent.setup();
    render(<CountrySelect />);

    await user.tab();
    await user.keyboard("p");

    expect(screen.getByRole("combobox")).toHaveTextContent("Peru");
  });

  it("should move focus to the matching option when typing while open", async () => {
    const user = userEvent.setup();
    render(<CountrySelect defaultValue="es" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("pe");

    expect(screen.getByRole("option", { name: "Peru" })).toHaveFocus();
  });

  it("should draw the highlighted option as a focus ring, not only a fill", async () => {
    const user = userEvent.setup();
    render(<CountrySelect defaultValue="es" />);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");

    // The fill alone is about 1.1:1 against the popover, so the inset ring is the indicator
    // (WCAG 1.4.11). jsdom loads no stylesheet, so the classes are what can be asserted.
    const highlighted = screen.getByRole("option", { name: "France" });
    expect(highlighted).toHaveAttribute("data-highlighted");
    expect(highlighted).toHaveClass(
      "data-highlighted:outline-2",
      "data-highlighted:outline-solid",
      "data-highlighted:-outline-offset-2",
      "data-highlighted:outline-focus-ring",
    );
  });

  it("should name each group with its label", async () => {
    const user = userEvent.setup();
    render(<CountrySelect />);

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("group", { name: "Europe" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Americas" })).toBeInTheDocument();
  });

  it("should not open or take focus when it is disabled", async () => {
    const user = userEvent.setup();
    render(<CountrySelect disabled />);

    await user.click(screen.getByRole("combobox"));
    await user.tab();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("combobox")).not.toHaveFocus();
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<CountrySelect invalid />);

    expect(screen.getByRole("combobox")).toBeInvalid();
    expect(screen.getByRole("combobox")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid or required by default", () => {
    render(<CountrySelect />);

    expect(screen.getByRole("combobox")).toBeValid();
    expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-required");
  });

  it("should be required when its own required prop is set", () => {
    render(<CountrySelect required />);

    expect(screen.getByRole("combobox")).toBeRequired();
  });

  it("should be labelled and described by the Field", () => {
    render(<CountryField />);

    expect(screen.getByLabelText("Country")).toBe(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Where you pay taxes.",
    );
  });

  it("should open when the Field label is clicked", async () => {
    const user = userEvent.setup();
    render(<CountryField />);

    await user.click(screen.getByText("Country"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should be required and invalid with the error linked when the Field says so", () => {
    render(
      <CountryField fieldInvalid fieldRequired error="Choose a country" />,
    );

    expect(screen.getByRole("combobox")).toBeRequired();
    expect(screen.getByRole("combobox")).toBeInvalid();
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Where you pay taxes. Choose a country",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(<CountryField fieldDisabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("should reflect and report changes when it is controlled, and show the placeholder again for an empty value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledCountry onValueChange={onValueChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Peru" }));

    expect(screen.getByRole("combobox")).toHaveTextContent("Peru");
    expect(onValueChange).toHaveBeenLastCalledWith("pe");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("combobox")).toHaveTextContent("Choose a country");
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.click(screen.getByRole("combobox", { name: "Country" }));
    await user.click(screen.getByRole("option", { name: "France" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("fr");
  });

  it("should give autoComplete to the hidden native select of a form, not to the trigger", () => {
    render(
      <form>
        <CountrySelect name="country" autoComplete="country-name" />
      </form>,
    );

    // The native select Radix renders for forms is aria-hidden and has no name, so it is the
    // combo box that only appears when hidden elements are included.
    const trigger = screen.getByRole("combobox", { name: "Country" });
    const [nativeSelect] = screen
      .getAllByRole("combobox", { hidden: true })
      .filter((element) => element !== trigger);
    expect(nativeSelect).toHaveAttribute("autocomplete", "country-name");
    expect(nativeSelect).toHaveAttribute("name", "country");
    expect(trigger).not.toHaveAttribute("autocomplete");
    expect(screen.getAllByRole("combobox")).toEqual([trigger]);
  });

  it("should forward the ref and className to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CountrySelect ref={ref} className="custom" />);

    expect(ref.current).toBe(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveClass("custom");
  });

  it("should pass native props to the trigger", () => {
    render(<CountrySelect title="Hint" />);

    expect(screen.getByRole("combobox")).toHaveAttribute("title", "Hint");
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Where you pay taxes.</p>
        <CountrySelect aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Where you pay taxes.",
    );
  });

  it.each([
    ["with a placeholder", {}],
    ["with a value", { defaultValue: "fr" }],
    ["small", { size: "sm" }],
    ["large", { size: "lg" }],
    ["disabled", { disabled: true }],
    [
      "invalid and required",
      { fieldInvalid: true, fieldRequired: true, error: "Choose a country" },
    ],
  ] as const)(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<CountryField {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<CountryField defaultValue="es" />);

    await user.click(screen.getByRole("combobox"));

    await expectNoA11yViolations();
  });
});
