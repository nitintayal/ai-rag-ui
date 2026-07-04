import { useEffect, useState } from "react";
import { API_BASE } from "../config";

let _tmpId = 0;
const tmpId = () => `_tmp_${++_tmpId}`;
const getToday = () => new Date().toISOString().slice(0, 10);

export default function TasksPanel({ token }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const emptyDraft = { title: "", description: "", due_date: "", priority: "medium", recurrence: "" };
  const [draft, setDraft] = useState(emptyDraft);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadTasks = async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = filter === "all" ? `${API_BASE}/tasks` : `${API_BASE}/tasks?status=${filter}`;
      const res = await fetch(url, { headers: getHeaders() });
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
    if (token) loadTasks();
  }, [filter, token]);

  const createTask = async () => {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    const id = tmpId();
    const optimistic = {
      id,
      title: draft.title,
      description: draft.description,
      due_date: draft.due_date || null,
      priority: draft.priority,
      recurrence: draft.recurrence || null,
      status: "pending",
      _pending: true,
    };
    setTasks((prev) => [optimistic, ...prev]);
    setDraft(emptyDraft);
    setIsCreating(false);
    try {
      const body = { ...draft };
      if (!body.recurrence) delete body.recurrence;
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const saved = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)));
    } catch (e) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError("Failed to create task.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdit = async (taskId) => {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    const prev = tasks.find((t) => t.id === taskId);
    const optimistic = { ...prev, ...draft, recurrence: draft.recurrence || null };
    setTasks((all) => all.map((t) => (t.id === taskId ? optimistic : t)));
    setEditingId(null);
    try {
      const body = { ...draft };
      if (!body.recurrence) delete body.recurrence;
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTasks((all) => all.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
      setTasks((all) => all.map((t) => (t.id === taskId ? prev : t)));
      setError("Failed to update task.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (task) => {
    setDraft({
      title: task.title || "",
      description: task.description || "",
      due_date: task.due_date || "",
      priority: task.priority || "medium",
      recurrence: task.recurrence || "",
    });
    setEditingId(task.id);
    setIsCreating(false);
  };

  const toggleComplete = async (task) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      console.error(e);
    }
  };

  const deleteTask = async (taskId) => {
    const removed = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error();
    } catch (e) {
      setTasks((prev) => [removed, ...prev]);
      setError("Failed to delete task.");
    }
  };

  const today = getToday();

  const priorityColor = {
    high: "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300",
    medium: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
    low: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300",
  };

  const dueDateLabel = (task) => {
    if (!task.due_date || task.status === "done") return null;
    if (task.due_date < today) return <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Overdue · {task.due_date}</span>;
    if (task.due_date === today) return <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Due today</span>;
    return <span className="text-xs text-slate-400 dark:text-slate-500">Due: {task.due_date}</span>;
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-4 pb-3 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Tasks</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">My Tasks</h2>
          </div>
          <button onClick={() => { setIsCreating(true); setEditingId(null); setDraft(emptyDraft); }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 dark:bg-blue-600 text-white active:scale-95"
            style={{ WebkitTapHighlightColor: "transparent" }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "in_progress", "done"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                filter === f
                  ? "bg-blue-700 dark:bg-blue-600 text-white"
                  : "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}>
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
        {isCreating && (
          <div className="rounded-2xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="space-y-3">
              <input type="text" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Task title"
                className="w-full rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 transition" />
              <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)" rows={2}
                className="w-full rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 transition resize-none" />
              <div className="flex gap-2 flex-wrap">
                <input type="date" value={draft.due_date} onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                  className="flex-1 min-w-[140px] rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 transition" />
                <select value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
                  className="rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 transition">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select value={draft.recurrence} onChange={(e) => setDraft((p) => ({ ...p, recurrence: e.target.value }))}
                  className="rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 transition">
                  <option value="">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={createTask} disabled={!draft.title.trim() || isSaving}
                className="flex-1 rounded-xl bg-blue-700 dark:bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent" }}>
                Create Task
              </button>
              <button onClick={() => setIsCreating(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-400 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="ml-3 text-rose-400 hover:text-rose-700">✕</button>
          </div>
        )}

        {isLoading && <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading tasks…</div>}

        {!isLoading && tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/50 p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No tasks yet.</p>
            <button onClick={() => { setIsCreating(true); setDraft(emptyDraft); }}
              className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-400 underline underline-offset-2">
              Create your first task
            </button>
          </div>
        )}

        {tasks.map((task) => {
          const overdue = task.due_date && task.due_date < today && task.status !== "done";
          const dueToday = task.due_date === today && task.status !== "done";

          if (editingId === task.id) {
            return (
              <div key={task.id} className="rounded-2xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                <div className="space-y-3">
                  <input type="text" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Task title"
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 transition" />
                  <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optional)" rows={2}
                    className="w-full rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-400 transition resize-none" />
                  <div className="flex gap-2 flex-wrap">
                    <input type="date" value={draft.due_date} onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                      className="flex-1 min-w-[140px] rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 transition" />
                    <select value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
                      className="rounded-xl border border-blue-200 dark:border-slate-600 bg-blue-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-400 transition">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => saveEdit(task.id)} disabled={!draft.title.trim() || isSaving}
                    className="flex-1 rounded-xl bg-blue-700 dark:bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
                    style={{ WebkitTapHighlightColor: "transparent" }}>
                    Save Changes
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 active:scale-[0.98]"
                    style={{ WebkitTapHighlightColor: "transparent" }}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={task.id}
              className={`rounded-2xl border bg-white dark:bg-slate-800 p-4 shadow-sm transition ${
                task._pending ? "border-blue-200/50 dark:border-slate-600/50 opacity-60"
                  : task.status === "done" ? "border-emerald-200 dark:border-emerald-800/50 opacity-70"
                  : overdue ? "border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-900/10"
                  : dueToday ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10"
                  : "border-slate-200 dark:border-slate-700"
              }`}>
              <div className="flex items-start gap-3">
                <button onClick={() => !task._pending && toggleComplete(task)}
                  className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 transition active:scale-95 ${
                    task.status === "done"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 dark:border-slate-500 hover:border-blue-500"
                  }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}>
                  {task.status === "done" && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold leading-snug ${task.status === "done" ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white"}`}>
                    {task.title}
                  </h3>
                  {task.description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[task.priority] || priorityColor.medium}`}>
                      {task.priority}
                    </span>
                    {dueDateLabel(task)}
                    {task.recurrence && <span className="text-xs text-blue-500 dark:text-blue-400">↻ {task.recurrence}</span>}
                    {task._pending && <span className="text-xs text-slate-400">Saving…</span>}
                  </div>
                </div>
              </div>
              {!task._pending && (
                <div className="mt-2 flex gap-1.5 justify-end">
                  <button onClick={() => startEdit(task)}
                    className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                    style={{ WebkitTapHighlightColor: "transparent" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteTask(task.id)}
                    className="rounded-lg border border-rose-200 dark:border-rose-800/50 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-95"
                    style={{ WebkitTapHighlightColor: "transparent" }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
