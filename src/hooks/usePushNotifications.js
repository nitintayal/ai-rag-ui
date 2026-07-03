import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(token) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swReg, setSwReg] = useState(null);

  const hdrs = (extra = {}) => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      setSwReg(reg);
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    }).catch(console.error);
  }, []);

  const subscribe = useCallback(async () => {
    if (!swReg || loading) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      // Fetch VAPID public key from backend
      const keyRes = await fetch(`${API_BASE}/push/vapid-public-key`, { headers: hdrs() });
      if (!keyRes.ok) throw new Error("Push not configured on server");
      const { publicKey } = await keyRes.json();

      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = sub.toJSON();
      await fetch(`${API_BASE}/push/subscribe`, {
        method: "POST",
        headers: hdrs(),
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      setSubscribed(true);
    } catch (e) {
      console.error("Push subscribe error:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [swReg, token, loading]);

  const unsubscribe = useCallback(async () => {
    if (!swReg || loading) return;
    setLoading(true);
    try {
      const sub = await swReg.pushManager.getSubscription();
      if (!sub) { setSubscribed(false); return; }
      const subJson = sub.toJSON();
      await sub.unsubscribe();
      await fetch(`${API_BASE}/push/subscribe`, {
        method: "DELETE",
        headers: hdrs(),
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      setSubscribed(false);
    } catch (e) {
      console.error("Push unsubscribe error:", e);
    } finally {
      setLoading(false);
    }
  }, [swReg, token, loading]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
