import { useTheme } from "../hooks/useTheme";

export default function BottomNav({ activeView, setActiveView, onNewChat }) {
  const { dark, toggle } = useTheme();

  const items = [
    { view: "chat", label: "Chat", icon: "💬" },
    { view: "tasks", label: "Tasks", icon: "✓" },
    { view: "journal", label: "Journal", icon: "📝" },
    { view: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 md:hidden">
      {items.map(({ view, label, icon }) => (
        <button
          key={view}
          onClick={() => (view === "chat" && activeView === "chat") ? onNewChat() : setActiveView(view)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition ${
            activeView === view
              ? "font-semibold text-slate-900 dark:text-white"
              : "text-slate-400 dark:text-slate-500"
          }`}
        >
          <span className="text-lg">{icon}</span>
          {label}
        </button>
      ))}
      <button
        onClick={toggle}
        className="flex flex-col items-center gap-0.5 px-4 py-1 text-xs text-slate-400 dark:text-slate-500 transition"
      >
        <span className="text-lg">{dark ? "☀️" : "🌙"}</span>
        {dark ? "Light" : "Dark"}
      </button>
    </nav>
  );
}
