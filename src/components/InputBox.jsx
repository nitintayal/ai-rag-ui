import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE } from "../config";
import { useVoice } from "../hooks/useVoice";

const isSafariWithoutStreaming = (() => {
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isIOS = /iP(hone|od|ad)/.test(ua);
  const isChromeIOS = /CriOS/.test(ua);
  return isSafari || isIOS || isChromeIOS;
})();

export default function InputBox({
  messages,
  setMessages,
  loading,
  setLoading,
  conversationId,
  setConversationId,
  token,
}) {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const onVoiceResult = useCallback(
    (text) => setInput((prev) => (prev ? prev + " " + text : text)),
    []
  );
  const { listening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useVoice(onVoiceResult);

  const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Receive suggested prompts from ChatWindow
  useEffect(() => {
    const handler = (e) => {
      setInput(e.detail);
      textareaRef.current?.focus();
    };
    window.addEventListener("chat-prompt", handler);
    return () => window.removeEventListener("chat-prompt", handler);
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".pdf", ".txt", ".xlsx", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadMsg(`Only ${allowed.join(", ")} supported`);
      return;
    }
    setUploading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", headers: hdrs, body: formData });
      if (!res.ok) throw new Error(`${res.status}`);
      setUploadMsg(`✓ ${file.name}`);
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (err) {
      setUploadMsg(`Failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const question = input;
    setInput("");
    setLoading(true);

    try {
      if (isSafariWithoutStreaming) {
        setMessages((prev) => [...prev, { role: "agent", text: "…" }]);
        const res = await fetch(`${API_BASE}/chat/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...hdrs },
          body: JSON.stringify({ question, conversation_id: conversationId }),
        });
        const data = await res.json();
        if (data.conversation_id) setConversationId(data.conversation_id);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "agent", text: data.answer || "Sorry, something went wrong.", sources: data.sources },
        ]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...hdrs },
        body: JSON.stringify({ question, conversation_id: conversationId }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let agentText = "";
      let sources = null;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          let hasNewText = false;
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.done) { if (chunk.conversation_id) setConversationId(chunk.conversation_id); continue; }
            if (chunk.token) {
              const tk = chunk.token;
              if (tk.startsWith("\n\nSOURCES:")) { try { sources = JSON.parse(tk.replace("\n\nSOURCES:", "")); } catch {} continue; }
              agentText += tk;
              hasNewText = true;
            }
          } catch {}
          if (!hasNewText) continue;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "agent") return [...prev.slice(0, -1), { role: "agent", text: agentText, sources }];
            return [...prev, { role: "agent", text: agentText, sources }];
          });
        }
      }

      if (!agentText) {
        setMessages((prev) => [...prev, { role: "agent", text: "Sorry, I couldn't reach the server." }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "agent" && !last.text?.trim()) {
          return [...prev.slice(0, -1), { role: "agent", text: "Sorry, I couldn't reach the server." }];
        }
        return [...prev, { role: "agent", text: "Sorry, I couldn't reach the server." }];
      });
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    // Desktop: Enter sends. Mobile: Enter adds newline (use send button).
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 sm:px-4 sm:py-3">
      {uploadMsg && (
        <div className={`mb-2 rounded-xl px-3 py-1.5 text-xs ${
          uploadMsg.startsWith("Failed") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
        }`}>
          {uploadMsg}
        </div>
      )}

      {/* Single container — buttons live inside the pill so alignment is always exact */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 focus-within:ring-2 focus-within:ring-slate-900/30 dark:focus-within:ring-slate-500/30 transition-colors">
        <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" accept=".pdf,.txt,.xlsx,.csv" />

        {/* Attach */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || loading}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40 active:scale-95"
          style={{ WebkitTapHighlightColor: "transparent" }}
          title="Upload document"
        >
          {uploading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 min-w-0 resize-none bg-transparent text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none py-1.5 leading-relaxed"
          style={{ minHeight: "36px", maxHeight: "160px" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me anything…"
        />

        {/* Voice */}
        {voiceSupported && (
          <button
            onClick={listening ? stopVoice : startVoice}
            disabled={loading}
            className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 ${
              listening
                ? "bg-rose-100 dark:bg-rose-900/30 text-rose-500 animate-pulse"
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
            } disabled:opacity-40`}
            style={{ WebkitTapHighlightColor: "transparent" }}
            title={listening ? "Stop" : "Voice input"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>
        )}

        {/* Send */}
        <button
          onClick={sendMessage}
          disabled={!canSend}
          className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 ${
            canSend
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
              : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
          }`}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
