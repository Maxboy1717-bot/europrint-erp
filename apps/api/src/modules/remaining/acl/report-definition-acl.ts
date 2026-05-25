/**
 * @module report-definition-acl
 * @description ACL translator: legacy `ai_report_definitions` rows (from
 * `reports-hub.repository.ts:getDefinitions`) ↔ canonical
 * `ReportDefinitionDto` consumed by new BC-9 (Director / Reporting Hub)
 * code.
 *
 * The legacy SELECT is `SELECT * FROM ai_report_definitions`, so the
 * driver returns raw snake_case columns. The translator narrows the row
 * to camelCase, coerces `is_active` to boolean, and treats `sort_order`
 * as a finite number with a sensible fallback.
 *
 * TODO PA2-14: drop once a typed `ReportDefinitionRepository` ships with
 * Drizzle-mapped columns.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyReportDefinitionRow {
  id: string | number;
  category_id?: unknown;
  code?: unknown;
  name?: unknown;
  name_ru?: unknown;
  description?: unknown;
  schedule?: unknown;
  is_active?: unknown;
  query_template?: unknown;
  output_format?: unknown;
  sort_order?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface ReportDefinitionDto {
  id: string;
  categoryId: string | null;
  code: string | null;
  name: string;
  nameRu: string | null;
  description: string | null;
  schedule: string;
  isActive: boolean;
  queryTemplate: string | null;
  outputFormat: string;
  sortOrder: number;
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

function toNum(v: unknown, fallback = 99): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === 't' || v === '1';
  if (typeof v === 'number') return v !== 0;
  return false;
}

export class ReportDefinitionAclTranslator
  implements IAclTranslator<LegacyReportDefinitionRow, ReportDefinitionDto>
{
  toDomain(legacy: LegacyReportDefinitionRow): Result<ReportDefinitionDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'ReportDefinitionAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'ReportDefinitionAcl: legacy.id missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'ReportDefinitionAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      categoryId: toStr(legacy.category_id),
      code: toStr(legacy.code),
      name,
      nameRu: toStr(legacy.name_ru),
      description: toStr(legacy.description),
      schedule: toStr(legacy.schedule) ?? 'manual',
      isActive: toBool(legacy.is_active),
      queryTemplate: toStr(legacy.query_template),
      outputFormat: toStr(legacy.output_format) ?? 'table',
      sortOrder: toNum(legacy.sort_order, 99),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: ReportDefinitionDto): LegacyReportDefinitionRow {
    return {
      id: domain.id,
      category_id: domain.categoryId,
      code: domain.code,
      name: domain.name,
      name_ru: domain.nameRu,
      description: domain.description,
      schedule: domain.schedule,
      is_active: domain.isActive,
      query_template: domain.queryTemplate,
      output_format: domain.outputFormat,
      sort_order: domain.sortOrder,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
