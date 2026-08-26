import { useEffect, useState } from 'react';

// resetKey should change whenever filters/search change, so pagination
// restarts from the first page instead of showing an empty page 3 of a
// freshly-filtered list.
export function useLoadMore(items, resetKey, pageSize = 10) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const loadMore = () => setVisibleCount((c) => c + pageSize);

  return { visibleItems, hasMore, loadMore, total: items.length, shown: visibleItems.length };
}
