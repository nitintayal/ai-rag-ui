import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      let agentText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        agentText += decoder.decode(value);

        setMessages((prev) => {
          const last = prev[prev.length - 1];

          if (last?.role === "agent") {
            return [...prev.slice(0, -1), { role: "agent", text: agentText }];
          }

          return [...prev, { role: "agent", text: agentText }];
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
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h2>AI RAG Agent</h2>

      <div
        style={{
          border: "1px solid #ddd",
          height: 450,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#DCF8C6" : "#F1F0F0",
              padding: "10px 15px",
              borderRadius: 12,
              maxWidth: "70%",
            }}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", color: "#888" }}>
            Agent typing...
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask something..."
          style={{ flex: 1, padding: 10 }}
        />

        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}