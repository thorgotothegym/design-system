import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { startDemo } from "../../test/demo";
import { Field } from "../field";
import { Select } from "./select";

const CountryOptions = () => (
  <>
    <Select.Group>
      <Select.Label>Europe</Select.Label>
      <Select.Item value="es">Spain</Select.Item>
      <Select.Item value="pt">Portugal</Select.Item>
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

const meta = {
  title: "Form components/Select",
  component: Select,
  subcomponents: {
    "Select.Item": Select.Item,
    "Select.Group": Select.Group,
    "Select.Label": Select.Label,
    "Select.Separator": Select.Separator,
  },
  args: {
    "aria-label": "Country",
    placeholder: "Choose a country",
    children: <CountryOptions />,
  },
  // The docs table cannot resolve the cva-derived `size` type, so its control is set by hand.
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A button that opens a list of options to pick one from. Use it for a single choice from a list too long to show at once (more than about five options). Use a RadioGroup when the options should stay visible, and Checkboxes to pick several. **When not to use:** for a simple, flat list on a mobile-first form, a native `<select>` is usually better: the phone\'s own picker is easier to use and costs no JavaScript. Inside a `Field` it is labelled, described and validated automatically; on its own it needs an `aria-label` or an external label. Enter, Space and the arrow keys open it; typing jumps to a matching option, also while closed; Escape closes it. There is no clear button: add an option such as "No preference", or set a controlled `value` back to `""` to show the placeholder again. The list opens below the trigger (above when there is no room), never leaves the viewport and scrolls inside.',
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: "sm" } };

export const Medium: Story = { args: { size: "md" } };

export const Large: Story = { args: { size: "lg" } };

export const WithValue: Story = { args: { defaultValue: "fr" } };

/**
 * The stories that only show the open list start with it open (`defaultOpen`) instead of opening
 * it in a `play` function, which would flash the list for a frame or two on every load. While the
 * list is open Radix sets `aria-hidden` on the rest of the page (the story root, which holds the
 * trigger) and keeps focus in the list. axe flags that root under `aria-hidden-focus` because it
 * contains a focusable trigger, but Tab and Shift+Tab never reach it: a false positive, and the
 * only rule turned off, for these stories only. (The DatePicker needs no exception: React Aria
 * hides the page with `inert`, which also removes it from the focus order.)
 */
const openListA11y = {
  config: { rules: [{ id: "aria-hidden-focus", enabled: false }] },
};

/** Options in labelled groups, separated by a line; each group is named by its label. */
export const Grouped: Story = {
  args: { defaultOpen: true },
  parameters: { a11y: openListA11y },
  play: async () => {
    await expect(
      await screen.findByRole("group", { name: "Europe" }),
    ).toBeVisible();
    await expect(screen.getByRole("group", { name: "Americas" })).toBeVisible();
  },
};

/** A disabled option cannot be chosen; the arrow keys and typing skip it. */
export const DisabledOption: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        <Select.Item value="es">Spain</Select.Item>
        <Select.Item value="pt" disabled>
          Portugal (not available)
        </Select.Item>
        <Select.Item value="fr">France</Select.Item>
      </>
    ),
  },
  parameters: { a11y: openListA11y },
  play: async () => {
    await expect(
      await screen.findByRole("option", { name: "Portugal (not available)" }),
    ).toHaveAttribute("aria-disabled", "true");
  },
};

export const Disabled: Story = { args: { disabled: true, defaultValue: "es" } };

export const Invalid: Story = { args: { invalid: true } };

/** An optional choice offers an explicit "No preference" option instead of a clear button. */
export const Optional: Story = {
  args: {
    "aria-label": "Preferred contact time",
    placeholder: "Choose a time",
    children: (
      <>
        <Select.Item value="none">No preference</Select.Item>
        <Select.Separator />
        <Select.Item value="morning">Morning</Select.Item>
        <Select.Item value="afternoon">Afternoon</Select.Item>
        <Select.Item value="evening">Evening</Select.Item>
      </>
    ),
  },
};

const TIME_ZONES = Array.from({ length: 25 }, (_, index) => index - 12).map(
  (offset) => `UTC${offset < 0 ? "−" : "+"}${Math.abs(offset)}`,
);

/** More options than fit: the list scrolls inside, with scroll buttons at the edges. */
export const LongList: Story = {
  args: {
    "aria-label": "Time zone",
    placeholder: "Choose a time zone",
    defaultValue: "UTC+0",
    children: TIME_ZONES.map((zone) => (
      <Select.Item key={zone} value={zone}>
        {zone}
      </Select.Item>
    )),
  },
};

const ControlledExample = () => {
  const [value, setValue] = useState("es");
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        aria-label="Country"
        placeholder="Choose a country"
        value={value}
        onValueChange={handleValueChange}
      >
        <CountryOptions />
      </Select>
      <p className="m-0 font-sans text-sm text-text-muted">
        Value: {value === "" ? "(none)" : value}
      </p>
      <button type="button" className="self-start" onClick={() => setValue("")}>
        Show the placeholder again
      </button>
    </div>
  );
};

