import type { Meta, StoryObj } from "@storybook/react-vite";
import { TypographyScale } from "./typography-scale";

const meta = {
  title: "Foundations/Typography",
  parameters: {
    docs: {
      description: {
        component:
          "Font families, size scale with line heights, weights and line heights. Generated from the token files; the monospace stack is the identity of the system. font.sans currently resolves to the same stack and exists so it can change in one place.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <TypographyScale /> };
