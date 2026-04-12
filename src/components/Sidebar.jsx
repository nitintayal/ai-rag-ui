import FileUpload from "./FileUpload";

const libraryItems = ["Employee Policy", "Leave Rules"];

export default function Sidebar({
  activeView,
  setActiveView,
  isExpanded,
  setIsExpanded,
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
          onClick={() => setActiveView("chat")}
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
            onClick={() => setActiveView("journal")}
            className={`${navItemClass("journal")} ${isExpanded ? "" : "px-2 text-center"}`}
            title="Journal"
          >
            {isExpanded ? "Journal" : "J"}
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${isExpanded ? "p-3" : "p-2"}`}>
        {isExpanded ? (
          <>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Library
            </p>
            <div className="space-y-2">
              {libraryItems.map((item) => (
                <div
                  key={item}
                  className="cursor-pointer rounded-xl p-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {item}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {libraryItems.map((item, index) => (
              <div
                key={item}
                className="cursor-pointer rounded-xl p-3 text-center text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title={item}
              >
                {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`border-t border-slate-800 text-sm text-slate-400 ${
          isExpanded ? "p-4" : "p-3 text-center"
        }`}
      >
        {isExpanded ? "AI RAG Agent" : "AI"}
      </div>
    </aside>
  );
}
