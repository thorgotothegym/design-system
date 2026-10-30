import { userEvent } from "storybook/test";

/**
 * Replaced by Storybook's Vite config with the `STORYBOOK_PLAY_DELAY` environment variable (an
 * empty string when it is unset). Outside Storybook it is not defined at all.
 */
declare const __STORYBOOK_PLAY_DELAY__: string | undefined;

const DEFAULT_STEP_DELAY = 250;
/** The pause before the first step, in steps: 600 ms at the default delay. */
const FIRST_STEP_PAUSE_IN_STEPS = 2.4;

const configuredDelay =
  typeof __STORYBOOK_PLAY_DELAY__ === "string" &&
  __STORYBOOK_PLAY_DELAY__ !== ""
    ? Number(__STORYBOOK_PLAY_DELAY__)
    : Number.NaN;

/** Milliseconds after each step: `STORYBOOK_PLAY_DELAY` when it is a number (CI sets 0), else 250. */
const STEP_DELAY =
  Number.isFinite(configuredDelay) && configuredDelay >= 0
    ? configuredDelay
    : DEFAULT_STEP_DELAY;

/**
 * For the interaction stories that demonstrate a flow, as opposed to layout checks: a short
 * pause before the first step and a delay after each one, so the steps can be followed in the
 * canvas instead of flashing by on load. Only the pace changes; the assertions do not.
 */
export const startDemo = async () => {
  await new Promise((resolve) =>
    setTimeout(resolve, STEP_DELAY * FIRST_STEP_PAUSE_IN_STEPS),
  );
  return userEvent.setup({ delay: STEP_DELAY });
};
