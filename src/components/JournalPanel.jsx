import { useEffect, useState } from "react";
import { API_BASE } from "../config";

let _tmpId = 0;
const tmpId = () => `_tmp_${++_tmpId}`;

const JOURNAL_PAGE_SIZE = 10;
const USER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

function getCurrentTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: USER_TIME_ZONE });
}

function getCurrentDateValue() {
  return new Date().toLocaleDateString("en-CA", { timeZone: USER_TIME_ZONE });
}

function formatEntryDate(value) {
  if (!value) return getCurrentDateValue();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric", timeZone: USER_TIME_ZONE });
}

function formatEntryTime(value) {
  if (!value) return getCurrentTimeLabel();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: USER_TIME_ZONE });
}

function mapApiEntryToCard(entry) {
  return {
    id: entry.id,
    title: entry.title || "Untitled Entry",
    mood: entry.mood || "Fresh",
    body: entry.content,
    entryDate: formatEntryDate(entry.entry_date),
    time: formatEntryTime(entry.created_at || entry.entry_date),
  };
}

export default function JournalPanel({ token }) {
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  const [draft, setDraft] = useState({ title: "", mood: "Fresh", body: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMoreEntries, setHasMoreEntries] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadEntries = async ({ nextOffset = 0, append = false } = {}) => {
    append ? setIsLoadingMore(true) : setIsLoadingEntries(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_BASE}/journal/entries?limit=${JOURNAL_PAGE_SIZE}&offset=${nextOffset}`, { headers: getHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      const page = await res.json();
      const mapped = page.items.map(mapApiEntryToCard);
      setEntries((prev) => (append ? [...prev, ...mapped] : mapped));
      setOffset(page.offset + page.items.length);
      setHasMoreEntries(page.has_more);
      setTotalEntries(page.total);
      setIsShowingSearchResults(false);
    } catch (err) {
      setLoadError("Unable to load journal entries.");
      console.error(err);
    } finally {
      append ? setIsLoadingMore(false) : setIsLoadingEntries(false);
    }
  };

  useEffect(() => { if (token) loadEntries(); }, [token]);

  useEffect(() => {
    if (!token) return;
    const q = searchQuery.trim();
    const id = setTimeout(() => (q ? handleSearch(q) : loadEntries()), 250);
    return () => clearTimeout(id);
  }, [searchQuery, token]);

  const startNewEntry = () => {
    setDraft({ title: "", mood: "Fresh", body: "" });
    setEditingEntryId(null);
    setSaveError("");
    setIsCreating(true);
  };

  const cancelDraft = () => { setEditingEntryId(null); setSaveError(""); setIsCreating(false); };

  const startEditEntry = (entry) => {
    setDraft({ title: entry.title, mood: entry.mood, body: entry.body });
    setEditingEntryId(entry.id);
    setSaveError("");
    setIsCreating(true);
  };

  const saveDraft = async () => {
    const title = draft.title.trim();
    const body = draft.body.trim();
    const mood = draft.mood.trim();
    if (!title || !body || isSaving) return;
    setIsSaving(true);
    setSaveError("");

    if (editingEntryId) {
      const prev = entries.find((e) => e.id === editingEntryId);
      const optimistic = { ...prev, title, body, mood };
      setEntries((all) => [optimistic, ...all.filter((e) => e.id !== editingEntryId)]);
      setEditingEntryId(null);
      setIsCreating(false);
      setDraft({ title: "", mood: "Fresh", body: "" });
      try {
        const saved = await (await fetch(`${API_BASE}/journal/entries/${optimistic.id}`, {
          method: "PATCH", headers: getHeaders(),
          body: JSON.stringify({ title, content: body, mood: mood || null, entry_date: getCurrentDateValue() }),
        })).json();
        setEntries((all) => all.map((e) => (e.id === optimistic.id ? mapApiEntryToCard(saved) : e)));
      } catch {
        setEntries((all) => all.map((e) => (e.id === optimistic.id ? prev : e)));
        setSaveError("Unable to update journal entry.");
      } finally { setIsSaving(false); }
      return;
    }

    const id = tmpId();
    const optimistic = { id, title, body, mood, entryDate: formatEntryDate(null), time: getCurrentTimeLabel(), _pending: true };
    setEntries((prev) => [optimistic, ...prev]);
    setTotalEntries((prev) => prev + 1);
    setDraft({ title: "", mood: "Fresh", body: "" });
    setIsCreating(false);
    try {
      const saved = await (await fetch(`${API_BASE}/journal/entries`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ title, content: body, mood: mood || null, entry_date: getCurrentDateValue() }),
      })).json();
      setEntries((prev) => prev.map((e) => (e.id === id ? mapApiEntryToCard(saved) : e)));
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotalEntries((prev) => Math.max(0, prev - 1));
      setSaveError("Unable to save journal entry.");
    } finally { setIsSaving(false); }
  };

  const handleDeleteEntry = async (entryId) => {
    if (deletingEntryId || isSaving) return;
    const removed = entries.find((e) => e.id === entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setTotalEntries((prev) => Math.max(0, prev - 1));
    if (editingEntryId === entryId) cancelDraft();
    setDeletingEntryId(entryId);
    try {
      const res = await fetch(`${API_BASE}/journal/entries/${entryId}`, { method: "DELETE", headers: getHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setEntries((prev) => [removed, ...prev]);
      setTotalEntries((prev) => prev + 1);
      setLoadError("Unable to delete journal entry.");
    } finally { setDeletingEntryId(null); }
  };

  const handleSearch = async (rawQuery = searchQuery) => {
    const query = rawQuery.trim();
    if (!query || isSearching) return;
    setIsSearching(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_BASE}/journal/search`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ query, k: 10 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.map((item) => mapApiEntryToCard(item.entry)));
      setIsShowingSearchResults(true);
      setHasMoreEntries(false);
    } catch {
      setLoadError("Unable to search journal entries.");
    } finally { setIsSearching(false); }
  };

  const clearSearch = () => { setSearchQuery(""); loadEntries(); };

  return (
    <div className="flex h-full flex-col bg-amber-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-amber-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-4 pb-3 sm:px-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Journal</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">My Journal</h2>
          </div>
          <button
            onClick={startNewEntry}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-900 dark:bg-amber-600 text-white active:scale-95"
            style={{ WebkitTapHighlightColor: "transparent" }}
            title="New entry"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries…"
              className="w-full rounded-xl border border-amber-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 py-2.5 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-400 dark:focus:border-amber-500 transition"
            />
          </div>
          {isShowingSearchResults && (
            <button
              onClick={clearSearch}
              className="rounded-xl border border-amber-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-medium text-amber-900 dark:text-amber-400 active:scale-95"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Entry count */}
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {isSearching ? "Searching…" : isShowingSearchResults ? `${entries.length} results` : `${entries.length} of ${totalEntries} entries`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-3">
        {/* Draft form */}
        {isCreating && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-600/50 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {editingEntryId ? "Edit entry" : "New entry"}
              </h3>
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">Draft</span>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-400 transition"
              />
              <input
                type="text"
                value={draft.mood}
                onChange={(e) => setDraft((p) => ({ ...p, mood: e.target.value }))}
                placeholder="Mood / tag"
                className="w-full rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-400 transition"
              />
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
                placeholder="Write your note…"
                rows={5}
                className="w-full rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-4 py-3 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-400 transition resize-none"
              />
            </div>
            {saveError && <p className="mt-2 text-sm text-rose-600">{saveError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveDraft}
                disabled={!draft.title.trim() || !draft.body.trim() || isSaving}
                className="flex-1 rounded-xl bg-amber-900 dark:bg-amber-700 py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {isSaving ? "Saving…" : editingEntryId ? "Update" : "Save"}
              </button>
              <button
                onClick={cancelDraft}
                disabled={isSaving}
                className="rounded-xl border border-amber-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-amber-900 dark:text-amber-400 bg-white dark:bg-slate-700 active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-3 text-sm text-rose-700 dark:text-rose-400">
            {loadError}
          </div>
        )}

        {/* Loading */}
        {isLoadingEntries && (
          <div className="py-10 text-center text-sm text-slate-400">Loading entries…</div>
        )}

        {/* Empty */}
        {!isLoadingEntries && !loadError && entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-amber-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/50 p-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No entries yet.</p>
            <button onClick={startNewEntry} className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-400 underline underline-offset-2">
              Write your first entry
            </button>
          </div>
        )}

        {/* Entry cards */}
        {entries.map((entry) => (
          <article
            key={entry.id}
            className={`rounded-2xl border bg-white dark:bg-slate-800 p-4 shadow-sm transition ${
              entry._pending ? "border-amber-200/50 dark:border-slate-600/50 opacity-60" : "border-amber-200/80 dark:border-slate-700"
            }`}
          >
            {/* Top row: title + mood badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white leading-snug flex-1 min-w-0 break-words">{entry.title}</h3>
              <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                {entry.mood}
              </span>
            </div>

            {/* Date */}
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{entry.entryDate} · {entry.time}</p>

            {/* Body */}
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{entry.body}</p>

            {/* Actions */}
            <div className="mt-3 flex gap-2 pt-3 border-t border-amber-100 dark:border-slate-700">
              <button
                onClick={() => startEditEntry(entry)}
                disabled={isSaving || deletingEntryId === entry.id}
                className="flex-1 rounded-xl border border-amber-300 dark:border-slate-600 py-2 text-xs font-semibold text-amber-900 dark:text-amber-400 bg-amber-50 dark:bg-slate-700 disabled:opacity-40 active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteEntry(entry.id)}
                disabled={isSaving || deletingEntryId === entry.id}
                className="flex-1 rounded-xl border border-rose-200 dark:border-rose-800/50 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 disabled:opacity-40 active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {deletingEntryId === entry.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </article>
        ))}

        {/* Load more */}
        {!isLoadingEntries && !isShowingSearchResults && entries.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={() => loadEntries({ nextOffset: offset, append: true })}
              disabled={!hasMoreEntries || isLoadingMore}
              className="rounded-xl border border-amber-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-amber-900 dark:text-amber-400 disabled:opacity-40 active:scale-95"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isLoadingMore ? "Loading…" : hasMoreEntries ? "Load more" : "All loaded"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
