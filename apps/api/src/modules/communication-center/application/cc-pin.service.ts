/**
 * Communication Center — PIN imzolash xizmati
 *
 * Har xodim bitta PIN qo'yadi (bcrypt hash). Hujjat yuborish/tasdiqlash/rad etishda
 * PIN tekshiriladi va `signature_hash` yaratiladi (audit uchun).
 */

/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM query builder cannot
 *   express: ON CONFLICT DO UPDATE WITH EXCLUDED column reference
 *   (`ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash`) —
 *   Drizzle's onConflictDoUpdate API does not support EXCLUDED. Target table
 *   `cc_user_pins` is not present in the Drizzle schema barrel.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

@Injectable()
export class CcPinService {
  private readonly logger = new Logger(CcPinService.name);

  constructor(private readonly i18n: I18nService) {}

  /** Yangi PIN o'rnatish yoki o'zgartirish (4-8 raqam) */
  async setPin(userId: number, pin: string): Promise<void> {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new BadRequestException(await this.i18n.t('errors.pinLengthInvalid'));
    }
    const pinHash = await bcrypt.hash(pin, 10);
    await runQuery(sql`
      INSERT INTO cc_user_pins (user_id, pin_hash, updated_at)
      VALUES (${userId}, ${pinHash}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = NOW()
    `);
  }

  /** Foydalanuvchi PIN o'rnatganmi? */
  async hasPin(userId: number): Promise<boolean> {
    const r = await runQuery<{ user_id: number }>(sql`
      SELECT user_id FROM cc_user_pins WHERE user_id = ${userId} LIMIT 1
    `);
    return r.rows.length > 0;
  }

  /** PIN tekshirish — to'g'ri bo'lsa imzolar uchun signature_hash qaytaradi */
  async verifyAndSign(userId: number, pin: string, payloadForHash: string): Promise<string> {
    const r = await runQuery<{ pin_hash: string }>(sql`
      SELECT pin_hash FROM cc_user_pins WHERE user_id = ${userId} LIMIT 1
    `);
    const row = r.rows[0];
    if (!row) {
      throw new UnauthorizedException(await this.i18n.t('errors.pinNotSet'));
    }
    const ok = await bcrypt.compare(pin, row.pin_hash);
    if (!ok) {
      throw new UnauthorizedException(await this.i18n.t('errors.pinIncorrect'));
    }
    // Imzo uchun deterministik hash — payload + userId + timestamp
    const ts = Date.now();
    const sig = crypto
      .createHash('sha256')
      .update(`${userId}|${payloadForHash}|${ts}|${row.pin_hash.slice(-12)}`)
      .digest('hex');
    return `cc:v1:${ts}:${sig}`;
  }
}
