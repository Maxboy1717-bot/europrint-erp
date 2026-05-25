/**
 * @module order-acl
 * @description ACL translator: legacy `order_status_logs` JOIN `users` rows
 * (from `remaining/order-status.repository.ts:getStatusLog`) ↔ canonical
 * `OrderStatusLogDto` consumed by new BC-1 (Sales) / BC-2 (Manufacturing) code.
 *
 * Why: the legacy SELECT emits snake_case columns + a denormalised
 * `changed_by_name` string. New consumers want camelCase + a typed Date and
 * an unambiguous to/from status pair.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 * @see docs/ddd-deep-audit-strategic.md Step 4 — ACL gap finding
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyOrderStatusLogRow {
  id: number | string;
  order_id: string | number;
  from_status: string | null;
  to_status: string | null;
  changed_by: number | string | null;
  changed_by_name?: string | null;
  notes: string | null;
  created_at: string | Date | null;
}

export interface OrderStatusLogDto {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedById: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: Date;
}

function toDate(v: string | Date | null | undefined): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export class OrderStatusLogAclTranslator
  implements IAclTranslator<LegacyOrderStatusLogRow, OrderStatusLogDto>
{
  toDomain(legacy: LegacyOrderStatusLogRow): Result<OrderStatusLogDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'OrderAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'OrderAcl: legacy.id missing'));
    }
    if (legacy.order_id == null) {
      return Err(AppErr('VALIDATION', 'OrderAcl: legacy.order_id missing'));
    }
    if (!legacy.to_status) {
      return Err(AppErr('VALIDATION', 'OrderAcl: to_status missing (cannot reconstruct transition)'));
    }
    const createdAt = toDate(legacy.created_at);
    if (!createdAt) {
      return Err(AppErr('VALIDATION', 'OrderAcl: created_at is not a valid date'));
    }
    const dto: OrderStatusLogDto = {
      id: String(legacy.id),
      orderId: String(legacy.order_id),
      fromStatus: legacy.from_status ?? null,
      toStatus: legacy.to_status,
      changedById: legacy.changed_by != null ? String(legacy.changed_by) : null,
      changedByName: legacy.changed_by_name ?? null,
      notes: legacy.notes ?? null,
      createdAt,
    };
    return Ok(dto);
  }

  toLegacy(domain: OrderStatusLogDto): LegacyOrderStatusLogRow {
    return {
      id: domain.id,
      order_id: domain.orderId,
      from_status: domain.fromStatus,
      to_status: domain.toStatus,
      changed_by: domain.changedById,
      changed_by_name: domain.changedByName,
      notes: domain.notes,
      created_at: domain.createdAt.toISOString(),
    };
  }
}

/**
 * Generic fallback translator: snake_case → camelCase rename + Date string →
 * Date coercion for any "*_at" / "*_date" column. Use as a starter when no
 * concrete legacy concern justifies a bespoke class yet. Subclass when you
 * need invariants.
 */
export class GenericLegacyRowAclTranslator<TRow extends Record<string, unknown>>
  implements IAclTranslator<TRow, Record<string, unknown>>
{
  toDomain(legacy: TRow): Result<Record<string, unknown>> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'GenericLegacyAcl: row is null/non-object'));
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(legacy)) {
      const camel = k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
      if (/_at$|_date$/i.test(k) && typeof v === 'string') {
        const d = new Date(v);
        out[camel] = Number.isNaN(d.getTime()) ? v : d;
      } else {
        out[camel] = v;
      }
    }
    return Ok(out);
  }

  toLegacy(domain: Record<string, unknown>): TRow {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(domain)) {
      const snake = k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
      out[snake] = v instanceof Date ? v.toISOString() : v;
    }
    return out as TRow;
  }
}
