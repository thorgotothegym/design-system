import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/axe";
import { Field } from "../field";
import { TagInput } from "./tag-input";
import type { TagInputProps } from "./tag-input";

const ControlledTagInput = ({
  onValueChange,
}: {
  onValueChange: (value: string[]) => void;
}) => {
  const [value, setValue] = useState(["react"]);

  return (
    <TagInput
      aria-label="Skills"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
};

const LabelledTagInput = (props: TagInputProps) => (
  <Field>
    <Field.Label>Skills</Field.Label>
    <TagInput {...props} />
    <Field.Description>
      Press Enter or a comma after each one.
    </Field.Description>
    <Field.Error />
  </Field>
);

const FormExample = ({ onSubmit }: { onSubmit: (value: string[]) => void }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { skills: ["react"] },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.skills))}>
      <Controller
        control={control}
        name="skills"
        render={({ field }) => (
          <TagInput
            aria-label="Skills"
            ref={field.ref}
            value={field.value}
            onValueChange={field.onChange}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
};

const tagNames = () =>
  screen.queryAllByRole("listitem").map((item) => item.textContent);

describe("TagInput", () => {
  it("should render a textbox and no list while it has no tags", () => {
    render(<TagInput aria-label="Skills" />);

    expect(screen.getByRole("textbox", { name: "Skills" })).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("should render the initial tags as a named list", () => {
    render(<TagInput aria-label="Skills" defaultValue={["react", "css"]} />);

    expect(
      screen.getByRole("list", { name: "Added tags" }),
    ).toBeInTheDocument();
    expect(tagNames()).toEqual(["react", "css"]);
  });

  it("should add a tag with Enter and clear the input", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.type(screen.getByRole("textbox"), "react{Enter}");

    expect(tagNames()).toEqual(["react"]);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("should add a tag with a comma", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.type(screen.getByRole("textbox"), "react,css,");

    expect(tagNames()).toEqual(["react", "css"]);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("should trim a tag and ignore an empty one", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.type(screen.getByRole("textbox"), "  react  ,   ,");

    expect(tagNames()).toEqual(["react"]);
  });

  it("should add every value of pasted text", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("react, css\nhtml\tts");

    expect(tagNames()).toEqual(["react", "css", "html", "ts"]);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("should leave pasted text without separators in the input", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("react");

    expect(tagNames()).toEqual([]);
    expect(screen.getByRole("textbox")).toHaveValue("react");
  });

  it("should not submit the form with Enter while it has text, but should with an empty input", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <TagInput aria-label="Skills" />
        <button type="submit">Save</button>
      </form>,
    );

    await user.type(screen.getByRole("textbox"), "react{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("should remove the last tag with Backspace in an empty input", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react", "css"]} />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Backspace}");

    expect(tagNames()).toEqual(["react"]);
  });

  it("should do nothing with Backspace in an empty input when there are no tags", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Backspace}");

    expect(tagNames()).toEqual([]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("should delete text, not a tag, with Backspace when the input has text", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react"]} />);

    await user.type(screen.getByRole("textbox"), "cs{Backspace}");

    expect(tagNames()).toEqual(["react"]);
    expect(screen.getByRole("textbox")).toHaveValue("c");
  });

  it("should remove a tag with its button", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react", "css"]} />);

    await user.click(screen.getByRole("button", { name: "Remove react" }));

    expect(tagNames()).toEqual(["css"]);
  });

  it("should move focus to the tag that takes its place after removing one with its button", async () => {
    const user = userEvent.setup();
    render(
      <TagInput aria-label="Skills" defaultValue={["react", "css", "html"]} />,
    );

    await user.click(screen.getByRole("button", { name: "Remove react" }));

    expect(screen.getByRole("button", { name: "Remove css" })).toHaveFocus();
  });

  it("should move focus to the previous tag after removing the last one with its button", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react", "css"]} />);

    await user.click(screen.getByRole("button", { name: "Remove css" }));

    expect(screen.getByRole("button", { name: "Remove react" })).toHaveFocus();
  });

  it("should move focus to the input after removing the only tag", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react"]} />);

    await user.click(screen.getByRole("button", { name: "Remove react" }));

    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("should have one tab stop for the tags and move between them with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react", "css"]} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Remove react" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Remove css" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Remove react" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("should remove the focused tag with Backspace or Delete", async () => {
    const user = userEvent.setup();
    render(
      <TagInput aria-label="Skills" defaultValue={["react", "css", "html"]} />,
    );

    await user.tab();
    await user.keyboard("{Backspace}");
    await user.keyboard("{Delete}");

    expect(tagNames()).toEqual(["html"]);
  });

  it("should reject a duplicate, ignoring case, and keep what was typed", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["React"]} />);

    await user.type(screen.getByRole("textbox"), "react{Enter}");

    expect(tagNames()).toEqual(["React"]);
    expect(screen.getByRole("textbox")).toHaveValue("react");
    expect(screen.getByRole("status")).toHaveTextContent(
      "react is already added",
    );
  });

  it("should accept a duplicate when it is allowed", async () => {
    const user = userEvent.setup();
    render(
      <TagInput aria-label="Skills" defaultValue={["react"]} allowDuplicates />,
    );

    await user.type(screen.getByRole("textbox"), "react{Enter}");

    expect(tagNames()).toEqual(["react", "react"]);
  });

  it("should reject a tag at the maximum, stay enabled and announce it", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["a", "b"]} max={2} />);

    await user.type(screen.getByRole("textbox"), "c{Enter}");

    expect(tagNames()).toEqual(["a", "b"]);
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(screen.getByRole("textbox")).toHaveValue("c");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Maximum of 2 tags reached",
    );
  });

  it("should add only what fits when pasting past the maximum", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" max={2} />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("a, b, c");

    expect(tagNames()).toEqual(["a", "b"]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 tags added, 2 tags. Maximum of 2 tags reached",
    );
  });

  it("should announce an addition and a removal once, in the status region", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.type(screen.getByRole("textbox"), "react{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("react added, 1 tag");

    await user.keyboard("{Backspace}");
    expect(screen.getByRole("status")).toHaveTextContent(
      "react removed, 0 tags",
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("should change the announced text again when the same message repeats", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react"]} />);

    await user.type(screen.getByRole("textbox"), "react{Enter}");
    const first = screen.getByRole("status").textContent;
    await user.keyboard("{Enter}");

    expect(screen.getByRole("status").textContent).not.toBe(first);
  });

  it("should use its own messages", async () => {
    const user = userEvent.setup();
    render(
      <TagInput
        aria-label="Habilidades"
        defaultValue={["react"]}
        messages={{
          listLabel: "Etiquetas",
          remove: (tag) => `Quitar ${tag}`,
          added: (tag) => `${tag} añadida`,
        }}
      />,
    );

    await user.type(screen.getByRole("textbox"), "css{Enter}");

    expect(screen.getByRole("list", { name: "Etiquetas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quitar css" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("css añadida");
  });

  it("should reflect and report changes when it is controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledTagInput onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "css{Enter}");

    expect(tagNames()).toEqual(["react", "css"]);
    expect(onValueChange).toHaveBeenLastCalledWith(["react", "css"]);
  });

  it("should report the new list when it is uncontrolled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Skills" onValueChange={onValueChange} />);

    await user.type(screen.getByRole("textbox"), "react{Enter}");

    expect(onValueChange).toHaveBeenCalledWith(["react"]);
  });

  it("should not take focus, edit or show remove buttons when it is disabled", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react"]} disabled />);

    await user.tab();

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("textbox")).not.toHaveFocus();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(tagNames()).toEqual(["react"]);
    expect(screen.getByTestId("tag-input")).toHaveAttribute("data-disabled");
  });

  it("should show the tags without remove buttons and not edit them when it is read-only", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" defaultValue={["react"]} readOnly />);

    await user.click(screen.getByRole("textbox"));
    await user.keyboard("css{Enter}{Backspace}");

    expect(tagNames()).toEqual(["react"]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeEnabled();
  });

  it("should not add pasted tags when it is read-only", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" readOnly />);

    await user.click(screen.getByRole("textbox"));
    await user.paste("react, css");

    expect(tagNames()).toEqual([]);
  });

  it("should expose the invalid state to assistive technology", () => {
    render(<TagInput aria-label="Skills" invalid />);

    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByTestId("tag-input")).toHaveAttribute("data-invalid");
  });

  it("should not be invalid by default", () => {
    render(<TagInput aria-label="Skills" />);

    expect(screen.getByRole("textbox")).toBeValid();
  });

  it("should be labelled, described and required through the Field", () => {
    render(
      <Field required>
        <Field.Label>Skills</Field.Label>
        <TagInput />
        <Field.Description>Press Enter after each one.</Field.Description>
      </Field>,
    );

    expect(screen.getByLabelText(/Skills/)).toBe(screen.getByRole("textbox"));
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Press Enter after each one.",
    );
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("should be invalid with the error linked when the Field says so", () => {
    render(
      <Field invalid>
        <Field.Label>Skills</Field.Label>
        <TagInput />
        <Field.Error>Add at least one skill</Field.Error>
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeInvalid();
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Add at least one skill",
    );
  });

  it("should be disabled when the Field is disabled", () => {
    render(
      <Field disabled>
        <Field.Label>Skills</Field.Label>
        <TagInput />
      </Field>,
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should submit every tag under its name in a native form", () => {
    render(
      <form aria-label="Profile">
        <TagInput
          aria-label="Skills"
          name="skills"
          defaultValue={["react", "css"]}
        />
      </form>,
    );

    const data = new FormData(screen.getByRole("form", { name: "Profile" }));

    expect(data.getAll("skills")).toEqual(["react", "css"]);
  });

  it("should not submit the text being typed", async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Profile">
        <TagInput aria-label="Skills" name="skills" />
      </form>,
    );

    await user.type(screen.getByRole("textbox"), "draft");
    const data = new FormData(screen.getByRole("form", { name: "Profile" }));

    expect(data.getAll("skills")).toEqual([]);
  });

  it("should work with react-hook-form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormExample onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox"), "css{Enter}");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(["react", "css"]);
  });

  it("should focus the input when the box around it is pressed", async () => {
    const user = userEvent.setup();
    render(<TagInput aria-label="Skills" />);

    await user.click(screen.getByTestId("tag-input"));

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("should forward the ref to the input and className to the box", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TagInput aria-label="Skills" ref={ref} className="custom" />);

    expect(ref.current).toBe(screen.getByRole("textbox"));
    expect(screen.getByTestId("tag-input")).toHaveClass("custom");
    expect(screen.getByRole("textbox")).not.toHaveClass("custom");
  });

  it("should pass native props to the input and call their handlers", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <TagInput
        aria-label="Skills"
        placeholder="Add a skill"
        maxLength={20}
        onKeyDown={onKeyDown}
      />,
    );

    await user.type(screen.getByPlaceholderText("Add a skill"), "a");

    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "20");
    expect(onKeyDown).toHaveBeenCalled();
  });

  it("should keep its own aria-describedby when used on its own", () => {
    render(
      <>
        <p id="hint">Press Enter after each one.</p>
        <TagInput aria-label="Skills" aria-describedby="hint" />
      </>,
    );

    expect(screen.getByRole("textbox")).toHaveAccessibleDescription(
      "Press Enter after each one.",
    );
  });

  it.each<[string, TagInputProps]>([
    ["empty", {}],
    ["with tags", { defaultValue: ["react", "css"] }],
    ["disabled", { defaultValue: ["react"], disabled: true }],
    ["read-only", { defaultValue: ["react"], readOnly: true }],
    ["invalid", { defaultValue: ["react"], invalid: true }],
  ])(
    "should have no accessibility violations when %s",
    async (_name, props) => {
      render(<TagInput aria-label="Skills" {...props} />);

      await expectNoA11yViolations();
    },
  );

  it("should have no accessibility violations inside a Field with tags and an error", async () => {
    render(<LabelledTagInput defaultValue={["react", "css"]} invalid />);

    await expectNoA11yViolations();
  });
});
