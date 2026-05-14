/**
 * @module pos-telegram.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { SECONDS_PER_HOUR, MS_PER_SECOND } from '@common/constants/app.constants';
/**
 * POS — Telegram Service
 *
 * Telegram Mini-App integratsiyasi:
 *  1. Foydalanuvchi autentifikatsiya (initData validation)
 *  2. Session boshqaruv
 *  3. Mini-app uchun barcode skanerlash (kamera orqali)
 *  4. Bildirishnomalar (harakatlar, tasdiqlash so'rovlari)
 *
 * Telegram Mini-App WebApp.initData HMAC-SHA256 bilan tekshiriladi
 */

import {
  Injectable, Logger, UnauthorizedException, BadRequestException,
  OnModuleInit, OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { PosTelegramExtService } from './pos-telegram-ext.service';
import * as crypto from 'crypto';
import { PosTelegramRepository } from '../pos-telegram.repository';
import { safeJsonParse } from '@shared/utils/safe-json';

const SESSION_TTL_HOURS = 24;
const TG_SESSION_CACHE_KEY = (token: string) => `tg:session:${token}`;

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<unknown>;
  del(key: string): Promise<number>;
  quit(): Promise<unknown>;
  connect?(): Promise<void>;
};

@Injectable()
export class PosTelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PosTelegramService.name);
  private readonly botToken: string;
  private redisClient: RedisLike | null = null;
  private readonly memCache = new Map<string, { data: string; expiresAt: number }>();

  constructor(
    private readonly config:  ConfigService,
    private readonly extSvc:  PosTelegramExtService,
    private readonly telegramRepo: PosTelegramRepository,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN topilmadi — Telegram integratsiya ishlamaydi');
    }
  }

  onModuleInit(): void { this._initBackground().catch((e) => this.logger.warn('[pos-telegram.service] init failed: ' + e)); }
  private async _initBackground(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) return;
    const r = await safeCall(async () => {
      const { default: Redis } = await import('ioredis');
      this.redisClient = new Redis(redisUrl, { maxRetriesPerRequest: 2, lazyConnect: true }) as RedisLike;
      await (this.redisClient)?.connect?.();
    });
    if (!r.ok) this.redisClient = null;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) await this.redisClient.quit().catch((e: unknown) => { this.logger.warn('Redis quit error', String(e)); });
  }

  private get redis() {
    return {
      get: async (key: string) => {
        if (this.redisClient) return this.redisClient.get(key);
        const e = this.memCache.get(key);
        return e && e.expiresAt > Date.now() ? e.data : null;
      },
      setex: async (key: string, ttl: number, value: string) => {
        if (this.redisClient) return this.redisClient.setex(key, ttl, value);
        this.memCache.set(key, { data: value, expiresAt: Date.now() + ttl * MS_PER_SECOND });
      },
      del: async (key: string) => {
        if (this.redisClient) return this.redisClient.del(key);
        this.memCache.delete(key);
        return 1;
      },
    };
  }

  // ─── Telegram initData Tekshirish ─────────────────────────────────────────

  validateInitData(initData: string): Record<string, string> {
    if (!this.botToken) throw new UnauthorizedException('Telegram bot sozlanmagan');

    const params = new URLSearchParams(initData);
    const hash   = params.get('hash');
    if (!hash) throw new UnauthorizedException('initData da hash yo\'q');

    params.delete('hash');

    // Saralash va data_check_string yasash
    const dataCheckArr: string[] = [];
    (Array.isArray(params) ? params : []).forEach((value, key) => dataCheckArr.push(`${key}=${value}`));
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // HMAC-SHA256 tekshirish
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (expectedHash !== hash) {
      throw new UnauthorizedException('Telegram initData tekshiruvi muvaffaqiyatsiz');
    }

    // Ma'lumotlarni parse qilish
    const result: Record<string, string> = {};
    (Array.isArray(params) ? params : []).forEach((value, key) => result[key] = value);
    return result;
  }

  // ─── Session Yaratish / Yangilash ─────────────────────────────────────────

  async createOrRenewSession(input: {
    telegramUserId: bigint;
    chatId?: bigint;
    initData: string;
  }): Promise<{ token: string; userId: number; expiresAt: Date }> {
    // initData tekshirish
    const tgData = this.validateInitData(input.initData);

    // Foydalanuvchini ERP da topish (telegram_id orqali)
    const user = await this.telegramRepo.getUserByTelegramId(input.telegramUserId);

    if (!user || !user.ok || user.data === null) {
      throw new UnauthorizedException(
        'Bu Telegram akkaunt ERP tizimiga bog\'liq emas. Admin bilan bog\'laning.',
      );
    }

    // Session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * SECONDS_PER_HOUR * MS_PER_SECOND);

    // Eski sessiyalarni deaktivatsiya
    await this.telegramRepo.deactivateUserSessions(Number(input.telegramUserId));

    // Yangi sessiya
    await this.telegramRepo.createSession({
      telegramUserId: input.telegramUserId,
      userId:         user.data?.id,
      chatId:         input.chatId,
      sessionToken:   token,
      expiresAt,
      isActive:       true,
    } as never);

    // Redis cache
    await this.redis.setex(
      TG_SESSION_CACHE_KEY(token),
      SESSION_TTL_HOURS * SECONDS_PER_HOUR,
      JSON.stringify({ userId: user.data?.id, telegramUserId: String(input.telegramUserId) }),
    );

    this.logger.log(`Telegram sessiya yaratildi: tg_user=${input.telegramUserId} user=${user.data?.id}`);

    return { token, userId: Number(user.data?.id), expiresAt };
  }

  // ─── Session Tekshirish ───────────────────────────────────────────────────

  async validateSession(token: string): Promise<{ userId: number; telegramUserId: bigint }> {
    // Redis cache
    const cached = await this.redis.get(TG_SESSION_CACHE_KEY(token));
    if (cached) {
      const data = safeJsonParse<{ userId: number; telegramUserId: string } | null>(cached, null);
      if (data) return { userId: data.userId, telegramUserId: BigInt(data.telegramUserId) };
    }

    // DB tekshirish
    const session = await this.telegramRepo.findActiveSessionByToken(token);
    if (!session) throw new UnauthorizedException('Telegram sessiya yaroqsiz yoki muddati o\'tgan');

    // Cache yangilash
    await this.telegramRepo.touchSession(token);

    const sessionData = session.data as { userId: number; telegramUserId: bigint };
    await this.redis.setex(
      TG_SESSION_CACHE_KEY(token),
      SECONDS_PER_HOUR,
      JSON.stringify({ userId: sessionData.userId, telegramUserId: String(sessionData.telegramUserId) }),
    );

    return { userId: sessionData.userId, telegramUserId: BigInt(sessionData.telegramUserId) };
  }

  // ─── Bildirishnoma Yuborish ───────────────────────────────────────────────

  async sendNotification(
    telegramUserId: bigint,
    message: string,
    keyboard?: Array<Array<{ text: string; callback_data: string }>>,
  ): Promise<void> {
    if (!this.botToken) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const body = {
        chat_id: String(telegramUserId),
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Telegram xabar yuborishda xato: ${error}`);
      }
    } catch (err) {
      this.logger.error(`Telegram API xato: ${(err as Error).message}`);
    }
  }

  /**
   * Broadcast an alert to all admin telegram chats. Used by background jobs
   * (low-stock, inactive-materials, inventory-passport) where there's no
   * specific recipient. Best-effort: failures are logged but not thrown.
   */
  async sendAlert(input: {
    title:    string;
    body:     string;
    severity: 'info' | 'warning' | 'critical';
  }): Promise<void> {
    if (!this.botToken) return;
    const icon = input.severity === 'critical' ? '🚨' : input.severity === 'warning' ? '⚠️' : 'ℹ️';
    const text = `${icon} <b>${input.title}</b>\n\n${input.body}`;
    try {
      const admins = await this.telegramRepo.getAdminChatIds();
      const chatIds = admins.ok ? admins.data : [];
      for (const chatId of chatIds) {
        await this.sendNotification(BigInt(chatId), text).catch((e: unknown) =>
          this.logger.warn(`sendAlert to chat ${chatId} failed: ${(e as Error).message}`),
        );
      }
    } catch (err) {
      this.logger.warn(`sendAlert failed: ${(err as Error).message}`);
    }
  }

  // ─── Hodisa Bildirishnomalari ─────────────────────────────────────────────

  async notifyRequestPending(requestId: number, requestNumber: string, departmentCode: string) {
    // Bo'lim mudiriga bildirishnoma
    const managers = await this.telegramRepo.getManagersByDepartment(departmentCode);

    for (const mgr of (managers.ok ? managers.data : [])) {
      if (!mgr.telegram_id) continue;
      await this.sendNotification(
        BigInt(mgr.telegram_id as string | number),
        `📋 <b>Yangi material so'rov</b>\n\nSo'rov: <code>${requestNumber}</code>\nBo'lim: ${departmentCode}\n\n<a href="tg://miniapp?start=req_${requestId}">Ko'rish</a>`,
      );
    }
  }

  async notifyMovementApprovalRequired(
    movementId: number, movementNumber: string, assignedTo: number,
  ) {
    return this.extSvc.notifyMovementApprovalRequired(movementId, movementNumber, assignedTo);
  }

  async notifyQcRequired(movementId: number, movementNumber: string) {
    return this.extSvc.notifyQcRequired(movementId, movementNumber);
  }
}
