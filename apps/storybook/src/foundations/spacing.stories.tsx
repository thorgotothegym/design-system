import type { Meta, StoryObj } from "@storybook/react-vite";
import { SpacingScale } from "./spacing-scale";

const meta = {
  title: "Foundations/Spacing",
  parameters: {
    docs: {
      description: {
        component:
          "Spacing steps on a 4px grid, in rem. Generated from the token files. Components use these steps only: no arbitrary pixel values.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <SpacingScale /> };
