import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorTokens } from "./color-tokens";
import { ContrastPairs } from "./contrast-pairs";

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

/** The same pairs the contrast gate checks in CI, with the measured ratio next to each one. */
export const ContrastRatios: Story = { render: () => <ContrastPairs /> };
