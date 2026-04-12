import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import JournalPanel from "./components/JournalPanel";

export default function App() {
  const [activeView, setActiveView] = useState("chat");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4 lg:p-6">
          <div className="min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]">
            {activeView === "chat" ? <ChatWindow /> : null}
            {activeView === "journal" ? (
              <JournalPanel />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
