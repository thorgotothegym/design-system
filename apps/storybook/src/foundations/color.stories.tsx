import { themes } from "@aleixvidal/tokens";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ColorTokens } from "./color-tokens";
import { ContrastPairs } from "./contrast-pairs";
import { report } from "./contrast-report";

const meta = {
  title: "Foundations/Color",
  parameters: {
    docs: {
      description: {
        component:
          "Every semantic color in both themes, and the WCAG 2.x contrast ratio of every declared foreground/background pair. All of it is read from the token files: nothing on this page is typed by hand. Components use these semantic tokens only, never raw palette values.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** Each semantic token with its OKLCH value in the dark and the light theme. */
export const SemanticColors: Story = { render: () => <ColorTokens /> };

/**
 * The same pairs the contrast gate checks in CI, with the measured ratio next to each one. The
 * play function checks that each theme's table shows exactly one row per declared pair.
 */
export const ContrastRatios: Story = {
  render: () => <ContrastPairs />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const theme of themes) {
      const table = canvas.getByRole("table", {
        name: `Contrast ratios, ${theme} theme`,
      });
      const expected = report.results.filter(
        (result) => result.theme === theme,
      ).length;

      // One header row plus one row per pair.
      await expect(within(table).getAllByRole("row")).toHaveLength(
        expected + 1,
      );
    }
  },
};
