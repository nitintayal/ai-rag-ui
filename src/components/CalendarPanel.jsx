import { useEffect, useState } from "react";
import { API_BASE } from "../config";

let _tmpId = 0;
const tmpId = () => `_tmp_${++_tmpId}`;

export default function CalendarPanel({ token }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rangeFilter, setRangeFilter] = useState("upcoming");
  const today = new Date().toISOString().slice(0, 10);

  const emptyDraft = { title: "", start_time: "", end_time: "", description: "", location: "", all_day: false, recurrence: "" };
  const [draft, setDraft] = useState(emptyDraft);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const rangeParams = () => {
    const now = new Date();
    if (rangeFilter === "upcoming") return `start=${today}`;
    if (rangeFilter === "week") {
      const end = new Date(now); end.setDate(end.getDate() + 7);
      return `start=${today}&end=${end.toISOString().slice(0, 10)}`;
    }
    if (rangeFilter === "month") {
      const end = new Date(now); end.setMonth(end.getMonth() + 1);
      return `start=${today}&end=${end.toISOString().slice(0, 10)}`;
    }
    return "";
  };

  const loadEvents = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/calendar/events?${rangeParams()}&limit=100`, { headers: getHeaders() });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setEvents(await res.json());
    } catch (e) {
      setError("Unable to load events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadEvents();
  }, [rangeFilter, token]);

  const createEvent = async () => {
    if (!draft.title.trim() || !draft.start_time || isSaving) return;
    setIsSaving(true);
    const id = tmpId();
    const optimistic = { id, ...draft, recurrence: draft.recurrence || null, _pending: true };
    setEvents((prev) => [optimistic, ...prev]);
    setDraft(emptyDraft);
    setIsCreating(false);
    try {
      const body = { ...draft };
      if (!body.end_time) delete body.end_time;
      if (!body.description) delete body.description;
      if (!body.location) delete body.location;
      if (!body.recurrence) delete body.recurrence;
      const res = await fetch(`${API_BASE}/calendar/events`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === id ? saved : e)));
    } catch (e) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setError("Failed to create event.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdit = async (eventId) => {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    const prev = events.find((e) => e.id === eventId);
    const optimistic = { ...prev, ...draft, recurrence: draft.recurrence || null };
    setEvents((all) => all.map((e) => (e.id === eventId ? optimistic : e)));
    setEditingId(null);
    try {
      const body = { ...draft };
      if (!body.recurrence) delete body.recurrence;
      const res = await fetch(`${API_BASE}/calendar/events/${eventId}`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((all) => all.map((e) => (e.id === eventId ? updated : e)));
    } catch (e) {
      setEvents((all) => all.map((e) => (e.id === eventId ? prev : e)));
      setError("Failed to update event.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (event) => {
    setDraft({
      title: event.title || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      description: event.description || "",
      location: event.location || "",
      all_day: event.all_day || false,
      recurrence: event.recurrence || "",
    });
    setEditingId(event.id);
    setIsCreating(false);
  };

  const deleteEvent = async (eventId) => {
    const removed = events.find((e) => e.id === eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    try {
      const res = await fetch(`${API_BASE}/calendar/events/${eventId}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error();
    } catch (e) {
      setEvents((prev) => [removed, ...prev]);
      setError("Failed to delete event.");
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return "";
    try {
      return new Date(dt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dt; }
  };

  const inputCls = "w-full rounded-xl border border-violet-200 dark:border-slate-600 bg-violet-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-violet-400 transition";

  const renderForm = (onSave, onCancel, saveLabel) => (
    <div className="rounded-2xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="space-y-3">
        <input type="text" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          placeholder="Event title" className={inputCls} />
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Start</label>
            <input type="datetime-local" value={draft.start_time} onChange={(e) => setDraft((p) => ({ ...p, start_time: e.target.value }))}
              className={inputCls} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">End (optional)</label>
            <input type="datetime-local" value={draft.end_time} onChange={(e) => setDraft((p) => ({ ...p, end_time: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <input type="text" value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
          placeholder="Location (optional)" className={inputCls} />
        <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description (optional)" rows={2} className={`${inputCls} resize-none`} />
        <div className="flex gap-3 items-center flex-wrap">
          <select value={draft.recurrence} onChange={(e) => setDraft((p) => ({ ...p, recurrence: e.target.value }))}
            className="rounded-xl border border-violet-200 dark:border-slate-600 bg-violet-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-400 transition">
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={draft.all_day} onChange={(e) => setDraft((p) => ({ ...p, all_day: e.target.checked }))} className="rounded" />
            All day
          </label>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onSave} disabled={!draft.title.trim() || !draft.start_time || isSaving}
          className="flex-1 rounded-xl bg-violet-700 dark:bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
          style={{ WebkitTapHighlightColor: "transparent" }}>
          {saveLabel}
        </button>
        <button onClick={onCancel}
          className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 active:scale-[0.98]"
          style={{ WebkitTapHighlightColor: "transparent" }}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-4 pb-3 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Calendar</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">My Calendar</h2>
          </div>
          <button onClick={() => { setIsCreating(true); setEditingId(null); setDraft(emptyDraft); }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-700 dark:bg-violet-600 text-white active:scale-95"
            style={{ WebkitTapHighlightColor: "transparent" }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ key: "upcoming", label: "Upcoming" }, { key: "week", label: "This Week" }, { key: "month", label: "Month" }, { key: "all", label: "All" }].map(({ key, label }) => (
            <button key={key} onClick={() => setRangeFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                rangeFilter === key
                  ? "bg-violet-700 dark:bg-violet-600 text-white"
                  : "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
        {isCreating && renderForm(createEvent, () => setIsCreating(false), "Create Event")}

        {error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-400 flex items-center justify-between">
            {error}
            <button onClick={() => setError("")} className="ml-3 text-rose-400 hover:text-rose-700">✕</button>
          </div>
        )}

        {isLoading && <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading events…</div>}

        {!isLoading && events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/50 p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No events yet.</p>
            <button onClick={() => { setIsCreating(true); setDraft(emptyDraft); }}
              className="mt-2 text-sm font-medium text-violet-700 dark:text-violet-400 underline underline-offset-2">
              Create your first event
            </button>
          </div>
        )}

        {events.map((event) => {
          // Fix #18: compare as Date objects, not strings
          const isPast = !event._pending && event.start_time && new Date(event.start_time) < new Date();
          if (editingId === event.id) {
            return <div key={event.id}>{renderForm(() => saveEdit(event.id), () => setEditingId(null), "Save Changes")}</div>;
          }
          return (
            <div key={event.id}
              className={`rounded-2xl border bg-white dark:bg-slate-800 p-4 shadow-sm transition ${
                event._pending ? "border-violet-200/50 dark:border-slate-600/50 opacity-60"
                  : isPast ? "border-slate-200 dark:border-slate-700 opacity-60"
                  : "border-violet-200/80 dark:border-slate-700"
              }`}>
              <div className="min-w-0 mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white break-words">{event.title}</h3>
                <p className="mt-0.5 text-sm text-violet-700 dark:text-violet-400 font-medium">
                  {formatDateTime(event.start_time)}
                  {event.end_time && <span className="text-slate-400 dark:text-slate-500"> – {formatDateTime(event.end_time)}</span>}
                </p>
                {event.location && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">📍 {event.location}</p>}
                {event.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{event.description}</p>}
                <div className="mt-1 flex gap-2 flex-wrap">
                  {event.recurrence && <span className="text-xs text-violet-500 dark:text-violet-400">↻ {event.recurrence}</span>}
                  {event._pending && <span className="text-xs text-slate-400">Saving…</span>}
                </div>
              </div>
              {!event._pending && (
                <div className="mt-2 flex gap-1.5 justify-end">
                  <button onClick={() => startEdit(event)}
                    className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                    style={{ WebkitTapHighlightColor: "transparent" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteEvent(event.id)}
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
