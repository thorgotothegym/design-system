import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadiusScale } from "./radius-scale";

const meta = {
  title: "Foundations/Radius",
  parameters: {
    docs: {
      description: {
        component:
          "The radius scale, derived from a 0.25rem base. Corners stay tight on purpose. Generated from the token files.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <RadiusScale /> };
