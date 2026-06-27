import { useState } from "react";

const API_BASE = "http://localhost:8000";

export default function InputBox({
  messages,
  setMessages,
  loading,
  setLoading,
  conversationId,
  setConversationId,
}) {
  const [input, setInput] = useState("");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          user_id: "default-user",
          conversation_id: conversationId,
        }),
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

          try {
            const chunk = JSON.parse(jsonStr);

            if (chunk.done) {
              if (chunk.conversation_id) {
                setConversationId(chunk.conversation_id);
              }
              continue;
            }

            if (chunk.token) {
              const token = chunk.token;
              // Check if this token contains SOURCES
              if (token.startsWith("\n\nSOURCES:")) {
                try {
                  sources = JSON.parse(token.replace("\n\nSOURCES:", ""));
                } catch {}
                continue;
              }
              agentText += token;
            }
          } catch {}

          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "agent") {
              return [
                ...prev.slice(0, -1),
                { role: "agent", text: agentText, sources },
              ];
            }
            return [...prev, { role: "agent", text: agentText, sources }];
          });
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Sorry, I couldn't reach the server. Make sure the backend and Ollama are running." },
      ]);
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
    <div className="border-t border-slate-200 bg-white p-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl gap-3">
        <input
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me anything..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
