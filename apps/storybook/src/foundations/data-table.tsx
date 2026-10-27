import type { ReactNode } from "react";

type DataTableProps = {
  caption: string;
  columns: string[];
  children: ReactNode;
};

/** A plain table styled with semantic tokens. Rows are passed as children. */
export const DataTable = ({ caption, columns, children }: DataTableProps) => (
  <table className="w-full border-collapse text-left text-sm">
    <caption className="pb-3 text-left font-bold">{caption}</caption>
    <thead>
      <tr className="border-b border-border-control text-text-muted">
        {columns.map((column) => (
          <th key={column} scope="col" className="px-3 py-2 font-medium">
            {column}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

type DataRowProps = { children: ReactNode };

export const DataRow = ({ children }: DataRowProps) => (
  <tr className="border-b border-border-decorative align-middle">{children}</tr>
);

export const DataCell = ({ children }: DataRowProps) => (
  <td className="px-3 py-2">{children}</td>
);
