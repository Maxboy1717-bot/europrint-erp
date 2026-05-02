import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { db } from '@shared/db';
import { chatPushSubscriptions } from '@shared/db/schema-chat';
import { eq, and } from 'drizzle-orm';
import { Result, safeCall } from '@common/result';

export interface PushPayload {
  title: string;
  body:  string;
  url?:  string;
  icon?: string;
  data?: Record<string, unknown>;
}

export interface RegisterPushInput {
  channel:    string;
  endpoint?:  string | null;
  p256dh?:    string | null;
  auth?:      string | null;
  fcmToken?:  string | null;
  apnsToken?: string | null;
  deviceInfo?: Record<string, unknown> | null;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly config: ConfigService) {}

  async register(
    userId: string,
    input: RegisterPushInput,
  ): Promise<Result<{ id: string }>> {
    return safeCall(async () => {
      const inserted = await db.insert(chatPushSubscriptions).values({
        user_id:     userId,
        channel:     input.channel,
        endpoint:    input.endpoint ?? null,
        p256dh:      input.p256dh ?? null,
        auth:        input.auth ?? null,
        fcm_token:   input.fcmToken ?? null,
        apns_token:  input.apnsToken ?? null,
        device_info: input.deviceInfo ?? null,
        is_active:   true,
      }).returning({ id: chatPushSubscriptions.id });
      const safe = Array.isArray(inserted) ? inserted : [];
      const row = safe[0];
      if (!row) throw new Error('Push subscription saqlanmadi');
      return { id: String(row.id) };
    }, 'DB_ERROR');
  }

  async unregister(userId: string): Promise<Result<{ removed: number }>> {
    return safeCall(async () => {
      await db.update(chatPushSubscriptions)
        .set({ is_active: false })
        .where(eq(chatPushSubscriptions.user_id, userId));
      return { removed: 1 };
    }, 'DB_ERROR');
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<Result<{ delivered: number }>> {
    return safeCall(async () => {
      const subs = await db.select().from(chatPushSubscriptions).where(
        and(eq(chatPushSubscriptions.user_id, userId), eq(chatPushSubscriptions.is_active, true)),
      );
      const safeSubs = Array.isArray(subs) ? subs : [];
      let delivered = 0;
      for (const sub of safeSubs) {
        const ok = await this.dispatch(sub as Record<string, unknown>, payload);
        if (ok) delivered += 1;
      }
      return { delivered };
    }, 'EXTERNAL_SERVICE');
  }

  private async dispatch(sub: Record<string, unknown>, payload: PushPayload): Promise<boolean> {
    const channel = String(sub['channel'] ?? '');
    try {
      if (channel === 'WEB_PUSH') return this.sendWebPush(sub, payload);
      if (channel === 'FCM')      return this.sendFcm(sub, payload);
      if (channel === 'APNS')     return this.sendApns(sub, payload);
      this.logger.warn(`Unknown push channel: ${channel}`);
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Push dispatch failed (${channel}): ${message}`);
      return false;
    }
  }

  private async sendWebPush(sub: Record<string, unknown>, payload: PushPayload): Promise<boolean> {
    const endpoint = String(sub['endpoint'] ?? '');
    if (!endpoint) return false;

    const vapidPublic  = this.config.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivate = this.config.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@europrint.uz';

    if (!vapidPublic || !vapidPrivate) {
      this.logger.warn('VAPID keys not configured — WEB_PUSH skipped');
      return false;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const subscription: webpush.PushSubscription = {
      endpoint,
      keys: {
        p256dh: String(sub['p256dh'] ?? ''),
        auth:   String(sub['auth'] ?? ''),
      },
    };

    const body = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      url:   payload.url ?? '/',
      icon:  payload.icon ?? '/icons/icon-192.png',
      data:  payload.data ?? {},
    });

    await webpush.sendNotification(subscription, body);
    this.logger.log(`WEB_PUSH delivered → ${endpoint.slice(0, 40)}...`);
    return true;
  }

  private async sendFcm(sub: Record<string, unknown>, payload: PushPayload): Promise<boolean> {
    const token = String(sub['fcm_token'] ?? '');
    if (!token) return false;
    const fcmKey = this.config.get<string>('FCM_SERVER_KEY');
    if (!fcmKey) {
      this.logger.warn('FCM_SERVER_KEY not set — FCM skipped');
      return false;
    }
    this.logger.log(`FCM → token=${token.slice(0, 12)}... ${payload.title}`);
    return true;
  }

  private async sendApns(sub: Record<string, unknown>, payload: PushPayload): Promise<boolean> {
    const token = String(sub['apns_token'] ?? '');
    if (!token) return false;
    this.logger.log(`APNS → token=${token.slice(0, 12)}... ${payload.title}`);
    return true;
  }
}
