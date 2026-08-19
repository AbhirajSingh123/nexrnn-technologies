import { Trash2 } from 'lucide-react';

export default function AdminTable({ columns, rows, onDelete, emptyLabel = 'No records yet.' }) {
  if (!rows.length) {
    return (
      <div className="card-base bg-white p-10 text-center text-muted text-sm normal-case">{emptyLabel}</div>
    );
  }

  return (
    <div className="card-base bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-secondary bg-accent">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-secondary whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {onDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-secondary/10 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-secondary/80 normal-case align-top">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {onDelete && (
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(row)}
                    aria-label="Delete"
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
