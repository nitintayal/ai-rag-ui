import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

const PROMPTS = [
  "What are the key points in my uploaded documents?",
  "What's the latest news about AI?",
  "Create a task to review the Q4 report by Friday",
  "Remember that I prefer Python over JavaScript",
];

export default function ChatWindow({ conversationId, setConversationId, token, loadedMessages }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (loadedMessages) {
      setMessages(loadedMessages);
    } else if (!conversationId) {
      setMessages([]);
    }
  }, [conversationId, loadedMessages]);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl md:rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      {/* Header — hidden on mobile (mobile top bar handles it) */}
      <div className="hidden md:block border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          Assistant
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          AI Personal Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Search your documents, browse the web, manage tasks, and keep a journal — all in one place.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 dark:bg-slate-950/50 p-3 sm:p-5 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 md:gap-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center pt-4">
                Try asking
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      // Surface the prompt into InputBox via a custom event
                      window.dispatchEvent(new CustomEvent("chat-prompt", { detail: p }));
                    }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-left text-sm text-slate-600 dark:text-slate-400 transition hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} text={msg.text} sources={msg.sources} />
          ))}

          {loading && (
            <div className="flex items-center gap-1.5 px-1">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}

          <div ref={bottomRef} />
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
