import { useState, useCallback, useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { API_BASE } from "./config";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import ChatWindow from "./components/ChatWindow";
import JournalPanel from "./components/JournalPanel";
import TasksPanel from "./components/TasksPanel";
import CalendarPanel from "./components/CalendarPanel";
import SettingsPanel from "./components/SettingsPanel";

function AppContent() {
  const { user, token, loading, logout, googleLogin, verifyEmail } = useAuth();
  const [activeView, setActiveView] = useState("chat");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadedMessages, setLoadedMessages] = useState(null);
  const [processingAuth, setProcessingAuth] = useState(
    () => window.location.hash.includes("id_token=") || new URLSearchParams(window.location.search).has("verify_email")
  );

  // Handle Google OAuth redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("id_token=")) {
      setProcessingAuth(true);
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get("id_token");
      window.history.replaceState(null, "", window.location.pathname);
      if (idToken) {
        googleLogin(idToken)
          .catch(console.error)
          .finally(() => setProcessingAuth(false));
      } else {
        setProcessingAuth(false);
      }
    }
  }, [googleLogin]);

  // Handle email verification link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyEmailAddr = params.get("verify_email");
    const code = params.get("code");
    if (verifyEmailAddr && code) {
      setProcessingAuth(true);
      window.history.replaceState(null, "", window.location.pathname);
      verifyEmail(verifyEmailAddr, code)
        .catch(console.error)
        .finally(() => setProcessingAuth(false));
    }
  }, [verifyEmail]);

  const startNewChat = useCallback(() => {
    setConversationId(null);
    setLoadedMessages(null);
    setActiveView("chat");
  }, []);

  const selectConversation = useCallback(async (convId) => {
    setActiveView("chat");
    setConversationId(convId);
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const messages = await res.json();
        const mapped = messages.map((m) => ({
          role: m.role === "user" ? "user" : "agent",
          text: m.content,
        }));
        setLoadedMessages(mapped);
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  }, [token]);

  if (loading || processingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-600 dark:border-t-white" />
          <p className="text-slate-500 dark:text-slate-400">{processingAuth ? "Signing you in..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const VIEW_LABELS = { chat: "Assistant", tasks: "Tasks", calendar: "Calendar", journal: "Journal", settings: "Settings" };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        onNewChat={startNewChat}
        onSelectConversation={selectConversation}
        conversationId={conversationId}
        token={token}
        user={user}
        onLogout={logout}
      />
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile-only top bar */}
        <div
          className="md:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 shrink-0"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <span className="text-base font-semibold text-slate-900 dark:text-white">
            {VIEW_LABELS[activeView] || "AI Assistant"}
          </span>
          <div className="flex items-center gap-2">
            {activeView === "chat" && (
              <button
                onClick={startNewChat}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 active:scale-95"
                style={{ WebkitTapHighlightColor: "transparent" }}
                title="New chat"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setActiveView("settings")}
              className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                : <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{(user?.name || user?.email || "U").charAt(0).toUpperCase()}</span>
              }
            </button>
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col p-3 md:p-4 lg:p-6"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex min-h-0 flex-1 flex-col md:pb-0" style={{ paddingBottom: 0 }}>
            {activeView === "chat" && (
              <ChatWindow
                conversationId={conversationId}
                setConversationId={setConversationId}
                token={token}
                loadedMessages={loadedMessages}
              />
            )}
            {activeView === "journal" && <JournalPanel token={token} />}
            {activeView === "tasks" && <TasksPanel token={token} />}
            {activeView === "calendar" && <CalendarPanel token={token} />}
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
