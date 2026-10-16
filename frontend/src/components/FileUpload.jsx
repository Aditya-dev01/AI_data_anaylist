import { useRef, useState } from "react";
import {
  FiUploadCloud,
  FiFile,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import { uploadDataset } from "../services/api";

const ACCEPTED_EXTENSIONS = ["csv", "json", "xlsx", "xls"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function FileUpload({ onDataLoaded }) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFile(null);
      setError("Unsupported file. Select CSV, JSON, XLSX, or XLS.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("File is too large. The maximum file size is 20 MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!file || loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const dataset = await uploadDataset(file);

      if (!dataset.dataset_id) {
        throw new Error(
          "The backend did not return a dataset ID. Please check the Flask response."
        );
      }

      onDataLoaded?.(dataset);

      setSuccess(`${file.name} uploaded successfully.`);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err?.message ||
          "Upload failed. Check that the Flask backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <label
        htmlFor="dataset-file"
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-indigo-500"
      >
        <FiUploadCloud className="mb-3 h-9 w-9 text-indigo-600 dark:text-indigo-400" />

        <span className="font-semibold">
          Choose a dataset to upload
        </span>

        <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          CSV, JSON, XLSX, or XLS · Maximum 20 MB
        </span>

        <input
          ref={inputRef}
          id="dataset-file"
          type="file"
          accept=".csv,.json,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
          className="sr-only"
        />
      </label>

      {file && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <FiFile className="h-5 w-5 shrink-0 text-indigo-600" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {file.name}
            </p>

            <p className="text-xs text-slate-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {success && (
        <p
          role="status"
          className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400"
        >
          <FiCheckCircle className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <FiLoader className="h-4 w-4 animate-spin" />
            Uploading and analyzing...
          </>
        ) : (
          <>
            <FiUploadCloud className="h-4 w-4" />
            Upload dataset
          </>
        )}
      </button>
    </form>
  );
}