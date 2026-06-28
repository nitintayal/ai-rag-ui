import { useEffect, useState } from "react";
import { API_BASE } from "../config";
const USER_ID = "default-user";

export default function TasksPanel({ token }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  });

  const hdrs = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const loadTasks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = filter === "all" ? `${API_BASE}/tasks` : `${API_BASE}/tasks?status=${filter}`;
      const res = await fetch(url, { headers: hdrs });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setTasks(await res.json());
    } catch (e) {
      setError("Unable to load tasks.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const createTask = async () => {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST", headers: hdrs, body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setDraft({ title: "", description: "", due_date: "", priority: "medium" });
      setIsCreating(false);
    } catch (e) {
      setError("Failed to create task.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: "PATCH", headers: hdrs, body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE", headers: hdrs });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error(e);
    }
  };

  const priorityColor = {
    high: "bg-rose-100 text-rose-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-emerald-100 text-emerald-800",
  };

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[28px] border border-blue-200/70 bg-[linear-gradient(180deg,#f0f7ff_0%,#e8f1ff_100%)] shadow-[0_24px_80px_rgba(37,99,235,0.10)]">
      <div className="border-b border-blue-200/80 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">
              Tasks
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Task Manager
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-full border border-blue-300 bg-white/70 px-4 py-2 text-sm font-medium text-blue-900 transition hover:bg-white"
          >
            New Task
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {["all", "pending", "in_progress", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-blue-900 text-white"
                  : "border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
              }`}
            >
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
        {isCreating && (
          <div className="rounded-[22px] border border-blue-300 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">New Task</h3>
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400"
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
                className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400"
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                  className="flex-1 rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400"
                />
                <select
                  value={draft.priority}
                  onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
                  className="rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={createTask}
                disabled={!draft.title.trim() || isSaving}
                className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:bg-blue-300"
              >
                {isSaving ? "Saving..." : "Create Task"}
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-[22px] border border-blue-200 bg-white/75 p-4 text-sm text-slate-500">
            Loading tasks...
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-blue-300 bg-white/70 p-5 text-sm leading-6 text-slate-500">
            No tasks yet. Create one or ask the assistant to create a task for you.
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-[22px] border bg-white/75 p-4 shadow-sm backdrop-blur transition ${
              task.status === "done"
                ? "border-emerald-200/80 opacity-70"
                : "border-blue-200/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleComplete(task)}
                  className={`mt-1 h-5 w-5 shrink-0 rounded border-2 transition ${
                    task.status === "done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 hover:border-blue-500"
                  }`}
                  title={task.status === "done" ? "Mark pending" : "Mark done"}
                >
                  {task.status === "done" && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <div>
                  <h3
                    className={`text-base font-semibold ${
                      task.status === "done"
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="mt-1 text-xs text-slate-400">Due: {task.due_date}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                    priorityColor[task.priority] || priorityColor.medium
                  }`}
                >
                  {task.priority}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
