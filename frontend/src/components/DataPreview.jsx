
import { useMemo, useState } from "react";
import { FiDownload, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function DataPreview({ dataset }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const filteredRows = useMemo(() => {
    if (!dataset) return [];
    const query = search.toLowerCase().trim();

    if (!query) return dataset.rows;

    return dataset.rows.filter((row) =>
      dataset.columns.some((column) =>
        String(row[column] ?? "").toLowerCase().includes(query)
      )
    );
  }, [dataset, search]);

  if (!dataset) {
    return (
      <div className="surface p-8 text-center">
        <p className="font-semibold">No dataset loaded</p>
        <p className="mt-2 text-sm muted">
          Upload a CSV or JSON file to preview your data.
        </p>
      </div>
    );
  }

  const pageCount = Math.ceil(filteredRows.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const visibleRows = filteredRows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  function downloadCSV() {
    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const content = [
      dataset.columns.map(escapeCSV).join(","),
      ...filteredRows.map((row) =>
        dataset.columns.map((column) => escapeCSV(row[column])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${dataset.name.replace(/\.[^.]+$/, "")}-preview.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
        <div>
          <h3 className="font-bold">Data preview</h3>
          <p className="mt-1 text-xs muted">
            {filteredRows.length.toLocaleString()} records · {dataset.columns.length} columns
          </p>
        </div>

        <button onClick={downloadCSV} className="btn-secondary">
          <FiDownload size={15} /> Export CSV
        </button>
      </div>

      <div className="p-4">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
          <input
            className="field pl-9"
            placeholder="Search across all columns..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              {dataset.columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-5 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row, index) => (
              <tr
                key={currentPage * pageSize + index}
                className="border-t border-slate-100 transition hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                {dataset.columns.map((column) => (
                  <td
                    key={column}
                    className="max-w-[260px] truncate px-5 py-3"
                    title={String(row[column] ?? "")}
                  >
                    {String(row[column] ?? "") || (
                      <span className="muted italic">Empty</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {!visibleRows.length && (
              <tr>
                <td colSpan={dataset.columns.length} className="px-5 py-12 text-center muted">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
        <span className="text-xs muted">
          Page {pageCount ? currentPage + 1 : 0} of {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 0 || !pageCount}
            onClick={() => setPage(currentPage - 1)}
            className="btn-secondary"
            aria-label="Previous page"
          >
            <FiChevronLeft />
          </button>
          <button
            disabled={!pageCount || currentPage >= pageCount - 1}
            onClick={() => setPage(currentPage + 1)}
            className="btn-secondary"
            aria-label="Next page"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
