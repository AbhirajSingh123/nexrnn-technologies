import { useMemo, useState } from 'react';

/**
 * Admin list pages ke liye simple search filter.
 * Rows ke saare string fields mein text dhoondta hai.
 */
export function useAdminSearch(rows) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return (rows || []).filter((row) =>
      Object.keys(row || {}).some((k) => {
        const v = row[k];
        return typeof v === 'string' && v.toLowerCase().includes(q);
      })
    );
  }, [rows, search]);

  return { search, setSearch, filtered };
}
