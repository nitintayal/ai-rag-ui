import { useState } from "react";

export default function InputBox({ messages, setMessages }) {

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
            return [
              ...prev.slice(0, -1),
              { role: "agent", text: agentText },
            ];
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

    <div className="border-t bg-white p-4">

      <div className="max-w-3xl mx-auto flex gap-3">

        <input
          className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Send a message..."
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          {loading ? "..." : "Send"}
        </button>

      </div>

    </div>

  );
}