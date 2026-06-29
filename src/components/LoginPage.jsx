import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";

export default function LoginPage() {
  const { login, register, verifyEmail, googleLogin } = useAuth();
  const [mode, setMode] = useState("login"); // login | register | forgot | verify_sent
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateRegister = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email";
    if (password.length < 6) errors.password = "Password must be at least 6 characters";
    else if (!/[A-Z]/.test(password)) errors.password = "Include at least one uppercase letter";
    else if (!/[0-9]/.test(password)) errors.password = "Include at least one number";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setValidationErrors({});

    if (mode === "register" && !validateRegister()) return;

    setLoading(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
        setMode("verify_sent");
        setSuccess("Check your email for a verification link.");
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setSuccess(data.message || "If this email exists, a reset code has been sent.");
    } catch (err) {
      setSuccess("If this email exists, a reset code has been sent.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google login not configured");
      return;
    }
    const redirectUri = window.location.origin;
    const scope = "openid email profile";
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${Date.now()}`;
    window.location.href = url;
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setValidationErrors({});
  };

  const inputClass = (field) =>
    `w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 ${
      validationErrors[field] ? "border-rose-400" : "border-slate-300"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">AI Personal Assistant</h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in to continue"}
          </p>
        </div>

        {mode === "verify_sent" ? (
          <div className="mt-8 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
            <p className="text-sm text-slate-500">
              We've sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
            <p className="text-xs text-slate-400">Didn't receive it? Check your spam folder.</p>
            <button
              onClick={() => switchMode("login")}
              className="mt-4 text-sm font-medium text-slate-900 hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : mode === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className={inputClass()}
            />
            {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
            {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {loading ? "..." : "Send Reset Link"}
            </button>
            <p className="text-center text-sm text-slate-500">
              <button onClick={() => switchMode("login")} className="font-medium text-slate-900 hover:underline">
                Back to sign in
              </button>
            </p>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {mode === "register" && (
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className={inputClass("name")}
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-xs text-rose-500">{validationErrors.name}</p>
                  )}
                </div>
              )}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className={inputClass("email")}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-rose-500">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className={inputClass("password")}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-rose-500">{validationErrors.password}</p>
                )}
              </div>
              {mode === "register" && (
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className={inputClass("confirmPassword")}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-500">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
              {success && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {loading ? "..." : mode === "register" ? "Create Account" : "Sign In"}
              </button>
            </form>

            {mode === "login" && error && (
              <p className="mt-2 text-right">
                <button onClick={() => switchMode("forgot")} className="text-sm text-slate-500 hover:text-slate-900 hover:underline">
                  Forgot password?
                </button>
              </p>
            )}

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="mt-5">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-400">or</span>
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
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

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === "register" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => switchMode(mode === "register" ? "login" : "register")}
                className="font-medium text-slate-900 hover:underline"
              >
                {mode === "register" ? "Sign in" : "Register"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
