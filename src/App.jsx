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
        <div className="flex min-h-0 flex-1 flex-col p-4 pb-20 md:pb-4 lg:p-6">
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