/** The value lives in React state; setting it to `""` shows the placeholder again. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/**
 * Hover, keyboard focus and pressed on the trigger, forced with the pseudo-states addon so that
 * each one can be reviewed (and checked for visual changes) without a pointer.
 */
export const PseudoStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div id="pseudo-hover">
        <Select aria-label="Hover" defaultValue="es">
          <CountryOptions />
        </Select>
      </div>
      <div id="pseudo-focus">
        <Select aria-label="Focus visible" defaultValue="es">
          <CountryOptions />
        </Select>
      </div>
      <div id="pseudo-active">
        <Select aria-label="Active" defaultValue="es">
          <CountryOptions />
        </Select>
      </div>
    </div>
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
 * Interaction stories open the list in `play` and close it again at the end, so the state the a11y
 * panel checks afterwards is the resting one (see `openListA11y`).
 */
const closeList = async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
};

/**
 * Keyboard: open with Enter, move with the arrows, pick with Enter; typing selects a matching
 * option while closed; Escape closes without changing the value. The value is announced as the
 * combo box's value.
 */
export const KeyboardNavigation: Story = {
  args: { defaultValue: "es" },
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Country" });

    await user.tab();
    await expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    const listbox = await screen.findByRole("listbox");
    // Radix moves the focus to the selected option once the list is positioned, after it appears.
    await waitFor(() =>
      expect(
        within(listbox).getByRole("option", { name: "Spain" }),
      ).toHaveFocus(),
    );

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Portugal");
    // The focus goes back to the trigger in a timeout after the list unmounts.
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.keyboard("c");
    await expect(trigger).toHaveTextContent("Canada");

    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Canada");
  },
};

const ValidationExample = () => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && value === "";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field invalid={invalid} required>
        <Field.Label>Country</Field.Label>
        <Select
          placeholder="Choose a country"
          value={value}
          onValueChange={setValue}
        >
          <CountryOptions />
        </Select>
        <Field.Description>Where you pay taxes.</Field.Description>
        <Field.Error>{invalid ? "Choose a country" : null}</Field.Error>
      </Field>
      <button type="submit" className="self-start">
        Continue
      </button>
    </form>
  );
};

/** Required: submitting with nothing chosen shows the error, linked to the select; choosing clears it. */
export const ValidationFlow: Story = {
  render: () => <ValidationExample />,
  play: async ({ canvasElement }) => {
    const user = await startDemo();
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: /Country/ });

    await user.click(canvas.getByRole("button", { name: "Continue" }));
    await expect(trigger).toBeInvalid();
    await expect(trigger).toBeRequired();
    await expect(trigger).toHaveAccessibleDescription(
      "Where you pay taxes. Choose a country",
    );

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Peru" }));
    await expect(trigger).toHaveTextContent("Peru");
    await expect(trigger).toBeValid();
  },
};

/** Fails when an element's box leaves the visible viewport. */
const expectInsideViewport = async (element: Element) => {
  const box = element.getBoundingClientRect();

  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.top).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
  await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
};

/**
 * The test runner sets the story's viewport before `play`, but the browser fires the `resize`
 * event for it on the next frame, before that frame's animation callbacks. Radix Select closes on
 * any window resize, so a list opened before then can close at once. Resolves once that frame has
 * run, so a pending resize has been delivered.
 */
const viewportResized = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * A narrow screen (320px wide, the mobile1 viewport) with the trigger in the bottom-right corner
 * and long options: the list flips above the trigger, keeps within the viewport and scrolls.
 */
export const SmallViewport: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  args: {
    "aria-label": "Time zone",
    placeholder: "Choose a time zone",
    children: TIME_ZONES.map((zone) => (
      <Select.Item key={zone} value={zone}>
        {`${zone}, a deliberately long option label that has to wrap`}
      </Select.Item>
    )),
  },
  render: (args) => (
    <div className="flex min-h-screen items-end justify-end">
      <div className="w-1/2">
        <Select {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await viewportResized();

    await userEvent.click(canvas.getByRole("combobox", { name: "Time zone" }));
    const listbox = await screen.findByRole("listbox");
    const content = listbox.closest("[data-slot=select-content]") ?? listbox;

    await waitFor(() => expect(content).toHaveAttribute("data-side", "top"));
    await expectInsideViewport(content);
    await closeList();
  },
};

/**
 * A page taller than the viewport, so it has a vertical scrollbar. Opening the list locks the
 * page scroll; the scrollbar's gap is kept, so the page does not shift sideways.
 */
export const PageWithScrollbar: Story = {
  render: (args) => (
    <div className="h-[200vh]">
      <Select {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Country" });
    // After a story with another viewport (SmallViewport), the runner restores the default size.
    await viewportResized();
    const before = trigger.getBoundingClientRect().left;

    await userEvent.click(trigger);
    await screen.findByRole("listbox");

    await expect(trigger.getBoundingClientRect().left).toBe(before);
    await closeList();
  },
};
