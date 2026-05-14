/**
 * Communication Center — Tashqi tizimlar uchun webhook
 *
 *   POST /api/cc/webhooks/:source
 *   Headers:
 *     X-CC-Signature: HMAC-SHA256(secret, raw body) hex
 *     X-CC-Idempotency-Key: unique string  (takroriy so'rovlardan himoya)
 *
 *   Body (JSON):
 *     {
 *       templateCode: string,
 *       senderUserId: number,
 *       subject:      string,
 *       body:         string,
 *       priority?:    'low'|'normal'|'high'|'urgent',
 *       language?:    'uz'|'ru',
 *       metadata?:    object,
 *     }
 *
 *   Secret: process.env.CC_WEBHOOK_SECRET (yoki CC_WEBHOOK_SECRET_<SOURCE> per-source)
 */

import { Body, Controller, Headers, HttpCode, Param, Post, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { CcSpawnPayload } from '../events/cc-event.listener';

const seenKeys = new Map<string, number>();   // idempotency cache (in-memory; TTL 1h)
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000;

@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('cc/webhooks')
export class CcWebhookController {
  constructor(
    private readonly events: EventEmitter2,
    private readonly cfg:    ConfigService,
  ) {}

  @Post(':source')
  @HttpCode(202)
  async receive(
    @Param('source') source: string,
    @Headers('x-cc-signature') signature: string | undefined,
    @Headers('x-cc-idempotency-key') idempKey: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    if (!signature) throw new UnauthorizedException('X-CC-Signature header majburiy');
    if (!idempKey)  throw new BadRequestException('X-CC-Idempotency-Key header majburiy');

    // ── 1. Idempotency tekshiruv ────────────────────────────────────
    this.gcIdempotency();
    if (seenKeys.has(idempKey)) {
      return { ok: true, deduplicated: true };
    }
    // WARN: in-memory idempotency — duplicates NOT caught across multiple API pods.
    // Production fix: store idempKey in Redis with TTL = IDEMPOTENCY_TTL_MS.
    seenKeys.set(idempKey, Date.now());

    // ── 2. HMAC verification ─────────────────────────────────────────
    const secret = this.cfg.get<string>(`CC_WEBHOOK_SECRET_${source.toUpperCase()}`)
                 ?? this.cfg.get<string>('CC_WEBHOOK_SECRET');
    if (!secret) throw new UnauthorizedException(`Webhook secret ${source} uchun sozlanmagan`);

    // NOTE: body is re-serialized JSON — key ordering may differ from sender's original bytes.
    // For strict HMAC verification, enable NestJS rawBody (rawBody: true in NestFactory.create)
    // and read req.rawBody here instead. Senders must use canonical JSON (sorted keys) until then.
    const raw      = JSON.stringify(body);
    const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
    const ok       = this.timingSafeEqual(signature, expected);
    if (!ok) throw new UnauthorizedException('HMAC imzosi noto\'g\'ri');

    // ── 3. Payload validatsiya (engil) ───────────────────────────────
    const payload = body as Partial<CcSpawnPayload>;
    if (typeof payload.templateCode !== 'string' || !payload.templateCode) {
      throw new BadRequestException('templateCode majburiy');
    }
    if (typeof payload.senderUserId !== 'number') {
      throw new BadRequestException('senderUserId majburiy');
    }
    if (typeof payload.subject !== 'string' || !payload.subject) {
      throw new BadRequestException('subject majburiy');
    }
    if (typeof payload.body !== 'string' || !payload.body) {
      throw new BadRequestException('body majburiy');
    }

    // ── 4. Audit yozuvi (cc_audit_trail emas — tashqi voqea uchun alohida)
    await runQuery(sql`
      SELECT 1   -- placeholder; webhook log jadvali keyingi versiyada
    `);

    // ── 5. Event emit qilamiz — listener qabul qiladi va draft yaratadi
    this.events.emit('cc.spawn', payload as CcSpawnPayload);

    return { ok: true, queued: true };
  }

  // ─────────────────────────────────────────────────────────────────────
  private gcIdempotency() {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [key, ts] of seenKeys) {
      if (ts < cutoff) seenKeys.delete(key);
    }
  }

  private timingSafeEqual(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'utf8');
      const bufB = Buffer.from(b, 'utf8');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch { return false; }
  }
}
