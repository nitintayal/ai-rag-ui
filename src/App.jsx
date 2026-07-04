import { useState, useCallback, useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { API_BASE } from "./config";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
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
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
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
    setLoadedMessages(null);
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

  // Must be called before any conditional returns (Rules of Hooks)
  const { pullY, refreshing } = usePullToRefresh();

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
        {/* Pull-to-refresh indicator (mobile only) */}
        {(pullY > 0 || refreshing) && (
          <div
            className="md:hidden absolute top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ height: `${Math.max(pullY * 56, refreshing ? 56 : 0)}px`, transition: pullY === 0 ? "height 0.2s" : "none" }}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-md ${refreshing ? "animate-spin" : ""}`}
              style={{ opacity: pullY, transform: `rotate(${pullY * 360}deg)` }}>
              <svg className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        )}
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
              <>
                <button
                  onClick={() => setShowHistoryDrawer(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 active:scale-95"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  title="Chat history"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
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
              </>
            )}
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
        {/* Mobile history drawer */}
        {showHistoryDrawer && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowHistoryDrawer(false)}
            />
            {/* Drawer panel */}
            <div className="relative ml-auto w-[85vw] max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
              style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white">Chat History</span>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ChatHistory
                  token={token}
                  conversationId={conversationId}
                  onSelect={(id) => { selectConversation(id); setShowHistoryDrawer(false); }}
                  isExpanded={true}
                />
              </div>
            </div>
          </div>
        )}
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
