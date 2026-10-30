import { userEvent } from "storybook/test";

/**
 * The same pace as `startDemo()` in packages/ui/src/test/demo.ts, which this app cannot import
 * (apps use the packages' public entry points only). Replaced by Storybook's Vite config with the
 * `STORYBOOK_PLAY_DELAY` environment variable; CI sets it to 0.
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

const STEP_DELAY =
  Number.isFinite(configuredDelay) && configuredDelay >= 0
    ? configuredDelay
    : DEFAULT_STEP_DELAY;

/** A short pause, then a user-event instance with a delay after each step, so a flow can be followed. */
export const startDemo = async (): Promise<
  ReturnType<typeof userEvent.setup>
> => {
  await new Promise((resolve) =>
    setTimeout(resolve, STEP_DELAY * FIRST_STEP_PAUSE_IN_STEPS),
  );
  return userEvent.setup({ delay: STEP_DELAY });
};
