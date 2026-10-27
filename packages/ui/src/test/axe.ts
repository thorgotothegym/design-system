import axe from "axe-core";
import { expect } from "vitest";

/**
 * Fails when axe finds violations in `root` (the whole document by default). Two rules are off:
 * color-contrast, because jsdom does no layout or painting (contrast is covered by the contrast
 * gate and the Storybook a11y panel), and region, because a component has no page landmarks.
 */
export const expectNoA11yViolations = async (
  root: HTMLElement = document.body,
) => {
  const results = await axe.run(root, {
    rules: {
      "color-contrast": { enabled: false },
      // A component in isolation has no page landmarks.
      region: { enabled: false },
    },
  });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ")})`,
  );

  expect(violations).toEqual([]);
};
