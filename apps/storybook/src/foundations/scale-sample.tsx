import { scaleValues } from "@aleixvidal/tokens";
import type { ReactNode } from "react";
import { DataCell, DataRow, DataTable } from "./data-table";

type ScaleName = keyof typeof scaleValues;

/** CSS custom property of a scale token, derived from its group and name in the token files. */
export const cssVar = (group: ScaleName, name: string): string =>
  `var(--ds-${group}-${name})`;

type ScaleTableProps = {
  caption: string;
  group: ScaleName;
  /** Renders the visual sample for one token. */
  sample: (name: string) => ReactNode;
};

/** One row per token of a scale: name, resolved value and a sample drawn with the token. */
export const ScaleTable = ({ caption, group, sample }: ScaleTableProps) => (
  <DataTable caption={caption} columns={["Token", "Value", "Sample"]}>
    {Object.entries(scaleValues[group]).map(([name, value]) => (
      <DataRow key={name}>
        <DataCell>
          <code>{`${group}.${name}`}</code>
        </DataCell>
        <DataCell>
          <code>{value}</code>
        </DataCell>
        <DataCell>{sample(name)}</DataCell>
      </DataRow>
    ))}
  </DataTable>
);
