import { useEffect, useState } from "react";

const JOURNAL_USER_ID = "demo-user";
const JOURNAL_PAGE_SIZE = 10;
const USER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

function getCurrentTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: USER_TIME_ZONE,
  });
}

function getCurrentDateValue() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: USER_TIME_ZONE,
  });
}

function formatEntryDate(value) {
  if (!value) {
    return getCurrentDateValue();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: USER_TIME_ZONE,
  });
}

function formatEntryTime(value) {
  if (!value) {
    return getCurrentTimeLabel();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: USER_TIME_ZONE,
  });
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

export default function JournalPanel() {
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    mood: "Fresh",
    body: "",
  });
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

  const loadEntries = async ({ nextOffset = 0, append = false } = {}) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingEntries(true);
    }
    setLoadError("");

    try {
      const response = await fetch(
        `http://localhost:8000/journal/entries?user_id=${encodeURIComponent(
          JOURNAL_USER_ID
        )}&limit=${JOURNAL_PAGE_SIZE}&offset=${nextOffset}`
      );

      if (!response.ok) {
        throw new Error(`Load failed with status ${response.status}`);
      }

      const page = await response.json();
      const mappedEntries = page.items.map(mapApiEntryToCard);

      setEntries((prev) => (append ? [...prev, ...mappedEntries] : mappedEntries));
      setOffset(page.offset + page.items.length);
      setHasMoreEntries(page.has_more);
      setTotalEntries(page.total);
      setIsShowingSearchResults(false);
    } catch (error) {
      setLoadError("Unable to load saved journal entries from the backend.");
      console.error(error);
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoadingEntries(false);
      }
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    const timeoutId = setTimeout(() => {
      if (query) {
        handleSearch(query);
        return;
      }

      loadEntries();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const startNewEntry = () => {
    setDraft({
      title: "",
      mood: "Fresh",
      body: "",
    });
    setEditingEntryId(null);
    setSaveError("");
    setIsCreating(true);
  };

  const cancelDraft = () => {
    setEditingEntryId(null);
    setSaveError("");
    setIsCreating(false);
  };

  const startEditEntry = (entry) => {
    setDraft({
      title: entry.title,
      mood: entry.mood,
      body: entry.body,
    });
    setEditingEntryId(entry.id);
    setSaveError("");
    setIsCreating(true);
  };

  const createJournalEntry = async ({ title, body, mood }) => {
    const response = await fetch("http://localhost:8000/journal/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: JOURNAL_USER_ID,
        title,
        content: body,
        mood: mood || null,
        entry_date: getCurrentDateValue(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Save failed with status ${response.status}`);
    }

    return response.json();
  };

  const deleteJournalEntry = async (entryId) => {
    const response = await fetch(
      `http://localhost:8000/journal/entries/${entryId}?user_id=${encodeURIComponent(
        JOURNAL_USER_ID
      )}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`Delete failed with status ${response.status}`);
    }
  };

  const saveDraft = async () => {
    const title = draft.title.trim();
    const body = draft.body.trim();
    const mood = draft.mood.trim();

    if (!title || !body || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const savedEntry = await createJournalEntry({ title, body, mood });
      const mappedEntry = mapApiEntryToCard(savedEntry);

      if (editingEntryId) {
        await deleteJournalEntry(editingEntryId);
        setEntries((prev) => [
          mappedEntry,
          ...prev.filter((entry) => entry.id !== editingEntryId),
        ]);
      } else {
        setEntries((prev) => [mappedEntry, ...prev]);
        setTotalEntries((prev) => prev + 1);
      }

      setDraft({
        title: "",
        mood: "Fresh",
        body: "",
      });
      setEditingEntryId(null);
      setIsCreating(false);
    } catch (error) {
      setSaveError(
        editingEntryId
          ? "Unable to update journal entry in the backend."
          : "Unable to save journal entry to the backend."
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (deletingEntryId || isSaving) {
      return;
    }

    setDeletingEntryId(entryId);
    setLoadError("");

    try {
      await deleteJournalEntry(entryId);
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      setTotalEntries((prev) => Math.max(0, prev - 1));

      if (editingEntryId === entryId) {
        cancelDraft();
      }
    } catch (error) {
      setLoadError("Unable to delete journal entry from the backend.");
      console.error(error);
    } finally {
      setDeletingEntryId(null);
    }
  };

  const handleSearch = async (rawQuery = searchQuery) => {
    const query = rawQuery.trim();

    if (!query || isSearching) {
      return;
    }

    setIsSearching(true);
    setLoadError("");

    try {
      const response = await fetch("http://localhost:8000/journal/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: JOURNAL_USER_ID,
          query,
          k: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();
      setEntries(data.map((item) => mapApiEntryToCard(item.entry)));
      setIsShowingSearchResults(true);
      setHasMoreEntries(false);
    } catch (error) {
      setLoadError("Unable to search journal entries from the backend.");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = async () => {
    setSearchQuery("");
    await loadEntries();
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || isSearching || isShowingSearchResults || !hasMoreEntries) {
      return;
    }

    await loadEntries({ nextOffset: offset, append: true });
  };

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[28px] border border-amber-200/70 bg-[linear-gradient(180deg,#fffdf4_0%,#fff8e6_100%)] shadow-[0_24px_80px_rgba(148,102,32,0.12)]">
      <div className="border-b border-amber-200/80 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Journal
            </p>
            <h2 className="mt-2 font-serif text-2xl text-slate-900">
              Notes beside the conversation
            </h2>
          </div>
          <button
            type="button"
            onClick={startNewEntry}
            className="rounded-full border border-amber-300 bg-white/70 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-white"
          >
            New Entry
          </button>
        </div>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          Keep decisions, summaries, and follow-ups visible while the RAG
          assistant continues the conversation in parallel.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="flex-1 rounded-xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
          />
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="rounded-xl bg-amber-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={clearSearch}
            disabled={isLoadingEntries}
            className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-3 border-b border-amber-200/70 bg-white/40 px-5 py-4 text-sm text-slate-600 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Showing
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {entries.length}
            {isShowingSearchResults ? " results" : ` of ${totalEntries}`}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Category
          </p>
          <p className="mt-1 font-semibold text-slate-900">Work Journal</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Sync
          </p>
          <p className="mt-1 font-semibold text-emerald-700">
            {isSearching
              ? "Searching"
              : isShowingSearchResults
                ? "Filtered"
                : isCreating
                  ? "Draft open"
                  : "Live draft"}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        {isCreating && (
          <div className="rounded-[22px] border border-amber-300 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingEntryId ? "Edit journal entry" : "New journal entry"}
              </h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-800">
                Draft
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Entry title"
                className="w-full rounded-xl border border-amber-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              />

              <input
                type="text"
                value={draft.mood}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, mood: e.target.value }))
                }
                placeholder="Mood or tag"
                className="w-full rounded-xl border border-amber-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              />

              <textarea
                value={draft.body}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder="Write your note here..."
                rows={5}
                className="w-full rounded-xl border border-amber-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400"
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={!draft.title.trim() || !draft.body.trim() || isSaving}
                className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {isSaving
                  ? "Saving..."
                  : editingEntryId
                    ? "Update entry"
                    : "Save entry"}
              </button>
              <button
                type="button"
                onClick={cancelDraft}
                disabled={isSaving}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-50"
              >
                Cancel
              </button>
            </div>

            {saveError ? (
              <p className="mt-3 text-sm text-rose-600">{saveError}</p>
            ) : null}
          </div>
        )}

        {loadError ? (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {isLoadingEntries ? (
          <div className="rounded-[22px] border border-amber-200/80 bg-white/75 p-4 text-sm text-slate-500 shadow-sm">
            Loading your journal entries...
          </div>
        ) : null}

        {!isLoadingEntries && !loadError && entries.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-amber-300 bg-white/70 p-5 text-sm leading-6 text-slate-500">
            No saved journal entries yet. Create one with{" "}
            <span className="font-medium text-slate-700">New Entry</span>.
          </div>
        ) : null}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-[22px] border border-amber-200/80 bg-white/75 p-4 shadow-sm backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {entry.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {entry.entryDate} at {entry.time}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-800">
                  {entry.mood}
                </span>
                <button
                  type="button"
                  onClick={() => startEditEntry(entry)}
                  disabled={isSaving || deletingEntryId === entry.id}
                  className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(entry.id)}
                  disabled={isSaving || deletingEntryId === entry.id}
                  className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingEntryId === entry.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {entry.body}
            </p>
          </article>
        ))}

        {!isLoadingEntries && !isShowingSearchResults && entries.length > 0 ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={!hasMoreEntries || isLoadingMore}
              className="rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore
                ? "Loading..."
                : hasMoreEntries
                  ? "Load more"
                  : "All entries loaded"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
