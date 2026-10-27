import type { Meta, StoryObj } from "@storybook/react-vite";
import { ElevationScale } from "./elevation-scale";

const meta = {
  title: "Foundations/Elevation",
  parameters: {
    docs: {
      description: {
        component:
          "Four shadow levels, no glow. Shadows are subtle on the near-black dark theme, so pair them with border.decorative rather than relying on them alone. Generated from the token files.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <ElevationScale /> };
