import { scaleValues } from "@aleixvidal/tokens";
import { cssVar, ScaleTable } from "./scale-sample";
import { DataCell, DataRow, DataTable } from "./data-table";

const SAMPLE = "The quick brown fox jumps over the lazy dog";
const LINE_HEIGHT_SUFFIX = "-line-height";

const sizes = Object.entries(scaleValues.text).filter(
  ([name]) => !name.endsWith(LINE_HEIGHT_SUFFIX),
);

const lineHeightOf = (size: string): string | undefined =>
  Object.entries(scaleValues.text).find(
    ([name]) => name === `${size}${LINE_HEIGHT_SUFFIX}`,
  )?.[1];

/** Font families, the size scale with its line heights, weights and unitless line heights. */
export const TypographyScale = () => (
  <div className="flex flex-col gap-8">
    <ScaleTable
      caption="Font families"
      group="font"
      sample={(name) => (
        <span style={{ fontFamily: cssVar("font", name) }}>{SAMPLE}</span>
      )}
    />

    <DataTable
      caption="Size scale"
      columns={["Token", "Size", "Line height", "Sample"]}
    >
      {sizes.map(([name, size]) => (
        <DataRow key={name}>
          <DataCell>
            <code>{`text.${name}`}</code>
          </DataCell>
          <DataCell>
            <code>{size}</code>
          </DataCell>
          <DataCell>
            <code>{lineHeightOf(name)}</code>
          </DataCell>
          <DataCell>
            <span
              style={{
                fontSize: cssVar("text", name),
                lineHeight: cssVar("text", `${name}${LINE_HEIGHT_SUFFIX}`),
              }}
            >
              {SAMPLE}
            </span>
          </DataCell>
        </DataRow>
      ))}
    </DataTable>

    <ScaleTable
      caption="Font weights"
      group="font-weight"
      sample={(name) => (
        <span style={{ fontWeight: cssVar("font-weight", name) }}>
          {SAMPLE}
        </span>
      )}
    />

    <ScaleTable
      caption="Line heights"
      group="leading"
      sample={(name) => (
        <span
          className="block max-w-xs"
          style={{ lineHeight: cssVar("leading", name) }}
        >
          {SAMPLE}. {SAMPLE}.
        </span>
      )}
    />
  </div>
);
