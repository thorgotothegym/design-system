import { userEvent } from "storybook/test";

const FIRST_STEP_PAUSE = 600;
const STEP_DELAY = 250;

/**
 * For the interaction stories that demonstrate a flow, as opposed to layout checks: a short
 * pause before the first step and a delay after each one, so the steps can be followed in the
 * canvas instead of flashing by on load. Only the pace changes; the assertions do not.
 */
export const startDemo = async () => {
  await new Promise((resolve) => setTimeout(resolve, FIRST_STEP_PAUSE));
  return userEvent.setup({ delay: STEP_DELAY });
};
