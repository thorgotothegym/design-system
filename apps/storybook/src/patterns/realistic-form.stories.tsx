import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { startDemo } from "./demo";
import {
  DEMO_CODE,
  FILLED,
  RegistrationForm,
  TAKEN_EMAIL,
} from "./registration-form";

const meta = {
  title: "Patterns/Realistic form",
  component: RegistrationForm,
  // The page for this pattern is realistic-form.mdx, not the generated one.
  tags: ["!autodocs"],
  // Fast answers from the demo "server" unless a story needs to show the wait.
  args: { submitDelay: 0 },
} satisfies Meta<typeof RegistrationForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The form is the one page-sized layout in the Storybook, so Chromatic also captures it at 320px
 * (the narrowest phone width WCAG reflow asks for), in the dark theme. Only these two stories:
 * every extra mode multiplies the snapshot count.
 */
const narrowMode = {
  chromatic: { modes: { "narrow dark": { theme: "dark", viewport: 320 } } },
};

/**
 * The fields that ask for the person's own data declare their purpose (WCAG 1.3.5), so the browser
 * can fill them in: `name`, `email`, and `country-name` on the native select that the Select renders
 * for forms. The play function only reads, so the snapshot is the untouched form.
 */
export const Default: Story = {
  parameters: narrowMode,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const country = canvas.getByRole("combobox", { name: /Country/ });
    // That native select is aria-hidden and has no name: it is the combo box that only appears
    // when hidden elements are included.
    const [nativeCountry] = canvas
      .getAllByRole("combobox", { hidden: true })
      .filter((element) => element !== country);

    await expect(
      canvas.getByRole("textbox", { name: /Full name/ }),
    ).toHaveAttribute("autocomplete", "name");
    await expect(
      canvas.getByRole("textbox", { name: /Email/ }),
    ).toHaveAttribute("autocomplete", "email");
    await expect(nativeCountry).toHaveAttribute("autocomplete", "country-name");
  },
};

/**
 * Submitted with the arrival date only partly typed and everything else empty: the error summary
 * takes focus and lists every problem in the order of the form, each linked to its field. The
 * date's message is the same for an empty and a partly filled date, since both report no date.
 */
