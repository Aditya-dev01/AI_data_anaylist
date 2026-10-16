
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiZap } from "react-icons/fi";
import { getInsights } from "../services/api";

const iconMap = {
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const colorMap = {
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  info: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
};

export default function InsightPanel({ dataset }) {
  const insights = getInsights(dataset);

  return (
    <section className="surface p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
          <FiZap size={20} />
        </div>
        <div>
          <h3 className="font-bold">Data insights</h3>
          <p className="mt-1 text-xs muted">
            Automated observations from your data
          </p>
        </div>
      </div>

      {!dataset ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5 text-center dark:bg-slate-900/50">
          <p className="text-sm muted">
            Upload a dataset to discover patterns, missing values, and potential data-quality issues.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {insights.map((insight, index) => {
            const Icon = iconMap[insight.type] || FiInfo;

            return (
              <div
                key={`${insight.title}-${index}`}
                className="flex gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className={`h-fit rounded-lg p-2 ${colorMap[insight.type] || colorMap.info}`}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold">{insight.title}</h4>
                  <p className="mt-1 text-sm leading-6 muted">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
