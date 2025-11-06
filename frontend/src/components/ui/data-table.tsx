import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({ columns, data, emptyMessage = 'No data available', keyExtractor }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="data-table-empty">
        <p className="data-table-empty-text">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead className="data-table-header">
          <tr className="data-table-header-row">
            {columns.map((column) => (
              <th key={column.key} className="data-table-header-cell">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="data-table-body">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="data-table-row">
              {columns.map((column) => (
                <td key={column.key} className={`data-table-cell ${column.className || ''}`}>
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
