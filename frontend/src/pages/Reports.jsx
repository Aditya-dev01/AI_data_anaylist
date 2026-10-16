
import {
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  getDatasetMetrics,
  getColumnStats,
  getInsights,
} from "../services/api";

export default function Reports({ dataset }) {
  const metrics = getDatasetMetrics(dataset);
  const stats = dataset ? getColumnStats(dataset) : [];
  const insights = getInsights(dataset);

  function downloadReport() {
    if (!dataset) return;

    const esc = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Analytics report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #172033; }
          h1, h2 { color: #4338ca; }
          .metrics { display: flex; flex-wrap: wrap; gap: 16px; }
          .metric { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
          table { border-collapse: collapse; width: 100%; margin-top: 16px; }
          th, td { padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
          th { background: #eef2ff; }
          li { margin: 10px 0; }
          @media print { body { margin: 15px; } }
        </style>
      </head>
      <body>
        <h1>AI Data Analytics Report</h1>
        <p>Dataset: ${esc(dataset.name)}</p>
        <p>Generated: ${esc(new Date().toLocaleString())}</p>
        <h2>Dataset summary</h2>
        <div class="metrics">
          <div class="metric">Rows: ${metrics.rows}</div>
          <div class="metric">Columns: ${metrics.columns}</div>
          <div class="metric">Numeric columns: ${metrics.numericColumns}</div>
          <div class="metric">Completeness: ${metrics.completeness}%</div>
          <div class="metric">Missing cells: ${metrics.missing}</div>
        </div>
        <h2>Column statistics</h2>
        <table>
          <thead><tr><th>Column</th><th>Type</th><th>Numeric values</th><th>Average</th><th>Minimum</th><th>Maximum</th></tr></thead>
          <tbody>
            ${stats.map((s) => `
              <tr>
                <td>${esc(s.name)}</td>
                <td>${esc(s.type)}</td>
                <td>${s.numericCount}</td>
                <td>${s.average === null ? "—" : esc(s.average.toFixed(2))}</td>
                <td>${s.min === null ? "—" : esc(s.min)}</td>
                <td>${s.max === null ? "—" : esc(s.max)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <h2>Automated insights</h2>
        <ul>${insights.map((item) =>
          `<li><strong>${esc(item.title)}:</strong> ${esc(item.description)}</li>`
        ).join("")}</ul>
        <p>These are automated descriptive statistics, not causal conclusions.</p>
      </body>
      </html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${dataset.name.replace(/\.[^.]+$/, "")}-report.html`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            WORKSPACE / REPORTS
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Analytics reports
          </h1>
          <p className="mt-2 text-sm muted">
            Review dataset quality, column statistics, and automated findings.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={downloadReport}
          disabled={!dataset}
        >
          <FiDownload size={16} /> Export report
        </button>
      </div>

      {!dataset ? (
        <div className="surface flex flex-col items-center px-6 py-16 text-center">
          <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <FiFileText size={30} />
          </div>
          <h2 className="mt-5 text-xl font-bold">No report available yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 muted">
            Upload a dataset on the Dashboard. This page will automatically
            display its report and statistical summaries.
          </p>
        </div>
      ) : (
        <>
          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider muted">
              Active dataset
            </p>
            <h2 className="mt-2 break-words text-xl font-bold">
              {dataset.name}
            </h2>
            <p className="mt-2 text-sm muted">
              {metrics.rows.toLocaleString()} rows · {metrics.columns} columns
              · {metrics.numericColumns} numeric columns
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total records", metrics.rows.toLocaleString()],
              ["Total columns", metrics.columns],
              ["Completeness", `${metrics.completeness}%`],
              ["Missing cells", metrics.missing.toLocaleString()],
            ].map(([label, value]) => (
              <div className="surface p-5" key={label}>
                <p className="text-sm muted">{label}</p>
                <p className="mt-3 text-2xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>

          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 className="font-bold">Column statistics</h2>
              <p className="mt-1 text-sm muted">
                Descriptive statistics for numeric values in each field.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider muted dark:bg-slate-900/60">
                  <tr>
                    {["Column", "Type", "Numeric values", "Average", "Minimum", "Maximum"].map((heading) => (
                      <th key={heading} className="px-5 py-4 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.map((item) => (
                    <tr key={item.name} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-5 py-4 font-semibold">{item.name}</td>
                      <td className="px-5 py-4">{item.type}</td>
                      <td className="px-5 py-4">{item.numericCount}</td>
                      <td className="px-5 py-4">
                        {item.average === null ? "—" : item.average.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        {item.min === null ? "—" : item.min.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        {item.max === null ? "—" : item.max.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface p-5">
            <h2 className="font-bold">Quality and insight summary</h2>
            <div className="mt-5 space-y-4">
              {insights.map((item) => {
                const Icon = item.type === "warning" ? FiAlertTriangle : FiCheckCircle;
                const color = item.type === "warning"
                  ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10"
                  : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10";

                return (
                  <div key={item.title} className="flex gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div className={`h-fit rounded-lg p-2 ${color}`}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
