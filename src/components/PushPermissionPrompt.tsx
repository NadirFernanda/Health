"use client";

import { useEffect, useRef } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushPermissionPrompt() {
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    tried.current = true;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    async function setup() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // Only subscribe if permission already granted; don't auto-prompt on first load
        if (Notification.permission === "granted") {
          await subscribe(reg);
        }
      } catch {
        // SW registration failed — non-fatal
      }
    }

    setup();
  }, []);

  return null;
}

export async function requestPushPermission(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    await subscribe(reg);
    return true;
  } catch {
    return false;
  }
}

async function subscribe(reg: ServiceWorkerRegistration) {
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = sub.toJSON();
  if (!json.keys?.p256dh || !json.keys?.auth) return;

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  });
}
