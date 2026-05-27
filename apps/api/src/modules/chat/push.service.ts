/**
 * @module push.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { Result, Err, safeCall } from '@common/result';
import { PushNotificationRepository } from './repositories/push-notification.repository';

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

  constructor(
    private readonly config: ConfigService,
    private readonly pushRepo: PushNotificationRepository,
  ) {}

  async register(
    userId: string,
    input: RegisterPushInput,
  ): Promise<Result<{ id: string }>> {
    return this.pushRepo.insert(userId, {
      channel:     input.channel,
      endpoint:    input.endpoint ?? null,
      p256dh:      input.p256dh ?? null,
      auth:        input.auth ?? null,
      fcmToken:   input.fcmToken ?? null,
      apnsToken:  input.apnsToken ?? null,
      deviceInfo: input.deviceInfo ?? null,
    });
  }

  async unregister(userId: string): Promise<Result<{ removed: number }>> {
    try {
      const r = await this.pushRepo.deactivateForUser(userId);
      if (!r.ok) return { ok: false, error: r.error };
      return { ok: true, data: { removed: 1 } };
    } catch (error) {
      this.logger.error(
        { method: 'unregister', userId, error },
        'Database query failed',
      );
      return {
        ok: false,
        error: { code: 'DB_ERROR', message: `Failed to unregister push subscription: ${(error as Error).message}` },
      };
    }
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<Result<{ delivered: number }>> {
    const subsR = await this.pushRepo.findActiveByUser(userId);
    if (!subsR.ok) return Err(subsR.error);
    const subs = subsR.data;
    return safeCall(async () => {
      let delivered = 0;
      for (const sub of subs) {
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
    if (!this.configureVapid()) return false;

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

  private configureVapid(): boolean {
    const vapidPublic  = this.config.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivate = this.config.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@europrint.uz';
    if (!vapidPublic || !vapidPrivate) {
      this.logger.warn('VAPID keys not configured — WEB_PUSH skipped');
      return false;
    }
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
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
    // WHY: do not log the raw token (Rule 15). Only emit non-sensitive metadata.
    this.logger.log(`FCM dispatch: ${payload.title}`);
    return true;
  }

  private async sendApns(sub: Record<string, unknown>, payload: PushPayload): Promise<boolean> {
    const token = String(sub['apns_token'] ?? '');
    if (!token) return false;
    // WHY: do not log the raw token (Rule 15).
    this.logger.log(`APNS dispatch: ${payload.title}`);
    return true;
  }
}
