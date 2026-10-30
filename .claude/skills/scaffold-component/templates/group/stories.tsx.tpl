import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { Field } from "../field";
import { __Name__ } from "./__name__";
import type { __Name__Props } from "./__name__";

const OPTIONS = [
  { value: "one", label: "Option one", description: "The first option." },
  { value: "two", label: "Option two", description: "The second option." },
  { value: "three", label: "Option three", description: "The third option." },
] as const;

type ExampleFieldProps = __Name__Props & {
  invalid?: boolean;
  required?: boolean;
  disabledOption?: string;
  error?: string;
};

/** The composition every story uses: a Field for the group, and one horizontal Field per item. */
const ExampleField = ({
  invalid,
  required,
  disabledOption,
  error,
  ...props
}: ExampleFieldProps) => (
  <Field invalid={invalid} required={required}>
    <Field.Label>Choice</Field.Label>
    <__Name__ {...props}>
      {OPTIONS.map((option) => (
        <Field
          key={option.value}
          orientation="horizontal"
          disabled={option.value === disabledOption}
        >
          <__Name__.Item value={option.value} />
          <Field.Label>{option.label}</Field.Label>
          <Field.Description>{option.description}</Field.Description>
        </Field>
      ))}
    </__Name__>
    <Field.Description>You can change it later.</Field.Description>
    <Field.Error>{error}</Field.Error>
  </Field>
);

const meta = {
  title: "Form components/__Name__",
  component: __Name__,
  subcomponents: { "__Name__.Item": __Name__.Item },
  // The docs table cannot resolve the cva-derived `orientation` type, so its control is set by hand.
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
  },
  render: (args) => <ExampleField {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'SCAFFOLD-PLACEHOLDER: when to use __name__ and when not to. Inside a `Field`, the `Field.Label` names the group and `Field.Description` and `Field.Error` describe it; each item is a `__Name__.Item` in its own `<Field orientation="horizontal">`, item first. Tab moves into and out of the group (one tab stop); the arrow keys move between items and select them; Space selects the focused item.',
      },
    },
  },
} satisfies Meta<typeof __Name__>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { defaultValue: "two" } };

/** Items in a row that wraps. The Left and Right arrows move between them. */
export const Horizontal: Story = {
  args: { orientation: "horizontal", defaultValue: "one" },
};

/** One item is disabled: it cannot be selected and the arrow keys skip it. */
export const DisabledOption: Story = {
  render: (args) => (
    <ExampleField {...args} defaultValue="one" disabledOption="two" />
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "two" },
};

export const Invalid: Story = {
  render: (args) => (
    <ExampleField {...args} invalid required error="Choose an option" />
  ),
};

const ControlledExample = () => {
  const [value, setValue] = useState("one");

  return (
    <div className="flex flex-col gap-2">
      <ExampleField value={value} onValueChange={setValue} />
      <p className="m-0 font-sans text-sm text-text-muted">Value: {value}</p>
    </div>
  );
};

/** The value lives in React state: `value` and `onValueChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed, forced with the pseudo-states addon so that each one can be
 * reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <__Name__ aria-label="Pseudo-states" orientation="horizontal">
      <div id="pseudo-hover">
        <__Name__.Item value="hover" aria-label="Hover" />
      </div>
      <div id="pseudo-focus">
        <__Name__.Item value="focus" aria-label="Focus visible" />
      </div>
      <div id="pseudo-active">
        <__Name__.Item value="active" aria-label="Active" />
      </div>
    </__Name__>
  ),
  parameters: {
    pseudo: {
      hover: ["#pseudo-hover button"],
      focusVisible: ["#pseudo-focus button"],
      active: ["#pseudo-active button"],
    },
  },
};

/**
 * Keyboard: Tab lands on the selected item, the arrows move and select (skipping the disabled
 * item and wrapping at the end), and Tab leaves the group. Each arrow is held until Radix has
 * moved focus, as a person's key press is.
 */
export const KeyboardNavigation: Story = {
  render: (args) => (
    <ExampleField {...args} defaultValue="one" disabledOption="two" />
  ),
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const first = canvas.getByRole("__itemRole__", { name: "Option one" });
    const third = canvas.getByRole("__itemRole__", { name: "Option three" });

    await user.tab();
    await expect(first).toHaveFocus();

    await user.keyboard("{ArrowDown>}");
    await waitFor(() => expect(third).toHaveFocus());
    await user.keyboard("{/ArrowDown}");
    await expect(third).toBeChecked();

    await user.keyboard("{ArrowDown>}");
    await waitFor(() => expect(first).toHaveFocus());
    await user.keyboard("{/ArrowDown}");
    await expect(first).toBeChecked();
  },
};

/**
 * SCAFFOLD-PLACEHOLDER: replace this story with the real interaction flow of the component
 * (validation on submit, ...), then rename it and delete this comment. It only proves that the
 * component renders, so it is not a finished interaction story.
 */
export const InteractionPlaceholder: Story = {
  name: "PLACEHOLDER: replace with a real interaction",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("__role__")).toBeVisible();
  },
};
