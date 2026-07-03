import ChatHistory from "./ChatHistory";

// Icons used in the sidebar — always rendered, label shown only when expanded
const icons = {
  collapse: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
    </svg>
  ),
  expand: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
    </svg>
  ),
  newChat: (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  chat: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  tasks: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  journal: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const navItems = [
  { view: "chat",     icon: icons.chat,     label: "Chat" },
  { view: "tasks",    icon: icons.tasks,    label: "Tasks" },
  { view: "calendar", icon: icons.calendar, label: "Calendar" },
  { view: "journal",  icon: icons.journal,  label: "Journal" },
];

export default function Sidebar({
  activeView,
  setActiveView,
  isExpanded,
  setIsExpanded,
  onNewChat,
  onSelectConversation,
  conversationId,
  token,
  user,
  onLogout,
}) {
  const navItemClass = (view) =>
    `w-full rounded-xl transition flex items-center gap-3 px-3 py-2.5 ${
      activeView === view
        ? "bg-white text-slate-950"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside
      className={`hidden shrink-0 border-r border-slate-800 bg-slate-950 text-white transition-all duration-200 md:flex md:flex-col ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Header: collapse toggle + new chat */}
      <div className="border-b border-slate-800 p-3 space-y-2">
        <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
          {isExpanded && (
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Menu
            </p>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? icons.collapse : icons.expand}
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className={`w-full flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-800 ${
            isExpanded ? "justify-start" : "justify-center"
          }`}
          title="New Chat"
        >
          {icons.newChat}
          {isExpanded && <span>New Chat</span>}
        </button>
      </div>

      {/* Nav items */}
      <div className="border-b border-slate-800 p-3 space-y-1">
        {isExpanded && (
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Workspace
          </p>
        )}
        {navItems.map(({ view, icon, label }) => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={`${navItemClass(view)} ${isExpanded ? "" : "justify-center"}`}
            title={label}
          >
            {icon}
            {isExpanded && <span className="text-sm">{label}</span>}
          </button>
        ))}
      </div>

      {/* Chat history */}
      <div className={`flex-1 overflow-y-auto border-b border-slate-800 ${isExpanded ? "p-3" : "p-2"}`}>
        {isExpanded && (
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Recent Chats
          </p>
        )}
        <ChatHistory
          token={token}
          conversationId={conversationId}
          onSelect={onSelectConversation}
          isExpanded={isExpanded}
        />
      </div>

      {/* User / settings / logout */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <button
          type="button"
          onClick={() => setActiveView("settings")}
          className={`${navItemClass("settings")} ${isExpanded ? "" : "justify-center"}`}
          title="Settings"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-6 w-6 shrink-0 rounded-full" />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          {isExpanded && (
            <span className="truncate text-sm">{user?.name || user?.email || "Settings"}</span>
          )}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-rose-400 transition hover:bg-slate-800 hover:text-rose-300 ${
            isExpanded ? "" : "justify-center"
          }`}
          title="Sign out"
        >
          {icons.logout}
          {isExpanded && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