export const WithErrors: Story = {
  parameters: narrowMode,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // An error shown on blur stays on its field: the summary only appears after a submit.
    await userEvent.click(canvas.getByRole("textbox", { name: /Full name/ }));
    await userEvent.tab();
    await expect(
      await canvas.findByText("Enter your full name", { selector: "p" }),
    ).toBeVisible();
    await expect(canvas.queryByRole("region")).toBeNull();

    await userEvent.click(canvas.getByRole("spinbutton", { name: /^month/ }));
    await userEvent.keyboard("03");
    await userEvent.click(canvas.getByRole("button", { name: "Register" }));

    const summary = await canvas.findByRole("region", {
      name: "Fix 7 problems to continue",
    });
    // The summary takes focus in an effect, after it has rendered.
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(
      within(summary)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual([
      "Enter your full name",
      "Enter your email address",
      "Choose a ticket type",
      "Choose your country",
      "Enter a complete date (month, day and year)",
      "Add at least one interest",
      "Accept the terms to register",
    ]);
    await expect(
      canvas.getByRole("group", { name: "Arrival date" }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(summary).getByRole("link", { name: /complete date/ }),
    );
    await expect(
      canvas.getByRole("spinbutton", { name: /^month/ }),
    ).toHaveFocus();

    await userEvent.click(
      within(summary).getByRole("link", { name: "Choose a ticket type" }),
    );
    await expect(canvas.getByRole("radio", { name: /Standard/ })).toHaveFocus();
  },
};

/** The demo server knows this address: the error comes back on the field and in the summary. */
export const ServerError: Story = {
  args: { defaultValues: { ...FILLED, email: TAKEN_EMAIL } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Register" }));

    const summary = await canvas.findByRole("region", {
      name: "Fix 1 problem to continue",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(
      canvas.getByRole("textbox", { name: /Email/ }),
    ).toHaveAccessibleDescription(
      /That email is already registered: use another one/,
    );
  },
};

/**
 * Filled in with the pointer and the keyboard, at a readable pace, then submitted: the form waits
 * for the demo server and moves to the verification step. Not snapshotted: its end state is the
 * verification step, and the pace is what this story is for.
 */
export const FilledAndSubmitted: Story = {
  args: { submitDelay: 800 },
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);

    await user.type(
      canvas.getByRole("textbox", { name: /Full name/ }),
      "Ada Byron",
    );
    await user.type(
      canvas.getByRole("textbox", { name: /Email/ }),
      "ada@example.org",
    );
    await user.click(canvas.getByRole("radio", { name: /Online/ }));
    await user.click(canvas.getByRole("combobox", { name: /Country/ }));
    await user.click(
      await within(document.body).findByRole("option", { name: "Canada" }),
    );
    await user.click(canvas.getByRole("spinbutton", { name: /^month/ }));
    await user.keyboard("03162027");
    await user.type(
      canvas.getByRole("textbox", { name: /Interests/ }),
      "A11y{Enter}",
    );
    await user.click(canvas.getByRole("checkbox", { name: /terms/ }));
    await user.click(canvas.getByRole("button", { name: "Register" }));

    await expect(await canvas.findByText("Registering…")).toBeVisible();
    const nextStep = await canvas.findByRole(
      "heading",
      { name: "Check your email" },
      { timeout: 3000 },
    );
    // The heading takes focus in an effect, after it has rendered.
    await waitFor(() => expect(nextStep).toHaveFocus());
  },
};

/**
 * The whole flow with the keyboard only: Tab between fields, the arrows in the radio group and the
 * slider, typing in the select and the date, Space for the switch and the checkbox, Enter to
 * submit; then the code and Enter. Not snapshotted: its end state is the Success story.
 */
export const KeyboardOnly: Story = {
  parameters: { chromatic: { disableSnapshot: true } },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);

    await user.tab();
    await expect(
      canvas.getByRole("textbox", { name: /Full name/ }),
    ).toHaveFocus();
    await user.keyboard("Ada Byron");
    await user.tab();
    await user.keyboard("ada@example.org");
    await user.tab();
    await user.keyboard("Hi");

    await user.tab();
    await expect(canvas.getByRole("radio", { name: /Standard/ })).toHaveFocus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown>}");
    await waitFor(() =>
      expect(canvas.getByRole("radio", { name: /Student/ })).toHaveFocus(),
    );
    await user.keyboard("{/ArrowDown}");
    await expect(canvas.getByRole("radio", { name: /Student/ })).toBeChecked();

    await user.tab();
    await expect(
      canvas.getByRole("combobox", { name: /Country/ }),
    ).toHaveFocus();
    // Typing while the list is closed selects the first matching option, as a native select does.
    await user.keyboard("s");
    await expect(
      canvas.getByRole("combobox", { name: /Country/ }),
    ).toHaveTextContent("Spain");

    await user.tab();
    await expect(
      canvas.getByRole("spinbutton", { name: /^month/ }),
    ).toHaveFocus();
    await user.keyboard("03162027");
    // From the year to the calendar button, then to the interests.
    await user.tab();
    await user.tab();
    await expect(
      canvas.getByRole("textbox", { name: /Interests/ }),
    ).toHaveFocus();
    await user.keyboard("A11y{Enter}");

    await user.tab();
    await expect(canvas.getByRole("slider")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "4",
    );
    await user.tab();
    await user.keyboard(" ");
    await expect(canvas.getByRole("switch")).toBeChecked();
    await user.tab();
    await user.keyboard(" ");
    await expect(canvas.getByRole("checkbox", { name: /terms/ })).toBeChecked();

    await user.tab();
    await expect(
      canvas.getByRole("button", { name: "Register" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");

    const nextStep = await canvas.findByRole("heading", {
      name: "Check your email",
    });
    await waitFor(() => expect(nextStep).toHaveFocus());
    await user.tab();
    await user.keyboard(DEMO_CODE);
    await user.tab();
    await user.keyboard("{Enter}");

    const done = await canvas.findByRole("heading", {
      name: "You are registered",
    });
    await waitFor(() => expect(done).toHaveFocus());
  },
};

/**
 * While the demo server is answering (here it never does): the form is `aria-busy`, every field is
 * disabled, and the button stays focusable with `aria-disabled`. The status line was reserved, so
 * nothing moves.
 */
export const Submitting: Story = {
  args: { defaultValues: FILLED, submitDelay: "never" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Register" });

    await userEvent.click(button);

    await expect(await canvas.findByText("Registering…")).toBeVisible();
    await expect(
      canvas.getByRole("form", { name: /Register for/ }),
    ).toHaveAttribute("aria-busy", "true");
    await expect(
      canvas.getByRole("textbox", { name: /Full name/ }),
    ).toBeDisabled();
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).toHaveFocus();
  },
};

/** After the code is verified. */
export const Success: Story = { args: { initialStep: "done" } };

/** Every control disabled: not focusable, and not submitted with a form. */
export const Disabled: Story = {
  args: { defaultValues: FILLED, mode: "disabled" },
};

/**
 * Read-only where the control supports it (Input, Textarea, DatePicker, TagInput): the value can
 * be focused, read and copied. RadioGroup, Select, Slider, Switch and Checkbox have no read-only
 * mode (Radix offers none), so they are disabled here instead: their values stay visible, but they
 * cannot be focused. A read-only mode for those is in BACKLOG.md as a future improvement.
 */
export const ReadOnly: Story = {
  args: { defaultValues: FILLED, mode: "readOnly" },
};
