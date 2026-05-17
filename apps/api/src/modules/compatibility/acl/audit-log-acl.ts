/**
 * @module audit-log-acl
 * @description ACL translator: legacy `audit_logs` rows joined with `users`
 * (from `europrint-control.service.ts:getAuditLogs`) ↔ canonical
 * `AuditLogDto` consumed by new BC-9 (Director / Compliance) code.
 *
 * The legacy SELECT mixes snake_case columns and `created_at` as a raw
 * timestamp string. The translator narrows the row to camelCase, coerces
 * `createdAt` to typed `Date`, and normalises `action`/`entity_type`.
 *
 * TODO PA2-14: drop once a typed `AuditLogRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyAuditLogRow {
  id: string | number;
  action?: unknown;
  entity_type?: unknown;
  entity_id?: unknown;
  user_id?: unknown;
  username?: unknown;
  created_at?: unknown;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  username: string | null;
  createdAt: Date | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export class AuditLogAclTranslator
  implements IAclTranslator<LegacyAuditLogRow, AuditLogDto>
{
  toDomain(legacy: LegacyAuditLogRow): Result<AuditLogDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'AuditLogAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'AuditLogAcl: legacy.id missing'));
    }
    return Ok({
      id: String(legacy.id),
      action: toStr(legacy.action) ?? 'UNKNOWN',
      entityType: toStr(legacy.entity_type),
      entityId: toStr(legacy.entity_id),
      userId: toStr(legacy.user_id),
      username: toStr(legacy.username),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: AuditLogDto): LegacyAuditLogRow {
    return {
      id: domain.id,
      action: domain.action,
      entity_type: domain.entityType,
      entity_id: domain.entityId,
      user_id: domain.userId,
      username: domain.username,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
