import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { Field } from "../field";
import { TagInput } from "./tag-input";

const meta = {
  title: "Form components/TagInput",
  component: TagInput,
  args: { "aria-label": "Skills", placeholder: "Add a skill" },
  argTypes: {
    value: { control: "object" },
    defaultValue: { control: "object" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A text field that turns what is typed into removable tags. Use it for a free list of short values such as keywords or email recipients. Use a Select for a closed set of choices and a Textarea for prose. Enter or a comma adds a tag; pasting text with commas or new lines adds several. Backspace in an empty input removes the last tag. Each tag has a button to remove it; the buttons are one tab stop and the arrow keys move between them. The list of tags is not rendered while it is empty. Additions, removals and rejected duplicates are announced once through a polite status region. At the maximum the input stays enabled and rejects with an announcement. Inside a `Field` it is labelled, described and validated automatically; on its own it needs an `aria-label`. With `name`, a native form submits one value per tag.",
      },
    },
  },
} satisfies Meta<typeof TagInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: ["react", "css", "a11y"] },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ["react", "css"] },
};

/** The tags are shown without remove buttons and nothing can be added. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: ["react", "css"] },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: ["react"] },
};

/** More tags than fit on a line wrap onto the next one; the box grows with them. */
export const Wrapping: Story = {
  args: {
    defaultValue: [
      "typescript",
      "accessibility",
      "design systems",
      "testing library",
      "storybook",
      "tokens",
      "radix",
    ],
  },
};

const ControlledExample = () => {
  const [tags, setTags] = useState(["react", "css"]);

  return (
    <div className="flex flex-col gap-2">
      <TagInput
        aria-label="Skills"
        placeholder="Add a skill"
        value={tags}
        onValueChange={setTags}
      />
      <p className="m-0 font-sans text-sm text-text-muted">
        Tags: {tags.length === 0 ? "(none)" : tags.join(", ")}
      </p>
    </div>
  );
};

/** The tags live in React state: `value` and `onValueChange`. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover and keyboard focus on the box, and hover and focus on a tag's remove button, forced with
 * the pseudo-states addon so that each one can be reviewed without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div id="pseudo-hover">
        <TagInput aria-label="Hover" defaultValue={["react"]} />
      </div>
      <div id="pseudo-focus">
        <TagInput aria-label="Focus visible" defaultValue={["react"]} />
      </div>
      <div id="pseudo-tag-hover">
        <TagInput aria-label="Tag hover" defaultValue={["react"]} />
      </div>
      <div id="pseudo-tag-focus">
        <TagInput aria-label="Tag focus" defaultValue={["react"]} />
      </div>
    </div>
  ),
  parameters: {
    pseudo: {
      hover: [
        "#pseudo-hover [data-slot=tag-input]",
        "#pseudo-tag-hover button",
      ],
      focusVisible: ["#pseudo-focus input", "#pseudo-tag-focus button"],
    },
  },
};

/** A native form submits one value per tag under `name`. Email recipients, with a description. */
export const WithField: Story = {
  render: () => (
    <Field>
      <Field.Label>Recipients</Field.Label>
      <TagInput
        name="recipients"
        placeholder="name@example.com"
        defaultValue={["ada@example.com"]}
      />
      <Field.Description>
        Press Enter or a comma after each address, or paste a list.
      </Field.Description>
      <Field.Error />
    </Field>
  ),
};

/**
 * Keyboard, step by step: type and press Enter or a comma to add, Backspace in the empty input
 * removes the last tag, Shift+Tab reaches the tags (one tab stop), the arrows move between their
 * remove buttons, and Delete removes the focused tag. Each change is announced once in the status
 * region.
 */
export const KeyboardNavigation: Story = {
  render: () => <TagInput aria-label="Skills" placeholder="Add a skill" />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Skills" });
    const status = canvas.getByRole("status");

    await user.click(input);
    await user.type(input, "react{Enter}");
    await expect(status).toHaveTextContent("react added, 1 tag");

    await user.type(input, "css,");
    await user.type(input, "html,");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);

    await user.keyboard("{Backspace}");
    await expect(status).toHaveTextContent("html removed, 2 tags");

    await user.tab({ shift: true });
    await expect(
      canvas.getByRole("button", { name: "Remove react" }),
    ).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    await expect(
      canvas.getByRole("button", { name: "Remove css" }),
    ).toHaveFocus();

    await user.keyboard("{Delete}");
    await expect(status).toHaveTextContent("css removed, 1 tag");
    await expect(
      canvas.getByRole("button", { name: "Remove react" }),
    ).toHaveFocus();
  },
};

/** Typing a tag that is already there (ignoring case) is rejected and announced; the text stays to be edited. */
export const DuplicateRejected: Story = {
  args: { defaultValue: ["React"] },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Skills" });

    await user.type(input, "react{Enter}");

    await expect(canvas.getAllByRole("listitem")).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "react is already added",
    );
    await expect(input).toHaveValue("react");
  },
};

/** At the maximum the input stays enabled and rejects the tag with an announcement. */
export const MaxCountReached: Story = {
  args: { max: 3, defaultValue: ["react", "css", "html"] },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Skills" });

    await expect(input).toBeEnabled();
    await user.type(input, "ts{Enter}");

    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Maximum of 3 tags reached",
    );
    await expect(input).toBeEnabled();
  },
};

/** Pasting a list adds each value: commas, new lines and tabs separate them. */
export const Pasting: Story = {
  args: { defaultValue: [] },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);

    await user.click(canvas.getByRole("textbox", { name: "Skills" }));
    await user.paste("react, css\nhtml");

    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "3 tags added, 3 tags",
    );
  },
};

const ValidationExample = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && tags.length === 0;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field invalid={invalid} required>
        <Field.Label>Skills</Field.Label>
        <TagInput
          value={tags}
          onValueChange={setTags}
          placeholder="Add a skill"
        />
        <Field.Description>At least one.</Field.Description>
        <Field.Error>{invalid ? "Add at least one skill" : null}</Field.Error>
      </Field>
      <button type="submit" className="self-start">
        Save
      </button>
    </form>
  );
};

/** Required: saving with no tags shows the error, linked to the input; adding a tag clears it. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /Skills/ });

    await user.click(canvas.getByRole("button", { name: "Save" }));
    await expect(input).toBeInvalid();
    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription(
      "At least one. Add at least one skill",
    );

    await user.type(input, "react{Enter}");
    await expect(input).toBeValid();
    await expect(input).toHaveAccessibleDescription("At least one.");
  },
};
