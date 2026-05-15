/**
 * @module webPush
 * @description React UI component.
 */

import { getAuthHeaders } from '@/lib/queryClient';

export async function registerWebPush(vapidPublicKey: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.register('/chat-sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await sendSubscription(existing);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
    });
    await sendSubscription(subscription);
    return true;
  } catch (err) {
    console.warn('registerWebPush failed:', err);
    return false;
  }
}

async function sendSubscription(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  const res = await fetch('/api/chat/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      channel:    'WEB_PUSH',
      endpoint:   json.endpoint ?? null,
      p256dh:     json.keys?.p256dh ?? null,
      auth:       json.keys?.auth ?? null,
      deviceInfo: { userAgent: navigator.userAgent },
    }),
  });
  if (!res.ok) {
    console.warn('Push subscribe failed:', res.status);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}
