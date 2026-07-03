import { useEffect, useState } from "react";
import { API_BASE } from "../config";

const TODAY = new Date().toISOString().slice(0, 10);
let _tmpId = 0;
const tmpId = () => `_tmp_${++_tmpId}`;

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

  const priorityColor = {
    high: "bg-rose-100 text-rose-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-emerald-100 text-emerald-800",
  };

  const dueDateLabel = (task) => {
    if (!task.due_date || task.status === "done") return null;
    if (task.due_date < TODAY) return <span className="text-xs font-semibold text-rose-600">Overdue · {task.due_date}</span>;
    if (task.due_date === TODAY) return <span className="text-xs font-semibold text-amber-600">Due today</span>;
    return <span className="text-xs text-slate-400">Due: {task.due_date}</span>;
  };

  const TaskForm = ({ onSave, onCancel, saveLabel }) => (
    <div className="rounded-[22px] border border-blue-300 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <input type="text" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          placeholder="Task title" autoFocus
          className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400" />
        <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description (optional)" rows={2}
          className="w-full rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400" />
        <div className="flex gap-3 flex-wrap">
          <input type="date" value={draft.due_date} onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
            className="flex-1 min-w-[140px] rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400" />
          <select value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
            className="rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={draft.recurrence} onChange={(e) => setDraft((p) => ({ ...p, recurrence: e.target.value }))}
            className="rounded-xl border border-blue-200 px-4 py-3 outline-none focus:border-blue-400">
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={onSave} disabled={!draft.title.trim() || isSaving}
          className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:bg-blue-300">
          {saveLabel}
        </button>
        <button onClick={onCancel}
          className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-50">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[28px] border border-blue-200/70 bg-[linear-gradient(180deg,#f0f7ff_0%,#e8f1ff_100%)] shadow-[0_24px_80px_rgba(37,99,235,0.10)]">
      <div className="border-b border-blue-200/80 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">Tasks</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Task Manager</h2>
          </div>
          <button type="button" onClick={() => { setIsCreating(true); setEditingId(null); setDraft(emptyDraft); }}
            className="rounded-full border border-blue-300 bg-white/70 px-4 py-2 text-sm font-medium text-blue-900 transition hover:bg-white">
            New Task
          </button>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          {["all", "pending", "in_progress", "done"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-blue-900 text-white" : "border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"}`}>
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
        {isCreating && (
          <TaskForm onSave={createTask} onCancel={() => setIsCreating(false)} saveLabel="Create Task" />
        )}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="ml-3 text-rose-400 hover:text-rose-700">✕</button>
          </div>
        )}

        {isLoading && (
          <div className="rounded-[22px] border border-blue-200 bg-white/75 p-4 text-sm text-slate-500">Loading tasks...</div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-blue-300 bg-white/70 p-5 text-sm leading-6 text-slate-500">
            No tasks yet. Create one or ask the assistant to create a task for you.
          </div>
        )}

        {tasks.map((task) => {
          const overdue = task.due_date && task.due_date < TODAY && task.status !== "done";
          const dueToday = task.due_date === TODAY && task.status !== "done";

          if (editingId === task.id) {
            return <div key={task.id}><TaskForm onSave={() => saveEdit(task.id)} onCancel={() => setEditingId(null)} saveLabel="Save Changes" /></div>;
          }

          return (
            <div key={task.id}
              className={`rounded-[22px] border bg-white/75 p-4 shadow-sm backdrop-blur transition ${
                task._pending ? "border-blue-200/50 opacity-60"
                  : task.status === "done" ? "border-emerald-200/80 opacity-70"
                  : overdue ? "border-rose-300 bg-rose-50/50"
                  : dueToday ? "border-amber-300 bg-amber-50/50"
                  : "border-blue-200/80"
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => !task._pending && toggleComplete(task)}
                    className={`mt-1 h-5 w-5 shrink-0 rounded border-2 transition ${
                      task.status === "done" ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 hover:border-blue-500"
                    } ${task._pending ? "cursor-default" : ""}`}
                    title={task.status === "done" ? "Mark pending" : "Mark done"}>
                    {task.status === "done" && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <h3 className={`text-base font-semibold ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {task.title}
                    </h3>
                    {task.description && <p className="mt-1 text-sm text-slate-500">{task.description}</p>}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {dueDateLabel(task)}
                      {task.recurrence && <span className="text-xs text-blue-500">↻ {task.recurrence}</span>}
                      {task._pending && <span className="text-xs text-slate-400">Saving…</span>}
                    </div>
                  </div>
                </div>
                {!task._pending && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${priorityColor[task.priority] || priorityColor.medium}`}>
                      {task.priority}
                    </span>
                    <button onClick={() => startEdit(task)}
                      className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50">
                      Edit
                    </button>
                    <button onClick={() => deleteTask(task.id)}
                      className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
