import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

export default function ChatWindow({ conversationId, setConversationId, token, loadedMessages }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load messages from a selected conversation, or clear for new chat
  useEffect(() => {
    if (loadedMessages) {
      setMessages(loadedMessages);
    } else if (!conversationId) {
      setMessages([]);
    }
  }, [conversationId, loadedMessages]);

  return (
    <section className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          Assistant
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          AI Personal Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Search your documents, browse the web, manage tasks, and keep a journal
          — all in one place.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/50 p-5 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-sm leading-6 text-slate-500">
              <p className="font-medium text-slate-700 mb-2">Try asking:</p>
              <ul className="space-y-1 text-slate-500">
                <li>"What are the key points in my uploaded documents?"</li>
                <li>"What's the latest news about AI?"</li>
                <li>"Create a task to review the Q4 report by Friday"</li>
                <li>"Remember that I prefer Python over JavaScript"</li>
              </ul>
            </div>
          )}

          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} text={msg.text} sources={msg.sources} />
          ))}

          {loading && (
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></span>
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-150"></span>
              <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-300"></span>
            </div>
          )}

          <div ref={bottomRef}></div>
        </div>
      </div>

      <InputBox
        messages={messages}
        setMessages={setMessages}
        loading={loading}
        setLoading={setLoading}
        conversationId={conversationId}
        setConversationId={setConversationId}
        token={token}
      />
    </section>
  );
}
