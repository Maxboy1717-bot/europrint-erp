/**
 * @module exception-log-acl
 * @description ACL translator: legacy `exception_logs` rows (from
 * `exception-log.repository.ts:getAll`) ↔ canonical `ExceptionLogDto`
 * consumed by new BC-2 (Manufacturing) / BC-6 (Procurement) / BC-7 (Finance)
 * exception consoles.
 *
 * The legacy SELECT emits raw snake_case columns; the translator narrows
 * the shape into camelCase, validates the required keys (`module`,
 * `exception_type`), and coerces timestamps into typed `Date` values.
 *
 * TODO PA2-14: drop once a typed `ExceptionLogRepository` ships.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyExceptionLogRow {
  id: string | number;
  module?: unknown;
  exception_type?: unknown;
  status?: unknown;
  reason?: unknown;
  notes?: unknown;
  related_record_id?: unknown;
  document_number?: unknown;
  created_by?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface ExceptionLogDto {
  id: string;
  module: string;
  exceptionType: string;
  status: string;
  reason: string | null;
  notes: string | null;
  relatedRecordId: string | null;
  documentNumber: string | null;
  createdById: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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

export class ExceptionLogAclTranslator
  implements IAclTranslator<LegacyExceptionLogRow, ExceptionLogDto>
{
  toDomain(legacy: LegacyExceptionLogRow): Result<ExceptionLogDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'ExceptionLogAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'ExceptionLogAcl: legacy.id missing'));
    }
    const moduleName = toStr(legacy.module);
    if (!moduleName) {
      return Err(AppErr('VALIDATION', 'ExceptionLogAcl: module missing'));
    }
    const exceptionType = toStr(legacy.exception_type);
    if (!exceptionType) {
      return Err(AppErr('VALIDATION', 'ExceptionLogAcl: exception_type missing'));
    }
    return Ok({
      id: String(legacy.id),
      module: moduleName,
      exceptionType,
      status: toStr(legacy.status) ?? 'open',
      reason: toStr(legacy.reason),
      notes: toStr(legacy.notes),
      relatedRecordId: toStr(legacy.related_record_id),
      documentNumber: toStr(legacy.document_number),
      createdById: toStr(legacy.created_by),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: ExceptionLogDto): LegacyExceptionLogRow {
    return {
      id: domain.id,
      module: domain.module,
      exception_type: domain.exceptionType,
      status: domain.status,
      reason: domain.reason,
      notes: domain.notes,
      related_record_id: domain.relatedRecordId,
      document_number: domain.documentNumber,
      created_by: domain.createdById,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
