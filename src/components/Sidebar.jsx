import FileUpload from "./FileUpload";

export default function Sidebar({
  activeView,
  setActiveView,
  isExpanded,
  setIsExpanded,
  onNewChat,
  user,
  onLogout,
}) {
  const navItemClass = (view) =>
    `w-full rounded-xl p-3 text-left transition ${
      activeView === view
        ? "bg-white text-slate-950"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside
      className={`hidden shrink-0 border-r border-slate-800 bg-slate-950 text-white transition-all duration-200 md:flex md:flex-col ${
        isExpanded ? "w-72" : "w-20"
      }`}
    >
      <div className={`border-b border-slate-800 ${isExpanded ? "p-5" : "p-3"}`}>
        <div className="flex items-center justify-between gap-2">
          {isExpanded ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Navigation
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? "<<" : ">>"}
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className={`mt-3 rounded-xl bg-slate-900 text-left transition hover:bg-slate-800 ${
            isExpanded ? "w-full p-3" : "w-full px-3 py-3 text-center"
          }`}
        >
          {isExpanded ? "+ New Chat" : "+"}
        </button>

        {isExpanded ? <FileUpload /> : null}
      </div>

      <div className={`border-b border-slate-800 ${isExpanded ? "p-3" : "p-2"}`}>
        {isExpanded ? (
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Workspace
          </p>
        ) : null}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setActiveView("chat")}
            className={`${navItemClass("chat")} ${isExpanded ? "" : "px-2 text-center"}`}
            title="Chat"
          >
            {isExpanded ? "Chat" : "C"}
          </button>
          <button
            type="button"
            onClick={() => setActiveView("tasks")}
            className={`${navItemClass("tasks")} ${isExpanded ? "" : "px-2 text-center"}`}
            title="Tasks"
          >
            {isExpanded ? "Tasks" : "T"}
          </button>
          <button
            type="button"
            onClick={() => setActiveView("journal")}
            className={`${navItemClass("journal")} ${isExpanded ? "" : "px-2 text-center"}`}
            title="Journal"
          >
            {isExpanded ? "Journal" : "J"}
          </button>
        </div>
      </div>

      <div className="flex-1" />

      <div
        className={`border-t border-slate-800 text-sm text-slate-400 ${
          isExpanded ? "p-4" : "p-3 text-center"
        }`}
      >
        {isExpanded ? (
          <div className="space-y-2">
            <p className="truncate text-slate-300">{user?.name || user?.email || "User"}</p>
            <button
              onClick={onLogout}
              className="w-full rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={onLogout} title="Sign Out" className="text-slate-400 hover:text-white">
            ⏻
          </button>
        )}
      </div>
    </aside>
  );
}
