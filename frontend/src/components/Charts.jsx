
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { getChartData } from "../services/api";

const numberFormat = (value) =>
  Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

function EmptyChart({ dataset }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-center dark:bg-slate-900/40">
      <div>
        <p className="font-medium">No numeric data available</p>
        <p className="mt-2 text-sm muted">
          {dataset
            ? "Add a numeric column to visualize your dataset."
            : "Upload a dataset to generate charts."}
        </p>
      </div>
    </div>
  );
}

export default function Charts({ dataset }) {
  const chart = getChartData(dataset);
  const data = chart?.data || [];

  if (!data.length) {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        {["Category comparison", "Value distribution"].map((title) => (
          <div key={title} className="surface p-5">
            <h3 className="mb-5 font-bold">{title}</h3>
            <EmptyChart dataset={dataset} />
          </div>
        ))}
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "12px",
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="surface min-w-0 p-5">
        <div className="mb-6">
          <h3 className="font-bold">Category comparison</h3>
          <p className="mt-1 text-xs muted">
            {chart.metric} by {chart.category}
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={numberFormat}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [numberFormat(value), chart.metric]}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface min-w-0 p-5">
        <div className="mb-6">
          <h3 className="font-bold">Value trend</h3>
          <p className="mt-1 text-xs muted">
            Imported record order · {chart.metric}
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 5 }}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={numberFormat}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [numberFormat(value), chart.metric]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#valueGradient)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
