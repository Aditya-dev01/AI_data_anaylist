
import { useEffect, useRef, useState } from "react";
import { FiSend, FiCpu, FiUser, FiLoader } from "react-icons/fi";
import { askAI } from "../services/api";

export default function AIChat({ dataset }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! Upload a dataset and ask me a question about your data.",
    },
  ]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event) {
    event.preventDefault();

    const text = question.trim();
    if (!text || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text },
    ]);
    setQuestion("");
    setLoading(true);

    try {
      if (!dataset) {
        throw new Error("Please upload a dataset first.");
      }

      const datasetId =
        typeof dataset === "string"
          ? dataset
          : dataset.dataset_id || dataset.id || dataset.datasetId;

      if (!datasetId) {
        throw new Error(
          "Dataset ID is missing. Please upload the CSV again."
        );
      }

      const response = await askAI(text, dataset);
      const answer = response.answer || response.message;

      if (!answer) {
        throw new Error("The backend returned an empty answer.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: String(answer) },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Unable to get an answer: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
          <FiCpu size={22} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">
            AI Data Assistant
          </h2>
          <p className="text-sm text-slate-500">
            Connected to your Flask backend
          </p>
        </div>
        <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          API mode
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="h-fit rounded-full bg-indigo-100 p-2 text-indigo-600">
                <FiCpu size={16} />
              </div>
            )}

            <div
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm ${
                message.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {message.text}
            </div>

            {message.role === "user" && (
              <div className="h-fit rounded-full bg-slate-200 p-2 text-slate-600">
                <FiUser size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FiLoader className="animate-spin" />
            Analyzing your data...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-slate-200 p-4"
      >
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about your dataset..."
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiSend size={17} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </section>
  );
}
