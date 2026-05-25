/**
 * @module telegram-user-acl
 * @description ACL translator: legacy telegram-user rows (from
 * `telegram-admin.service.ts:getUsers` joined to `positions`) ↔ canonical
 * `TelegramUserDto` consumed by new BC-10 (Platform / Notifications) code.
 *
 * The legacy SELECT mixes camelCase aliases (`"chatId"`, `"firstName"`,
 * `"isActive"`) with snake_case extras. The translator narrows the row to
 * a strict camelCase DTO and coerces `isActive` to a real boolean.
 *
 * TODO PA2-14: drop once a typed `TelegramUserRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyTelegramUserRow {
  id: string | number;
  chatId?: unknown;
  username?: unknown;
  firstName?: unknown;
  status?: unknown;
  isActive?: unknown;
  role?: unknown;
}

export interface TelegramUserDto {
  id: string;
  chatId: string | null;
  username: string | null;
  firstName: string | null;
  status: string;
  isActive: boolean;
  role: string | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toBool(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    return s === 't' || s === 'true' || s === '1' || s === 'yes' || s === 'active';
  }
  return false;
}

export class TelegramUserAclTranslator
  implements IAclTranslator<LegacyTelegramUserRow, TelegramUserDto>
{
  toDomain(legacy: LegacyTelegramUserRow): Result<TelegramUserDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'TelegramUserAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'TelegramUserAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      chatId: toStr(legacy.chatId),
      username: toStr(legacy.username),
      firstName: toStr(legacy.firstName),
      status: toStr(legacy.status) ?? 'unknown',
      isActive: toBool(legacy.isActive),
      role: toStr(legacy.role),
    });
  }

  toLegacy(domain: TelegramUserDto): LegacyTelegramUserRow {
    return {
      id: domain.id,
      chatId: domain.chatId,
      username: domain.username,
      firstName: domain.firstName,
      status: domain.status,
      isActive: domain.isActive,
      role: domain.role,
    };
  }
}
