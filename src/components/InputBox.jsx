import { useState, useRef, useCallback } from "react";
import { API_BASE } from "../config";
import { useVoice } from "../hooks/useVoice";

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
  const onVoiceResult = useCallback((text) => setInput((prev) => prev ? prev + " " + text : text), []);
  const { listening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useVoice(onVoiceResult);

  const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".pdf", ".txt", ".xlsx", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadMsg(`Only ${allowed.join(", ")} files supported`);
      return;
    }

    setUploading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: hdrs,
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setUploadMsg(`Uploaded: ${file.name}`);
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

            if (chunk.done) {
              if (chunk.conversation_id) setConversationId(chunk.conversation_id);
              continue;
            }

            if (chunk.token) {
              const tk = chunk.token;
              if (tk.startsWith("\n\nSOURCES:")) {
                try { sources = JSON.parse(tk.replace("\n\nSOURCES:", "")); } catch {}
                continue;
              }
              agentText += tk;
              hasNewText = true;
            }
          } catch {}

          // Skip rendering on empty/heartbeat tokens — avoids a blank message bubble
          if (!hasNewText) continue;

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "agent") {
              return [...prev.slice(0, -1), { role: "agent", text: agentText, sources }];
            }
            return [...prev, { role: "agent", text: agentText, sources }];
          });
        }
      }

      // If the stream ended with no content at all, show one error bubble
      if (!agentText) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Sorry, I couldn't reach the server." },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        // Replace an empty/partial agent bubble instead of stacking a new one
        if (last?.role === "agent" && (!last.text || last.text.trim() === "")) {
          return [...prev.slice(0, -1), { role: "agent", text: "Sorry, I couldn't reach the server." }];
        }
        return [...prev, { role: "agent", text: "Sorry, I couldn't reach the server." }];
      });
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 sm:px-6">
      {uploadMsg && (
        <div className={`mx-auto mb-2 max-w-3xl rounded-lg px-3 py-1.5 text-xs ${
          uploadMsg.startsWith("Failed") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
        }`}>
          {uploadMsg}
        </div>
      )}
      <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-3">
        <input type="file" ref={fileRef} onChange={handleUpload} className="hidden" accept=".pdf,.txt,.xlsx,.csv" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || loading}
          className="shrink-0 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          title="Upload document"
        >
          {uploading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me anything..."
        />
        {voiceSupported && (
          <button
            onClick={listening ? stopVoice : startVoice}
            disabled={loading}
            className={`shrink-0 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border transition ${
              listening
                ? "border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-900/30 animate-pulse"
                : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            } disabled:opacity-40`}
            title={listening ? "Stop listening" : "Voice input"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </button>
        )}
        <button
          onClick={sendMessage}
          disabled={loading}
          className="shrink-0 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
