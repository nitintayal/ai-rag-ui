export default function BottomNav({ activeView, setActiveView, onNewChat }) {
  const items = [
    { view: "chat", label: "Chat", icon: "💬" },
    { view: "tasks", label: "Tasks", icon: "✓" },
    { view: "journal", label: "Journal", icon: "📝" },
    { view: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white py-2 md:hidden">
      {items.map(({ view, label, icon }) => (
        <button
          key={view}
          onClick={() => (view === "chat" && activeView === "chat") ? onNewChat() : setActiveView(view)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition ${
            activeView === view
              ? "font-semibold text-slate-900"
              : "text-slate-400"
          }`}
        >
          <span className="text-lg">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}
