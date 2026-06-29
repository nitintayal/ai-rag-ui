import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function ChatHistory({ token, conversationId, onSelect, isExpanded }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/conversations?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [token, conversationId]);

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isExpanded) {
    return (
      <div className="space-y-1">
        {conversations.slice(0, 5).map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full rounded-lg p-2 text-center text-xs transition ${
              conversationId === conv.id
                ? "bg-white text-slate-950"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title={conv.title || "Chat"}
          >
            {(conv.title || "C")[0].toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {loading && conversations.length === 0 && (
        <p className="px-3 py-2 text-xs text-slate-500">Loading...</p>
      )}
      {!loading && conversations.length === 0 && (
        <p className="px-3 py-2 text-xs text-slate-500">No conversations yet</p>
      )}
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`group flex cursor-pointer items-center gap-2 rounded-xl p-2.5 transition ${
            conversationId === conv.id
              ? "bg-white text-slate-950"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-sm">
            {conv.title || "Untitled chat"}
          </span>
          <button
            onClick={(e) => deleteConversation(e, conv.id)}
            className="hidden shrink-0 rounded p-1 text-slate-500 transition hover:bg-slate-700 hover:text-rose-400 group-hover:block"
            title="Delete"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
