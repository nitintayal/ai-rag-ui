import { useEffect, useState } from "react";
import { API_BASE } from "../config";

const TODAY = new Date().toISOString().slice(0, 10);

export default function CalendarPanel({ token }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rangeFilter, setRangeFilter] = useState("upcoming");

  const emptyDraft = { title: "", start_time: "", end_time: "", description: "", location: "", all_day: false, recurrence: "" };
  const [draft, setDraft] = useState(emptyDraft);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const rangeParams = () => {
    const now = new Date();
    if (rangeFilter === "upcoming") return `start=${TODAY}`;
    if (rangeFilter === "week") {
      const end = new Date(now); end.setDate(end.getDate() + 7);
      return `start=${TODAY}&end=${end.toISOString().slice(0, 10)}`;
    }
    if (rangeFilter === "month") {
      const end = new Date(now); end.setMonth(end.getMonth() + 1);
      return `start=${TODAY}&end=${end.toISOString().slice(0, 10)}`;
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
      console.error(e);
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
    try {
      const body = { ...draft };
      if (!body.end_time) delete body.end_time;
      if (!body.description) delete body.description;
      if (!body.location) delete body.location;
      if (!body.recurrence) delete body.recurrence;
      const res = await fetch(`${API_BASE}/calendar/events`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setEvents((prev) => [await res.json(), ...prev]);
      setDraft(emptyDraft);
      setIsCreating(false);
    } catch (e) {
      setError("Failed to create event.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdit = async (eventId) => {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const body = { ...draft };
      if (!body.recurrence) delete body.recurrence;
      const res = await fetch(`${API_BASE}/calendar/events/${eventId}`, {
        method: "PATCH", headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
      setEditingId(null);
    } catch (e) {
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
    try {
      await fetch(`${API_BASE}/calendar/events/${eventId}`, { method: "DELETE", headers: getHeaders() });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e) {
      console.error(e);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return "";
    try {
      return new Date(dt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dt;
    }
  };

  const EventForm = ({ onSave, onCancel, saveLabel }) => (
    <div className="rounded-[22px] border border-violet-300 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <input type="text" value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          placeholder="Event title" className="w-full rounded-xl border border-violet-200 px-4 py-3 outline-none focus:border-violet-400" />
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-500 mb-1 block">Start</label>
            <input type="datetime-local" value={draft.start_time} onChange={(e) => setDraft((p) => ({ ...p, start_time: e.target.value }))}
              className="w-full rounded-xl border border-violet-200 px-4 py-3 outline-none focus:border-violet-400" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-slate-500 mb-1 block">End (optional)</label>
            <input type="datetime-local" value={draft.end_time} onChange={(e) => setDraft((p) => ({ ...p, end_time: e.target.value }))}
              className="w-full rounded-xl border border-violet-200 px-4 py-3 outline-none focus:border-violet-400" />
          </div>
        </div>
        <input type="text" value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
          placeholder="Location (optional)" className="w-full rounded-xl border border-violet-200 px-4 py-3 outline-none focus:border-violet-400" />
        <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description (optional)" rows={2} className="w-full rounded-xl border border-violet-200 px-4 py-3 outline-none focus:border-violet-400" />
        <div className="flex gap-3 items-center flex-wrap">
          <select value={draft.recurrence} onChange={(e) => setDraft((p) => ({ ...p, recurrence: e.target.value }))}
            className="rounded-xl border border-violet-200 px-4 py-3 outline-none focus:border-violet-400">
            <option value="">No recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={draft.all_day} onChange={(e) => setDraft((p) => ({ ...p, all_day: e.target.checked }))}
              className="rounded" />
            All day
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={onSave} disabled={!draft.title.trim() || !draft.start_time || isSaving}
          className="rounded-xl bg-violet-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800 disabled:bg-violet-300">
          {isSaving ? "Saving..." : saveLabel}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 transition hover:bg-violet-50">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[28px] border border-violet-200/70 bg-[linear-gradient(180deg,#f5f0ff_0%,#ede8ff_100%)] shadow-[0_24px_80px_rgba(109,40,217,0.10)]">
      <div className="border-b border-violet-200/80 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-700">Calendar</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Events</h2>
          </div>
          <button type="button" onClick={() => { setIsCreating(true); setEditingId(null); setDraft(emptyDraft); }}
            className="rounded-full border border-violet-300 bg-white/70 px-4 py-2 text-sm font-medium text-violet-900 transition hover:bg-white">
            New Event
          </button>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          {[
            { key: "upcoming", label: "Upcoming" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "all", label: "All" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setRangeFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${rangeFilter === key ? "bg-violet-900 text-white" : "border border-violet-200 bg-white text-violet-800 hover:bg-violet-50"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
        {isCreating && (
          <EventForm onSave={createEvent} onCancel={() => setIsCreating(false)} saveLabel="Create Event" />
        )}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        {isLoading && (
          <div className="rounded-[22px] border border-violet-200 bg-white/75 p-4 text-sm text-slate-500">Loading events...</div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-violet-300 bg-white/70 p-5 text-sm leading-6 text-slate-500">
            No events yet. Create one or ask the assistant to schedule an event for you.
          </div>
        )}

        {events.map((event) => {
          const isPast = event.start_time && event.start_time < new Date().toISOString();
          if (editingId === event.id) {
            return <div key={event.id}><EventForm onSave={() => saveEdit(event.id)} onCancel={() => setEditingId(null)} saveLabel="Save Changes" /></div>;
          }
          return (
            <div key={event.id}
              className={`rounded-[22px] border bg-white/75 p-4 shadow-sm backdrop-blur transition ${isPast ? "border-slate-200 opacity-60" : "border-violet-200/80"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">{event.title}</h3>
                  <p className="mt-0.5 text-sm text-violet-700 font-medium">
                    {formatDateTime(event.start_time)}
                    {event.end_time && <span className="text-slate-400"> – {formatDateTime(event.end_time)}</span>}
                  </p>
                  {event.location && (
                    <p className="mt-0.5 text-xs text-slate-500">📍 {event.location}</p>
                  )}
                  {event.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{event.description}</p>
                  )}
                  {event.recurrence && (
                    <span className="mt-1 inline-block text-xs text-violet-500">↻ {event.recurrence}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(event)}
                    className="rounded-lg border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-50">
                    Edit
                  </button>
                  <button onClick={() => deleteEvent(event.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
