import { cssVar, ScaleTable } from "./scale-sample";

export const SpacingScale = () => (
  <ScaleTable
    caption="Spacing (4px grid)"
    group="space"
    sample={(name) => (
      <span
        aria-hidden="true"
        className="block h-3 rounded-md bg-brand-primary"
        style={{ width: cssVar("space", name) }}
      />
    )}
  />
);
