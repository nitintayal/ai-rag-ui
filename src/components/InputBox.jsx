import { useState } from "react";

function extractSources(rawText) {
  const sourceBlockPattern = /\bSOURCES?\s*:\s*(\[[\s\S]*?\])/i;
  const match = rawText.match(sourceBlockPattern);

  if (!match) {
    return { text: rawText, sources: null };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const sources = Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string" && item.trim())
      : null;

    const text = rawText
      .replace(sourceBlockPattern, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return { text, sources };
  } catch {
    return { text: rawText, sources: null };
  }
}

export default function InputBox({ messages, setMessages, loading, setLoading }) {
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input || loading) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    const question = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let agentText = "", sources = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        agentText += decoder.decode(value, { stream: true });
        const parsed = extractSources(agentText);
        sources = parsed.sources;

        setMessages((prev) => {
          const last = prev[prev.length - 1];

          if (last?.role === "agent") {
            return [
              ...prev.slice(0, -1),
              { role: "agent", text: parsed.text, sources },
            ];
          }

          return [...prev, { role: "agent", text: parsed.text, sources }];
        });
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl gap-3">
        <input
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your files..."
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
