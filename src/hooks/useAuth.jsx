import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../config";

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => loadStoredUser());
  const [loading, setLoading] = useState(!loadStoredUser() && !!localStorage.getItem("token"));
  const didVerify = useRef(false);

  const saveAuth = useCallback((tokenValue, userData) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userData));
    // Reload so mobile viewport is fully reset (no blank screen after auth transition)
    window.location.href = "/";
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Reload the page so mobile viewport/scroll state is fully reset
    window.location.href = "/";
  }, []);

  // Verify token once on load — only if we have a token but no cached user
  useEffect(() => {
    if (didVerify.current) return;
    didVerify.current = true;

    const savedToken = localStorage.getItem("token");
    const savedUser = loadStoredUser();

    if (!savedToken) {
      setLoading(false);
      return;
    }

    // If we have cached user data, trust it — skip /auth/me
    if (savedUser) {
      setLoading(false);
      return;
    }

    // No cached user but have token — verify once
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    saveAuth(data.token, data.user);
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    if (data.token) {
      saveAuth(data.token, data.user);
    }
    return data;
  };

  const verifyEmail = async (email, code) => {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Verification failed");
    }
    const data = await res.json();
    if (data.token) {
      saveAuth(data.token, data.user);
    }
    return data;
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
    } catch {
      // silent — non-critical refresh
    }
  }, []);

  const googleLogin = async (idToken) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Google login failed");
    }
    const data = await res.json();
    saveAuth(data.token, data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyEmail, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
