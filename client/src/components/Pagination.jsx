/**
 * components/Pagination.jsx
 * ---------------------------------------------------------
 * Simple numbered pagination driven by the API `meta` object.
 */
const Pagination = ({ meta, onChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages } = meta;
  const pages = [];

  // Show at most 5 page buttons around the current page
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  for (let index = start; index <= end; index += 1) pages.push(index);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={!meta.hasPrevPage} onClick={() => onChange(page - 1)}>
        ‹ Prev
      </button>

      {start > 1 && (
        <>
          <button type="button" onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="muted small">…</span>}
        </>
      )}

      {pages.map((number) => (
        <button
          key={number}
          type="button"
          className={number === page ? 'active' : ''}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="muted small">…</span>}
          <button type="button" onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button type="button" disabled={!meta.hasNextPage} onClick={() => onChange(page + 1)}>
        Next ›
      </button>
    </nav>
  );
};

export default Pagination;
