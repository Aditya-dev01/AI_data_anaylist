const API_BASE_URL = "https://ai-data-anaylist-backend.onrender.com/api";

async function requestAPI(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(options.headers || {});

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to Flask. Make sure the backend is running at http://127.0.0.1:5000."
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await response.json().catch(() => null);
      if (data?.error) message = data.error;
      else if (data?.message) message = data.message;
    } else {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }

    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response;
}

function normalizePreview(preview) {
  if (Array.isArray(preview)) {
    return {
      columns: preview.length ? Object.keys(preview[0]) : [],
      rows: preview,
    };
  }

  if (!preview || typeof preview !== "object") {
    return { columns: [], rows: [] };
  }

  const rows =
    (Array.isArray(preview.rows) && preview.rows) ||
    (Array.isArray(preview.data) && preview.data) ||
    (Array.isArray(preview.records) && preview.records) ||
    [];

  const columns =
    (Array.isArray(preview.columns) && preview.columns) ||
    (rows.length ? Object.keys(rows[0]) : []);

  return { columns, rows };
}

export function normalizeDatasetResponse(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("The backend returned an invalid dataset response.");
  }

  const preview = normalizePreview(payload.preview);
  const analysis = payload.analysis || {};

  const columns =
    preview.columns.length > 0
      ? preview.columns
      : Array.isArray(analysis.columns)
        ? analysis.columns
        : [];

  const rows = preview.rows || [];
  const datasetId =
    payload.dataset_id || payload.id || payload.datasetId || null;

  return {
    ...payload,
    id: datasetId,
    dataset_id: datasetId,
    datasetId,
    name:
      payload.original_filename ||
      payload.name ||
      payload.filename ||
      "Uploaded dataset",
    filename:
      payload.original_filename ||
      payload.filename ||
      "Uploaded dataset",
    columns,
    rows,
    preview: { ...preview, columns, rows },
    analysis,
    metrics: payload.metrics || analysis.metrics || {},
    charts: Array.isArray(payload.charts) ? payload.charts : [],
    insights: Array.isArray(payload.insights) ? payload.insights : [],
  };
}

export async function checkBackendHealth() {
  return requestAPI("/health");
}

export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || "Upload failed");
  }

  return normalizeDatasetResponse(result);
}
export async function getDataset(datasetId) {
  if (!datasetId) {
    throw new Error("Dataset ID is required.");
  }

  const response = await requestAPI(
    `/dataset/${encodeURIComponent(datasetId)}`
  );

  return normalizeDatasetResponse(response);
}

