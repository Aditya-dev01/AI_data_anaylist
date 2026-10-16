
import { useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiDatabase,
  FiFileText,
  FiGrid,
  FiMenu,
  FiMoon,
  FiSun,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "reports", label: "Reports", icon: FiFileText },
];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [dataset, setDataset] = useState(null);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(page) {
    setActivePage(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="app-shell">
        {mobileOpen && (
          <button
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-[#101827] ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
              <FiActivity size={23} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold tracking-tight">
                DataPilot
              </h1>
              <p className="mt-0.5 text-[11px] muted">Analytics workspace</p>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 muted hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] muted">
              Workspace
            </p>
            <nav className="space-y-1" aria-label="Main navigation">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 px-4">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] muted">
              Data source
            </p>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${dataset ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-xs font-semibold">
                  {dataset ? "Dataset connected" : "No dataset loaded"}
                </span>
              </div>
              <p className="mt-2 truncate text-xs muted">
                {dataset?.name || "Upload a CSV or JSON file"}
              </p>
              {dataset && (
                <p className="mt-1 text-[11px] muted">
                  {dataset.rows.length.toLocaleString()} records · {dataset.columns.length} fields
                </p>
              )}
              <button
                onClick={() => navigate("dashboard")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                <FiUploadCloud size={15} /> Manage data
              </button>
            </div>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 p-4 text-white">
              <FiBarChart2 size={22} className="text-indigo-300" />
              <h3 className="mt-3 text-sm font-bold">Explore your data</h3>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Visualize metrics, check data quality, and generate reports.
              </p>
            </div>
            <p className="mt-4 text-center text-[10px] muted">
              DataPilot · Frontend v1.0
            </p>
          </div>
        </aside>

        <div className="min-h-screen lg:pl-[260px]">
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1120]/90 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-slate-200 p-2.5 lg:hidden dark:border-slate-700"
                aria-label="Open navigation"
              >
                <FiMenu size={19} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="muted">Workspace</span>
                  <span className="muted">/</span>
                  <span className="truncate">
                    {activePage === "dashboard" ? "Dashboard" : "Reports"}
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] muted">
                  {dataset ? dataset.name : "Welcome to your analytics workspace"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => setDark((previous) => !previous)}
                className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>

              <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-sm font-extrabold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  DP
                </div>
                <div>
                  <p className="text-xs font-bold">Data Analyst</p>
                  <p className="mt-1 text-[10px] muted">Local workspace</p>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
            {activePage === "dashboard" ? (
              <Dashboard
                dataset={dataset}
                onDataLoaded={setDataset}
              />
            ) : (
              <Reports dataset={dataset} />
            )}

            <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-xs muted sm:flex-row dark:border-slate-800">
              <p>© {new Date().getFullYear()} DataPilot Analytics</p>
              <p>Built with React, Tailwind CSS & Recharts</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
