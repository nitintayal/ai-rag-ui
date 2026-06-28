import { useState, useCallback, useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import ChatWindow from "./components/ChatWindow";
import JournalPanel from "./components/JournalPanel";
import TasksPanel from "./components/TasksPanel";
import SettingsPanel from "./components/SettingsPanel";

function AppContent() {
  const { user, token, loading, logout, googleLogin } = useAuth();
  const [activeView, setActiveView] = useState("chat");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  // Handle Google OAuth redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("id_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get("id_token");
      if (idToken) {
        window.history.replaceState(null, "", window.location.pathname);
        googleLogin(idToken).catch(console.error);
      }
    }
  }, [googleLogin]);

  const startNewChat = useCallback(() => {
    setConversationId(null);
    setActiveView("chat");
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        onNewChat={startNewChat}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4 pb-20 md:pb-4 lg:p-6 lg:pb-6">
          <div className="min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]">
            {activeView === "chat" && (
              <ChatWindow
                conversationId={conversationId}
                setConversationId={setConversationId}
                token={token}
              />
            )}
            {activeView === "journal" && <JournalPanel token={token} />}
            {activeView === "tasks" && <TasksPanel token={token} />}
            {activeView === "settings" && <SettingsPanel token={token} />}
          </div>
        </div>
      </main>
      <BottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        onNewChat={startNewChat}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