export async function analyzeDataset(datasetId, options = {}) {
  if (!datasetId) {
    throw new Error("Dataset ID is required.");
  }

  const response = await requestAPI(
    `/analyze/${encodeURIComponent(datasetId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        fill_missing: Boolean(options.fill_missing),
        remove_duplicates: Boolean(options.remove_duplicates),
      }),
    }
  );

  return normalizeDatasetResponse(response);
}


// const API_BASE_URL = "http://127.0.0.1:5000/api";

export async function askAI(question, dataset) {
  const datasetId =
    typeof dataset === "string"
      ? dataset
      : dataset?.dataset_id || dataset?.id || dataset?.datasetId;

  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset_id: datasetId,
      question,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Flask request failed.");
  }

  return data;
}

export const askDatasetQuestion = askAI;

export async function downloadReport(datasetId) {
  if (!datasetId) {
    throw new Error("Dataset ID is required.");
  }

  const response = await requestAPI(
    `/report/${encodeURIComponent(datasetId)}`
  );

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = "analytics_report.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}

export function getDatasetMetrics(dataset) {
  if (!dataset) {
    return {
      rows: 0,
      columns: 0,
      numericColumns: 0,
      missing: 0,
      completeness: 0,
    };
  }

  const backendMetrics = dataset.metrics || dataset.analysis?.metrics || {};
  const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
  const columns = Array.isArray(dataset.columns) ? dataset.columns : [];

  function metricValue(keys, fallback) {
    for (const key of keys) {
      const value = backendMetrics[key];

      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }

    return fallback;
  }

  const rowCount = metricValue(
    ["rows", "total_rows", "row_count", "records"],
    rows.length
  );

  const columnCount = metricValue(
    ["columns", "total_columns", "column_count", "fields"],
    columns.length
  );

  const numericCount = metricValue(
    ["numeric_columns", "numericColumns", "numeric_column_count"],
    columns.filter((column) => {
      const row = rows.find(
        (item) =>
          item?.[column] !== null &&
          item?.[column] !== undefined &&
          item?.[column] !== ""
      );

      return row !== undefined && Number.isFinite(Number(row[column]));
    }).length
  );

  let missingFallback = 0;

  for (const row of rows) {
    for (const column of columns) {
      if (
        row?.[column] === null ||
        row?.[column] === undefined ||
        row?.[column] === ""
      ) {
        missingFallback++;
      }
    }
  }

  const totalCells = rowCount * columnCount;

  const missing = metricValue(
    ["missing", "missing_values", "missing_cells", "null_count"],
    missingFallback
  );

  const completeness = metricValue(
    ["completeness", "completeness_percent", "data_completeness"],
    totalCells
      ? Math.round(((totalCells - missing) / totalCells) * 100)
      : 0
  );

  return {
    rows: rowCount,
    columns: columnCount,
    numericColumns: numericCount,
    missing,
    completeness: Math.max(0, Math.min(100, Math.round(completeness))),
  };
}



export function getChartData(dataset) {
  if (!dataset) {
    return { category: "", metric: "", data: [] };
  }

  const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
  const columns = Array.isArray(dataset.columns)
    ? dataset.columns
    : rows.length && !Array.isArray(rows[0])
      ? Object.keys(rows[0])
      : [];

  if (!rows.length || !columns.length) {
    return { category: "", metric: "", data: [] };
  }

  const getValue = (row, column, index) =>
    Array.isArray(row) ? row[index] : row?.[column];

  const toNumber = (value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string" || !value.trim()) return null;

    const cleaned = value.replace(/,/g, "").trim();
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : null;
  };

  const numericColumns = columns.filter((column, index) => {
    const values = rows
      .map((row) => getValue(row, column, index))
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== "");

    return values.length > 0 && values.every((value) => toNumber(value) !== null);
  });

  if (!numericColumns.length) {
    return { category: "", metric: "", data: [] };
  }

  // Prefer Revenue when available; otherwise use the first numeric column.
  const metric =
    numericColumns.find((column) => /revenue|sales|profit|amount/i.test(column)) ||
    numericColumns[0];

  const metricIndex = columns.indexOf(metric);

  const category =
    columns.find((column, index) => {
      if (numericColumns.includes(column)) return false;

      return rows.some((row) => {
        const value = getValue(row, column, index);
        return value !== null && value !== undefined && String(value).trim() !== "";
      });
    }) || "Record";

  const categoryIndex = columns.indexOf(category);
  const totals = new Map();

  rows.forEach((row, index) => {
    const value = toNumber(getValue(row, metric, metricIndex));
    if (value === null) return;

    const rawLabel =
      category === "Record"
        ? `Row ${index + 1}`
        : getValue(row, category, categoryIndex);

    const label =
      rawLabel === null || rawLabel === undefined || String(rawLabel).trim() === ""
        ? "Unknown"
        : String(rawLabel);

    totals.set(label, (totals.get(label) || 0) + value);
  });

  const data = Array.from(totals, ([label, value]) => ({
    label,
    value,
  }));

  return { category, metric, data };
}




export function getColumnStats(dataset) {
  if (!dataset) return [];

  const rows = Array.isArray(dataset.rows) ? dataset.rows : [];
  const columns = Array.isArray(dataset.columns)
    ? dataset.columns
    : rows.length
      ? Object.keys(rows[0])
      : [];

  return columns.map((column) => {
    const values = rows
      .map((row) => row?.[column])
      .filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
      );

    // Handle numbers stored as strings, including "1,200".
    const numericValues = values
      .map((value) => {
        if (typeof value === "number") return value;

        const text = String(value).trim().replace(/,/g, "");
        if (!text) return NaN;

        return Number(text);
      })
      .filter(Number.isFinite);

    const isNumeric =
      values.length > 0 && numericValues.length === values.length;

    const sum = numericValues.reduce((total, value) => total + value, 0);

    return {
      name: column,
      column,
      type: isNumeric ? "numeric" : "categorical",
      count: values.length,
      numericCount: numericValues.length,
      missing: rows.length - values.length,
      unique: new Set(values.map(String)).size,
      sum: isNumeric ? sum : null,
      average: isNumeric && numericValues.length
        ? sum / numericValues.length
        : null,
      min: isNumeric && numericValues.length
        ? Math.min(...numericValues)
        : null,
      max: isNumeric && numericValues.length
        ? Math.max(...numericValues)
        : null,
    };
  });
}


export function getInsights(dataset) {
  if (!dataset) return [];

  const stats = getColumnStats(dataset);

  if (!Array.isArray(stats)) return [];

  const insights = [];

  for (const column of stats) {
    if (column.missing > 0) {
      insights.push({
        title: `Missing values in ${column.name}`,
        description: `${column.missing} missing value(s) found.`,
        type: "warning",
      });
    }

    if (column.unique === 1 && column.count > 1) {
      insights.push({
        title: `Constant column: ${column.name}`,
        description: "Every non-empty value in this column is the same.",
        type: "info",
      });
    }
  }

  return insights;
}