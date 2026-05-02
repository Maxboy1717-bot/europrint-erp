/**
 * keyset-pagination.service.ts — TZ-61: Keyset (Cursor) Pagination.
 *
 * OFFSET ishlatilmaydi — katta jadvallarda O(N) saralash muammosini bartaraf etadi.
 *
 * Cursor formula:
 *   cursor = base64url(JSON.stringify({ createdAt: ISO-string, id: string }))
 *
 * WHERE sharti:
 *   (created_at, id) < (cursor_ts, cursor_id)   — DESC tartib uchun
 *   (created_at, id) > (cursor_ts, cursor_id)   — ASC tartib uchun
 *
 * Cursor OPAQUE: client uchun ma'nosiz — faqat keyingi sahifani olish uchun ishlatiladi.
 *
 * TAQIQLANGAN: OFFSET/LIMIT faqat keyset emas
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError } from '@common/result';

export interface KeysetCursor {
  createdAt: string;
  id: string;
}

export interface PageResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class KeysetPaginationService {
  /**
   * Cursor tokenini yaratish — base64url encode.
   * Opaque token: client tomon ma'no chiqarmaydi.
   */
  encodeCursor(cursor: KeysetCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  /**
   * Cursor tokenini dekod qilish.
   * Noto'g'ri token → VALIDATION xato.
   */
  decodeCursor(token: string): Result<KeysetCursor, AppError> {
    try {
      const raw = Buffer.from(token, 'base64url').toString('utf8');
      const parsed = JSON.parse(raw) as KeysetCursor;
      if (!parsed.createdAt || !parsed.id) {
        return Err({ code: 'VALIDATION', message: 'Cursor token noto\'g\'ri formatda' });
      }
      return Ok(parsed);
    } catch {
      return Err({ code: 'VALIDATION', message: 'Cursor token decode qilib bo\'lmadi' });
    }
  }

  /**
   * Keyingi cursor tokenini qatorlar ro'yxatidan hosil qilish.
   * Agar qatorlar soni limit ga teng bo'lsa — keyingi sahifa bor.
   * Sahifa tugasa undefined qaytaradi.
   */
  buildNextCursor<T extends { id: string; createdAt: Date | string }>(
    rows: T[],
    limit: number,
  ): string | undefined {
    if (rows.length < limit) return undefined;
    const last = rows[rows.length - 1];
    const createdAt =
      last.createdAt instanceof Date
        ? last.createdAt.toISOString()
        : last.createdAt;
    return this.encodeCursor({ createdAt, id: last.id });
  }

  /**
   * Keyset WHERE shartlari uchun parametrlar.
   * Drizzle SQL qurishda ishlatiladi.
   *
   * DESC: (created_at, id) < (cursor_ts, cursor_id)
   * ASC:  (created_at, id) > (cursor_ts, cursor_id)
   */
  cursorToParams(
    cursor: KeysetCursor,
    order: 'ASC' | 'DESC' = 'DESC',
  ): { createdAt: Date; id: string; order: 'ASC' | 'DESC' } {
    return {
      createdAt: new Date(cursor.createdAt),
      id: cursor.id,
      order,
    };
  }

  /**
   * In-memory sahifalash (test va kichik to'plamlar uchun).
   * DB keyset so'rovi o'rniga ishlatilmaydi.
   */
  paginateInMemory<T extends { id: string; createdAt: Date | string }>(
    allItems: T[],
    cursor: string | null,
    limit: number,
  ): Result<PageResult<T>, AppError> {
    if (limit < 1 || limit > 1000) {
      return Err({ code: 'VALIDATION', message: 'Limit 1-1000 oralig\'ida bo\'lishi kerak' });
    }

    let startIdx = 0;

    if (cursor) {
      const decoded = this.decodeCursor(cursor);
      if (!decoded.ok) return decoded as Result<PageResult<T>, AppError>;

      const cursorTs = new Date(decoded.data.createdAt).getTime();
      const idx = (allItems ?? []).findIndex(
        item =>
          new Date(item.createdAt).getTime() === cursorTs &&
          item.id === decoded.data.id,
      );
      startIdx = idx < 0 ? allItems.length : idx + 1;
    }

    const slice = allItems.slice(startIdx, startIdx + limit);
    const nextCursor = this.buildNextCursor(slice, limit) ?? null;

    return Ok({
      data: slice,
      nextCursor,
      hasMore: nextCursor !== null,
    });
  }
}
