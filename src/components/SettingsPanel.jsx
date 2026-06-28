import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";

export default function SettingsPanel({ token }) {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const hdrs = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const updateProfile = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: hdrs,
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
        headers: hdrs,
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
        <div className="rounded-2xl border border-slate-200 p-5">
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
        <div className="rounded-2xl border border-slate-200 p-5">
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

        {/* Account Info */}
        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Account</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-700">User ID:</span> {user?.id}</p>
            <p><span className="font-medium text-slate-700">Auth:</span> {user?.auth_provider || "local"}</p>
            <p><span className="font-medium text-slate-700">Joined:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
          </div>
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
