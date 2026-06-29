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
  const { user, token, loading, logout, googleLogin, verifyEmail } = useAuth();
  const [activeView, setActiveView] = useState("chat");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [conversationId, setConversationId] = useState(null);
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
    setActiveView("chat");
  }, []);

  if (loading || processingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          <p className="text-slate-500">{processingAuth ? "Signing you in..." : "Loading..."}</p>
        </div>
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
