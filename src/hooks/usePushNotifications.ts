'use client';
import { useState, useEffect, useCallback } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
    // Only show banner if permission is still default
    if (Notification.permission === 'default') {
      setShowBanner(true);
    }
  }, []);

  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const existing = await navigator.serviceWorker.getRegistration('/sw.js');
      if (existing) return existing;
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      console.error('SW registration error:', err);
      return null;
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      setShowBanner(false);

      if (perm !== 'granted') return;

      const reg = await registerServiceWorker();
      if (!reg) return;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error('Push subscribe error:', err);
    }
  }, [registerServiceWorker]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Auto-register SW + subscribe if permission already granted
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    (async () => {
      const reg = await registerServiceWorker();
      if (!reg) return;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) { setSubscribed(true); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
        });
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        setSubscribed(true);
      } catch {
        // Non-critical
      }
    })();
  }, [registerServiceWorker]);

  return { permission, subscribed, showBanner, subscribe, dismissBanner };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}
