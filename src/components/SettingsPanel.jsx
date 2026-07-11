import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { API_BASE } from "../config";
import { usePushNotifications } from "../hooks/usePushNotifications";

const PROVIDER_LABELS = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  ollama: "Ollama (local)",
};

export default function SettingsPanel({ token }) {
  const { dark, toggle } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const push = usePushNotifications(token);
  const [pushError, setPushError] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // AI Model settings
  const [availableModels, setAvailableModels] = useState({});
  const [providersConfigured, setProvidersConfigured] = useState({});
  const [globalDefaultProvider, setGlobalDefaultProvider] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(user?.llm_provider || "");
  const [selectedModel, setSelectedModel] = useState(user?.llm_model || "");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [llmMsg, setLlmMsg] = useState("");
  const [savingLlm, setSavingLlm] = useState(false);

  const hdrs = () => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/auth/llm-settings/available`, { headers: hdrs() })
      .then((res) => res.json())
      .then((data) => {
        setAvailableModels(data.models || {});
        setProvidersConfigured(data.providers_configured || {});
        setGlobalDefaultProvider(data.global_default_provider || "");
      })
      .catch(() => {});
  }, [token]);

  const saveLlmSettings = async () => {
    if (savingLlm) return;
    setSavingLlm(true);
    setLlmMsg("");
    try {
      const body = {
        llm_provider: selectedProvider || null,
        llm_model: selectedModel || null,
      };
      // Only send llm_api_key if the user typed something (empty string = clear it)
      if (apiKey !== "") body.llm_api_key = apiKey;
      const res = await fetch(`${API_BASE}/auth/llm-settings`, {
        method: "PATCH",
        headers: hdrs(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      setLlmMsg("Saved");
      setApiKey(""); // clear the key field after saving (don't re-display it)
      if (refreshUser) refreshUser();
    } catch (e) {
      setLlmMsg(e.message);
    } finally {
      setSavingLlm(false);
    }
  };

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setSelectedModel("");
    setApiKey("");
  };

  const updateProfile = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: hdrs(),
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      setProfileMsg("Profile updated");
    } catch (e) {
      setProfileMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (saving) return;
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords don't match");
      return;
    }
    setSaving(true);
    setPasswordMsg("");
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      setPasswordMsg("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPasswordMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const isGoogleUser = user?.auth_provider === "google";
  const hasPassword = !isGoogleUser || user?.password;

  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          Settings
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Profile & Security</h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
        {/* Profile Info */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Profile</h3>

          <div className="mt-4 flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-14 w-14 rounded-full border-2 border-slate-200"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900">{user?.name || "—"}</p>
              <p className="text-sm text-slate-500">{user?.email || "—"}</p>
              {isGoogleUser && (
                <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Google Account
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-slate-700">Display Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={updateProfile}
                disabled={saving || !name.trim()}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                Save
              </button>
            </div>
            {profileMsg && (
              <p className={`text-sm ${profileMsg.includes("updated") ? "text-emerald-600" : "text-rose-600"}`}>
                {profileMsg}
              </p>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            {isGoogleUser && !hasPassword ? "Set Password" : "Change Password"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {isGoogleUser && !hasPassword
              ? "Set a password to also log in with email and password."
              : "Update your account password."}
          </p>

          <div className="mt-4 space-y-3">
            {hasPassword && (
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900"
              />
            )}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              onClick={changePassword}
              disabled={saving || !newPassword}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {saving ? "..." : isGoogleUser && !hasPassword ? "Set Password" : "Update Password"}
            </button>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.includes("updated") || passwordMsg.includes("set") ? "text-emerald-600" : "text-rose-600"}`}>
                {passwordMsg}
              </p>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h3>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-700 dark:text-slate-300">Dark Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggle}
              className={`relative shrink-0 h-7 w-12 rounded-full transition ${dark ? "bg-slate-600" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* AI Model */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Model</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose which AI provider and model answers your questions. Leave as "Default" to use the app's global setting
            {globalDefaultProvider ? ` (currently ${PROVIDER_LABELS[globalDefaultProvider] || globalDefaultProvider})` : ""}.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500"
              >
                <option value="">Default ({PROVIDER_LABELS[globalDefaultProvider] || "app default"})</option>
                {Object.keys(availableModels).map((p) => (
                  <option key={p} value={p} disabled={!providersConfigured[p]}>
                    {PROVIDER_LABELS[p] || p}{!providersConfigured[p] ? " (not configured)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedProvider && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500"
                >
                  <option value="">Default model for this provider</option>
                  {(availableModels[selectedProvider] || []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedProvider && selectedProvider !== "ollama" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Your API Key
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {user?.has_llm_api_key ? "● key saved" : "optional — uses app default if blank"}
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={user?.has_llm_api_key ? "Enter new key to replace, or leave blank" : "sk-... or AIza..."}
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="shrink-0 rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-500 hover:bg-slate-50"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                {user?.has_llm_api_key && apiKey === "" && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave blank and save to keep existing key, or type a new one to replace it.{" "}
                    <button
                      type="button"
                      onClick={async () => {
                        setSavingLlm(true);
                        try {
                          const res = await fetch(`${API_BASE}/auth/llm-settings`, {
                            method: "PATCH", headers: hdrs(),
                            body: JSON.stringify({ llm_provider: selectedProvider || null, llm_model: selectedModel || null, llm_api_key: "" }),
                          });
                          if (!res.ok) throw new Error((await res.json()).detail || "Failed");
                          setLlmMsg("API key cleared");
                          if (refreshUser) refreshUser();
                        } catch (e) { setLlmMsg(e.message); }
                        finally { setSavingLlm(false); }
                      }}
                      className="text-rose-500 hover:text-rose-700 underline"
                    >Remove saved key</button>
                  </p>
                )}
              </div>
            )}

            <button
              onClick={saveLlmSettings}
              disabled={savingLlm}
              className="rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:bg-slate-400"
            >
              {savingLlm ? "Saving..." : "Save Model Preference"}
            </button>
            {llmMsg && (
              <p className={`text-sm ${llmMsg.toLowerCase().includes("saved") ? "text-emerald-600" : "text-rose-600"}`}>
                {llmMsg}
              </p>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          {/* Push Notifications */}
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Push Notifications</h3>
            {!push.supported ? (
              <p className="mt-2 text-sm text-slate-500">Push notifications are not supported in this browser.</p>
            ) : push.permission === "denied" ? (
              <p className="mt-2 text-sm text-rose-600">
                Notifications blocked. Allow them in your browser settings, then reload.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  Get a notification when tasks are due. Reminders are sent when you (or the server) trigger <code className="text-xs bg-slate-100 px-1 rounded">/tasks/send-reminders</code>.
                </p>
                {pushError && <p className="mt-2 text-sm text-rose-600">{pushError}</p>}
                <button
                  onClick={async () => {
                    setPushError("");
                    try {
                      if (push.subscribed) await push.unsubscribe();
                      else await push.subscribe();
                    } catch (e) {
                      setPushError(e.message || "Failed to change push subscription.");
                    }
                  }}
                  disabled={push.loading}
                  className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                    push.subscribed
                      ? "border border-rose-300 text-rose-700 hover:bg-rose-50"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {push.loading ? "..." : push.subscribed ? "Turn off notifications" : "Enable notifications"}
                </button>
                {push.subscribed && (
                  <p className="mt-2 text-xs text-emerald-600">● Notifications enabled on this device</p>
                )}
              </>
            )}
          </div>

          <h3 className="text-lg font-semibold text-slate-900">Account</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-700">User ID:</span> {user?.id}</p>
            <p><span className="font-medium text-slate-700">Auth:</span> {user?.auth_provider || "local"}</p>
            <p><span className="font-medium text-slate-700">Joined:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
          </div>
          {user?.is_admin && (
            <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
              <button
                onClick={async () => {
                  const res = await fetch(`${API_BASE}/admin/export-db`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) { alert("Export failed"); return; }
                  const blob = await res.blob();
                  const disposition = res.headers.get("content-disposition") || "";
                  const match = disposition.match(/filename="?([^"]+)"?/);
                  const filename = match ? match[1] : "assistant_export.db";
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = filename; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Database (SQLite)
              </button>
            </div>
          )}

          <button
            onClick={logout}
            className="mt-4 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </section>
  );
}
