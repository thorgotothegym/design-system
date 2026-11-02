import { Input, RadioGroup, Select, Slider, Switch } from "@aleixvidal/ui";
import { DatePicker } from "@aleixvidal/ui/date-picker";
import { OtpInput } from "@aleixvidal/ui/otp-input";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";

/**
 * Under forced colors the text colors are the user's palette, not the tokens, and axe's
 * `color-contrast` mixes the two: it reports the dark token green (#6bc670) on the forced white
 * `Canvas`, where the page paints black on white. That is a false positive, so the rule is off
 * for these stories only; the dark and light projects check contrast on every story.
 */
const forcedContrast = { id: "color-contrast", enabled: false };

const meta = {
  title: "Foundations/Forced colors",
  // A regression check, not documentation: hidden from the sidebar and the docs pages, and run
  // only by the `storybook-forced-colors` project of `pnpm test:storybook` (vitest.config.ts),
  // which emulates forced colors. The dark and light projects leave the `forced-colors` tag out.
  tags: ["!dev", "!autodocs", "forced-colors"],
  // Chromatic does not emulate forced colors, so a snapshot would show the normal theme and
  // repeat the component stories.
  parameters: {
    chromatic: { disableSnapshot: true },
    a11y: { config: { rules: [forcedContrast] } },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** The computed value of a system color, read from a probe, to compare the forced styles against. */
const systemColor = (keyword: "Canvas" | "CanvasText" | "GrayText") => {
  const probe = document.createElement("span");
  probe.style.backgroundColor = keyword;
  document.body.append(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
};

/**
 * The parts checked here (thumb, dot, filled range, today dot) are decorative and hidden from
 * assistive technology, so they have no role or name: they are found by their `data-slot` or
 * from the element that has a role.
 */
const part = (root: ParentNode, selector: string) => {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`${selector} not found`);
  return getComputedStyle(element);
};

/**
 * Under forced colors the browser paints every author background as `Canvas`. Each state that a
 * fill used to show keeps a visible shape: the switch thumb (and the on track), the selected
 * radio dot and the filled part of the slider are painted with system colors, the code input
 * keeps its text transparent over the boxes, invalid is a dashed border and disabled `GrayText`.
 * An icon with its own color (the Select chevron) is painted `CanvasText`, not the token.
 */
export const StatesKeepAShape: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Switch aria-label="Off" />
        <Switch aria-label="On" defaultChecked />
      </div>
      <RadioGroup aria-label="Plan" defaultValue="pro">
        <RadioGroup.Item value="free" aria-label="Free" />
        <RadioGroup.Item value="pro" aria-label="Pro" />
      </RadioGroup>
      <Slider aria-label="Volume" defaultValue={[40]} />
      <OtpInput aria-label="Code" defaultValue="482913" />
      <Input aria-label="Invalid" invalid defaultValue="not-an-email" />
      <Input aria-label="Disabled" disabled defaultValue="Ada Lovelace" />
      <Select aria-label="Country" placeholder="Choose a country">
        <Select.Item value="Spain">Spain</Select.Item>
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const canvasColor = systemColor("Canvas");

    const off = part(
      canvas.getByRole("switch", { name: "Off" }),
      "[data-slot=switch-thumb]",
    );
    const onSwitch = canvas.getByRole("switch", { name: "On" });
    const on = part(onSwitch, "[data-slot=switch-thumb]");
    const onTrack = getComputedStyle(onSwitch).backgroundColor;
    const dot = part(canvas.getByRole("radio", { name: "Pro" }), "span");
    const range = part(canvasElement, "[data-slot=slider-range]");
    const code = getComputedStyle(
      canvas.getByRole("textbox", { name: "Code" }),
    );
    const invalid = canvas
      .getByRole("textbox", { name: "Invalid" })
      .closest("[data-slot=input]");
    const disabled = canvas
      .getByRole("textbox", { name: "Disabled" })
      .closest("[data-slot=input]");
    const chevron = part(
      canvas.getByRole("combobox", { name: "Country" }),
      "svg",
    );

    await expect(window.matchMedia("(forced-colors: active)").matches).toBe(
      true,
    );
    await expect(off.backgroundColor).not.toBe(canvasColor);
    await expect(onTrack).not.toBe(canvasColor);
    await expect(on.backgroundColor).not.toBe(onTrack);
    await expect(dot.backgroundColor).not.toBe(canvasColor);
    await expect(range.backgroundColor).not.toBe(canvasColor);
    await expect(code.forcedColorAdjust).toBe("none");
    await expect(code.color).toBe("rgba(0, 0, 0, 0)");
    await expect(invalid && getComputedStyle(invalid).borderTopStyle).toBe(
      "dashed",
    );
    await expect(disabled && getComputedStyle(disabled).borderTopColor).toBe(
      systemColor("GrayText"),
    );
    await expect(chevron.color).toBe(systemColor("CanvasText"));
  },
};

/** A day of the current month that is not today, so today and the selection are two cells. */
const otherDay = () => {
  const today = new Date();
  const day = today.getDate() > 1 ? today.getDate() - 1 : today.getDate() + 1;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(day)}`;
};

/**
 * The selected day stays filled (`Highlight`, with `HighlightText` for the number) after the
 * focus moves to another day, and today keeps its dot.
 */
export const CalendarDays: Story = {
  render: () => (
    <DatePicker aria-label="Date" defaultValue={otherDay()} defaultOpen />
  ),
  // The open calendar hides the date parts from assistive technology while focus stays in the
  // calendar; see `openCalendarA11y` in date-picker.stories.tsx, the same false positive.
  parameters: {
    a11y: {
      config: {
        rules: [forcedContrast, { id: "aria-hidden-focus", enabled: false }],
      },
    },
  },
  play: async () => {
    const grid = await screen.findByRole("grid");
    await waitFor(() =>
      expect(
        grid.querySelector("[data-selected][data-focus-visible]"),
      ).not.toBeNull(),
    );
    // The selected day opts out of forced colors, so its ring must still be a system color.
    await expect(part(grid, "[data-selected]").outlineColor).toBe(
      systemColor("CanvasText"),
    );

    await userEvent.keyboard("{ArrowRight}");

    const canvasColor = systemColor("Canvas");
    const selected = part(grid, "[data-selected]");
    const today = part(grid, "span[aria-hidden]");
    await expect(
      grid.querySelector("[data-selected][data-focus-visible]"),
    ).toBeNull();
    await expect(selected.backgroundColor).not.toBe(canvasColor);
    await expect(selected.color).not.toBe(selected.backgroundColor);
    await expect(today.backgroundColor).not.toBe(canvasColor);
  },
};
