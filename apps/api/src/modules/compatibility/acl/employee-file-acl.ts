/**
 * @module employee-file-acl
 * @description ACL translator: legacy `employee_files` rows (joined with
 * `employees` for `employee_name`) ↔ canonical `EmployeeFileDto` consumed by
 * new BC-3 (HR / People) code.
 *
 * Legacy SELECT lives in `employee-files-compat.service.ts:listFiles/getFile`.
 * The legacy projection mixes snake_case columns (ef.*) with a
 * concat-string `employee_name` from the JOIN. New consumers want
 * camelCase + a typed Date.
 *
 * TODO PA2-14: remove once `compatibility/employee-files-*` is migrated
 * to a proper Drizzle repo with native camelCase columns.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 * @see docs/ddd-deep-audit-strategic.md Step 4 — ACL gap finding
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyEmployeeFileRow {
  id: number | string;
  employee_id: number | string | null;
  file_name: string | null;
  file_type: string | null;
  file_url: string | null;
  file_size: number | string | null;
  uploaded_by: number | string | null;
  created_at: string | Date | null;
  employee_name?: string | null;
}

export interface EmployeeFileDto {
  id: string;
  employeeId: string | null;
  fileName: string;
  fileType: string;
  fileUrl: string | null;
  fileSize: number | null;
  uploadedById: string | null;
  employeeName: string | null;
  createdAt: Date;
}

function toDate(v: string | Date | null | undefined): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toStrOrNull(v: string | number | null | undefined): string | null {
  return v == null ? null : String(v);
}

function toNumOrNull(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export class EmployeeFileAclTranslator
  implements IAclTranslator<LegacyEmployeeFileRow, EmployeeFileDto>
{
  toDomain(legacy: LegacyEmployeeFileRow): Result<EmployeeFileDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'EmployeeFileAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'EmployeeFileAcl: legacy.id missing'));
    }
    if (legacy.file_name == null || legacy.file_name === '') {
      return Err(AppErr('VALIDATION', 'EmployeeFileAcl: file_name missing'));
    }
    const createdAt = toDate(legacy.created_at);
    if (!createdAt) {
      return Err(AppErr('VALIDATION', 'EmployeeFileAcl: created_at is not a valid date'));
    }
    return Ok({
      id: String(legacy.id),
      employeeId: toStrOrNull(legacy.employee_id),
      fileName: legacy.file_name,
      fileType: legacy.file_type ?? 'document',
      fileUrl: legacy.file_url ?? null,
      fileSize: toNumOrNull(legacy.file_size),
      uploadedById: toStrOrNull(legacy.uploaded_by),
      employeeName: legacy.employee_name ?? null,
      createdAt,
    });
  }

  toLegacy(domain: EmployeeFileDto): LegacyEmployeeFileRow {
    return {
      id: domain.id,
      employee_id: domain.employeeId,
      file_name: domain.fileName,
      file_type: domain.fileType,
      file_url: domain.fileUrl,
      file_size: domain.fileSize,
      uploaded_by: domain.uploadedById,
      created_at: domain.createdAt.toISOString(),
      employee_name: domain.employeeName,
    };
  }
}
