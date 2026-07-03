import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";

export default function LoginPage() {
  const { login, register, verifyEmail, googleLogin } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "At least 6 characters";
    else if (!/[A-Z]/.test(password)) e.password = "Include one uppercase letter";
    else if (!/[0-9]/.test(password)) e.password = "Include one number";
    if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setErrors({});
    if (mode === "register" && !validate()) return;
    setLoading(true);
    try {
      if (mode === "register") {
        const result = await register(name, email, password);
        if (result.status === "verification_sent") { setMode("verify_sent"); setSuccess(result.message); }
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim()) { setError("Enter your email address"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setSuccess(data.message || "If this email exists, a reset link has been sent.");
    } catch {
      setSuccess("If this email exists, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { setError("Google login not configured"); return; }
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}&response_type=id_token&scope=openid email profile&nonce=${Date.now()}`;
    window.location.href = url;
  };

  const switchMode = (m) => { setMode(m); setError(""); setSuccess(""); setErrors({}); };

  const field = (id) =>
    `w-full rounded-2xl border px-4 py-3.5 text-sm outline-none transition focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
      errors[id] ? "border-rose-400 bg-rose-50/50" : "border-slate-200 dark:border-slate-700 bg-white"
    }`;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-5"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 dark:bg-white shadow-lg">
            <svg className="h-9 w-9 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Assistant</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-6 shadow-xl shadow-slate-200/60 dark:shadow-black/40">
          {mode === "verify_sent" ? (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Check your email</h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  We sent a verification link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>
                </p>
              </div>
              <button onClick={() => switchMode("login")} className="text-sm font-medium text-slate-900 dark:text-white hover:underline">
                Back to sign in
              </button>
            </div>
          ) : mode === "forgot" ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required className={field()} />
              {error && <p className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
              {success && <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">{success}</p>}
              <button type="submit" disabled={loading}
                className="w-full rounded-2xl bg-slate-900 dark:bg-white py-3.5 text-sm font-semibold text-white dark:text-slate-900 transition active:scale-[0.98] disabled:opacity-50">
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <button type="button" onClick={() => switchMode("login")} className="w-full text-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition">
                ← Back to sign in
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "register" && (
                  <div>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field("name")} autoComplete="name" />
                    {errors.name && <p className="mt-1 px-1 text-xs text-rose-500">{errors.name}</p>}
                  </div>
                )}
                <div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={field("email")} autoComplete="email" />
                  {errors.email && <p className="mt-1 px-1 text-xs text-rose-500">{errors.email}</p>}
                </div>
                <div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className={field("password")} autoComplete={mode === "register" ? "new-password" : "current-password"} />
                  {errors.password && <p className="mt-1 px-1 text-xs text-rose-500">{errors.password}</p>}
                </div>
                {mode === "register" && (
                  <div>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={field("confirmPassword")} autoComplete="new-password" />
                    {errors.confirmPassword && <p className="mt-1 px-1 text-xs text-rose-500">{errors.confirmPassword}</p>}
                  </div>
                )}

                {error && <p className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 dark:bg-white py-3.5 text-sm font-semibold text-white dark:text-slate-900 transition active:scale-[0.98] disabled:opacity-50 mt-1">
                  {loading ? "…" : mode === "register" ? "Create Account" : "Sign In"}
                </button>
              </form>

              {mode === "login" && error && (
                <button onClick={() => switchMode("forgot")} className="mt-2 block w-full text-center text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition">
                  Forgot password?
                </button>
              )}

              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <div className="mt-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">or</span>
                    </div>
                  </div>
                  <button onClick={handleGoogle}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98]">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
              )}

              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                {mode === "register" ? "Already have an account? " : "Don't have an account? "}
                <button onClick={() => switchMode(mode === "register" ? "login" : "register")}
                  className="font-semibold text-slate-900 dark:text-white hover:underline">
                  {mode === "register" ? "Sign in" : "Register"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
