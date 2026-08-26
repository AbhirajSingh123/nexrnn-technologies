export default function AdminLoadMore({ shown, total, hasMore, onLoadMore }) {
  if (total === 0) return null;
  return (
    <div className="flex flex-col items-center gap-3 mt-5">
      <p className="text-xs text-muted normal-case">Showing {shown} of {total}</p>
      {hasMore && (
        <button onClick={onLoadMore} className="btn-secondary !px-6 !py-2.5 text-xs">
          Load More
        </button>
      )}
    </div>
  );
}
