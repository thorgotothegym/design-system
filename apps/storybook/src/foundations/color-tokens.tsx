import { themeValues, themes } from "@aleixvidal/tokens";
import type { ColorToken } from "@aleixvidal/tokens";
import { DataCell, DataRow, DataTable } from "./data-table";

// Object.keys() is typed string[]; the keys of themeValues.dark are exactly the ColorToken union.
const tokenNames = Object.keys(themeValues.dark) as ColorToken[];

/** Every semantic color, in every theme, rendered from the resolved token values. */
export const ColorTokens = () => (
  <DataTable
    caption="Semantic colors"
    columns={["Token", ...themes.map((theme) => `${theme} (OKLCH)`)]}
  >
    {tokenNames.map((token) => (
      <DataRow key={token}>
        <DataCell>
          <code>{token}</code>
        </DataCell>
        {themes.map((theme) => (
          <DataCell key={theme}>
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-block size-6 shrink-0 rounded-md border border-border-control"
                style={{ background: themeValues[theme][token] }}
              />
              <code>{themeValues[theme][token]}</code>
            </span>
          </DataCell>
        ))}
      </DataRow>
    ))}
  </DataTable>
);
