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

import { Body, Controller, Headers, HttpCode, Param, Post, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { EventBus } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import * as crypto from 'crypto';
import { z } from 'zod';
import { CacheService } from '@common/cache/cache.service';
import { CcSpawnRequestedEvent, type CcSpawnRequestedEventProps as CcSpawnPayload } from '../domain/events/cc-spawn-requested.event';

const CcWebhookSchema = z.object({
  templateCode: z.string().min(1),
  senderUserId: z.number().int(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  language: z.enum(['uz', 'ru']).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

const IDEMPOTENCY_TTL_SECONDS = 60 * 60; // 1h

@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('cc/webhooks')
export class CcWebhookController {
  private readonly logger = new Logger(CcWebhookController.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly cfg:      ConfigService,
    private readonly i18n:     I18nService,
    private readonly cache:    CacheService,
  ) {}

  @Post(':source')
  @HttpCode(202)
  async receive(
    @Param('source') source: string,
    @Headers('x-cc-signature') signature: string | undefined,
    @Headers('x-cc-idempotency-key') idempKey: string | undefined,
    @Body() body: unknown,
  ) {
    const parsedBody = CcWebhookSchema.parse(body);
    if (!signature) throw new UnauthorizedException(await this.i18n.t('errors.signatureHeaderRequired'));
    if (!idempKey)  throw new BadRequestException(await this.i18n.t('errors.idempotencyKeyRequired'));

    // ── 1. Idempotency tekshiruv (Redis orqali — API pod'lar orasida umumiy) ──
    const idempCacheKey = `cc:webhook:idempotency:${idempKey}`;
    const alreadySeen = await this.cache.get<boolean>(idempCacheKey);
    if (alreadySeen) {
      return { ok: true, deduplicated: true };
    }
    await this.cache.set(idempCacheKey, true, { ttlSeconds: IDEMPOTENCY_TTL_SECONDS });

    // ── 2. HMAC verification ─────────────────────────────────────────
    const secret = this.cfg.get<string>(`CC_WEBHOOK_SECRET_${source.toUpperCase()}`)
                 ?? this.cfg.get<string>('CC_WEBHOOK_SECRET');
    if (!secret) throw new UnauthorizedException(await this.i18n.t('errors.webhookSecretNotConfigured', { args: { source } }));

    // NOTE: body is re-serialized JSON — key ordering may differ from sender's original bytes.
    // For strict HMAC verification, enable NestJS rawBody (rawBody: true in NestFactory.create)
    // and read req.rawBody here instead. Senders must use canonical JSON (sorted keys) until then.
    const raw      = JSON.stringify(body);
    const expected = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
    const ok       = this.timingSafeEqual(signature, expected);
    if (!ok) throw new UnauthorizedException(await this.i18n.t('errors.hmacInvalid'));

    // ── 3. Payload validatsiya (Zod schema validated above) ──────────
    const payload = parsedBody as CcSpawnPayload;

    // ── 4. Audit yozuvi: cc_audit_trail bu yerga mos emas (document_id talab
    //    qiladi, u hali mavjud emas — draft keyingi qadamda listener ichida
    //    yaratiladi). Alohida webhook-log jadvali hali YO'Q (Q-35: yangi jadval
    //    yaratish egasi ruxsatini talab qiladi — shu band doirasidan tashqarida).
    //    Hozircha structured log bilan qayd etamiz; DB audit — kelgusi vazifa.
    this.logger.log(`webhook qabul qilindi: source=${source} templateCode=${payload.templateCode} idempKey=${idempKey}`);

    // ── 5. CQRS EventBus orqali publish qilamiz — CcEventListener
    //    (@EventsHandler(CcSpawnRequestedEvent)) qabul qiladi va draft yaratadi.
    //    Eslatma: legacy EventEmitter2 'cc.spawn' string-topic ENDI hech kim
    //    tinglamaydi (listener CQRS'ga ko'chirilgan) — shuning uchun aynan
    //    shu class orqali publish qilish shart.
    this.eventBus.publish(new CcSpawnRequestedEvent(payload));

    return { ok: true, queued: true };
  }

  // ─────────────────────────────────────────────────────────────────────
  private timingSafeEqual(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'utf8');
      const bufB = Buffer.from(b, 'utf8');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch { return false; }
  }
}
