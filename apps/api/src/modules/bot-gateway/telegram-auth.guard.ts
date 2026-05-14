/**
 * @module telegram-auth.guard
 * @description NestJS guard. canActivate() returns true when access is permitted; throws Unauthorized/Forbidden otherwise.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface BotEmployee {
  id:         number;
  fullName:   string;
  role:       string;
  telegramId: string;
}

export interface TelegramWebhookRequest {
  headers:      Record<string, string | string[] | undefined>;
  params:       Record<string, string>;
  body:         unknown;
  botEmployee?: BotEmployee;
  botName?:     string;
  botLinked?:   boolean;
}

type Row = Record<string, unknown>;

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  private readonly logger = new Logger(TelegramAuthGuard.name);

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<TelegramWebhookRequest>();

    /* 1. Validate webhook secret token via constant-time comparison */
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    const rawToken    = Array.isArray(secretToken) ? secretToken[0] : secretToken;
    const botName     = req.params['bot'] ?? '';
    const envKey      = `TELEGRAM_SECRET_TOKEN_${botName.toUpperCase()}`;
    const expected    = this.config.get<string>(envKey) ?? this.config.get<string>('TELEGRAM_SECRET_TOKEN');

    if (expected) {
      if (!rawToken || !this.timingSafeCompare(rawToken, expected)) {
        this.logger.warn({ msg: 'Bot webhook rejected: invalid secret token', botName });
        throw new UnauthorizedException('Invalid bot webhook token');
      }
    }
    /* In production, expected must always be set. Dev-mode warning logged only in non-production. */
    else if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.warn({ msg: `No secret token configured for bot ${botName} — dev mode only` });
    } else {
      this.logger.error({ msg: `No secret token configured for bot ${botName} in production!` });
      throw new UnauthorizedException('Bot secret token not configured');
    }

    /* 2. Resolve telegram_id → employee — reject if not linked */
    const body = req.body as {
      message?: { from?: { id?: number | string } };
      callback_query?: { from?: { id?: number | string } };
    };

    const telegramId = String(
      body?.message?.from?.id ?? body?.callback_query?.from?.id ?? '',
    );

    if (!telegramId || telegramId === '' || telegramId === 'undefined') {
      req.botName = botName;
      return true;
    }

    const rows = await runQuery<Row>(sql`
      SELECT e.id, e.full_name, u.role, e.telegram_chat_id
      FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE e.telegram_chat_id = ${telegramId}
        AND LOWER(e.status) = 'active'
      LIMIT 1
    `).then((r) => r.rows).catch((e: unknown) => {
      this.logger.error({ msg: 'TelegramAuthGuard employee lookup failed', err: e });
      return [] as Row[];
    });

    if (rows.length === 0) {
      this.logger.warn({ msg: 'Telegram user not linked to active employee', telegramId, botName });
      // Do not throw 401 — let the controller return a user-friendly bot message
      req.botLinked = false;
      req.botName   = botName;
      return true;
    }

    const r = rows[0] as Record<string, unknown>;
    req.botEmployee = {
      id:         Number(r['id'] ?? 0),
      fullName:   String(r['full_name'] ?? ''),
      role:       String(r['role'] ?? 'employee'),
      telegramId,
    };
    req.botName = botName;
    return true;
  }

  private timingSafeCompare(a: string, b: string): boolean {
    const aBuf = Buffer.from(a,  'utf8');
    const bBuf = Buffer.from(b,  'utf8');
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
  }
}
