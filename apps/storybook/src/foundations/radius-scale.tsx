import { cssVar, ScaleTable } from "./scale-sample";

export const RadiusScale = () => (
  <ScaleTable
    caption="Radius (base 0.25rem)"
    group="radius"
    sample={(name) => (
      <span
        aria-hidden="true"
        className="block size-12 border-2 border-border-control bg-bg-subtle"
        style={{ borderRadius: cssVar("radius", name) }}
      />
    )}
  />
);
