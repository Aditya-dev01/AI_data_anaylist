
import { FiActivity, FiDatabase, FiGrid, FiCheckCircle } from "react-icons/fi";

const icons = {
  rows: FiDatabase,
  columns: FiGrid,
  numeric: FiActivity,
  quality: FiCheckCircle,
};

export default function MetricCard({
  title,
  value,
  subtitle,
  type = "rows",
  color = "indigo",
}) {
  const Icon = icons[type] || FiActivity;

  const styles = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  };

  return (
    <div className="surface p-5 transition duration-200 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium muted">{title}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${styles[color] || styles.indigo}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs muted">{subtitle}</p>
    </div>
  );
}
