
import { FiDatabase, FiArrowUpRight, FiBarChart2 } from "react-icons/fi";
import FileUpload from "../components/FileUpload";
import DataPreview from "../components/DataPreview";
import MetricCard from "../components/MetricCard";
import Charts from "../components/Charts";
import AIChat from "../components/AIChat";
import InsightPanel from "../components/InsightPanel";
import { getDatasetMetrics } from "../services/api";

export default function Dashboard({ dataset, onDataLoaded }) {
  const metrics = getDatasetMetrics(dataset);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            WORKSPACE / OVERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            Analytics dashboard
          </h1>
          <p className="mt-2 text-sm muted">
            Turn your raw data into useful, understandable insights.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {dataset ? "Dataset loaded" : "Awaiting data"}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
            <FiBarChart2 /> AI-powered analytics workspace
          </span>
          <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
            Your data, made clearer.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100">
            Import your dataset, explore its structure, review visualizations,
            and uncover data-quality observations from one workspace.
          </p>
          <button
            onClick={() =>
              document.getElementById("upload-section")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
          >
            Upload dataset <FiArrowUpRight />
          </button>
        </div>

        <FiDatabase
          className="absolute -bottom-8 -right-5 h-48 w-48 text-white/[0.08]"
          aria-hidden="true"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total records"
          value={metrics.rows.toLocaleString()}
          subtitle="Rows in the active dataset"
          type="rows"
          color="indigo"
        />
        <MetricCard
          title="Total columns"
          value={metrics.columns}
          subtitle="Fields available for analysis"
          type="columns"
          color="blue"
        />
        <MetricCard
          title="Numeric columns"
          value={metrics.numericColumns}
          subtitle="Columns with numeric values"
          type="numeric"
          color="violet"
        />
        <MetricCard
          title="Data completeness"
          value={`${metrics.completeness}%`}
          subtitle={`${metrics.missing.toLocaleString()} empty cells`}
          type="quality"
          color="emerald"
        />
      </div>

      <div id="upload-section" className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="surface p-5">
          <h3 className="mb-1 font-bold">Import data</h3>
          <p className="mb-5 text-sm muted">
            Start with a CSV or JSON file from your computer.
          </p>
          <FileUpload onDataLoaded={onDataLoaded} />
        </div>

        <InsightPanel dataset={dataset} />
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Visual analytics</h2>
          <p className="mt-1 text-sm muted">
            Interactive charts generated from your dataset.
          </p>
        </div>
        <Charts dataset={dataset} />
      </div>

      <DataPreview dataset={dataset} />

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Ask your data</h2>
          <p className="mt-1 text-sm muted">
            Ask questions about records, fields, and numeric statistics.
          </p>
        </div>
        <AIChat dataset={dataset} />
      </div>
    </div>
  );
}
