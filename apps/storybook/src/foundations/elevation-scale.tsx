import { cssVar, ScaleTable } from "./scale-sample";

export const ElevationScale = () => (
  <ScaleTable
    caption="Elevation (shadows)"
    group="shadow"
    sample={(name) => (
      <span
        aria-hidden="true"
        className="block size-12 rounded-lg border border-border-decorative bg-bg-surface"
        style={{ boxShadow: cssVar("shadow", name) }}
      />
    )}
  />
);
