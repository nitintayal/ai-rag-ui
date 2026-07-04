import { API_BASE } from "./config";

export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function authFetch(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(token),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:401"));
  }
  return res;
}
