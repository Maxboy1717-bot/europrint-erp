/**
 * @module candidate-acl
 * @description ACL translator: legacy `candidates` JOIN `departments`/`positions`
 * rows (from `candidates-compat.service.ts:getCandidates`) ↔ canonical
 * `CandidateDto` consumed by new BC-3 (HR / People — Recruitment) code.
 *
 * The legacy SELECT mixes snake_case columns (`first_name`, `vacancy_id`)
 * with denormalised JOIN strings (`department_name`, `position_name`).
 * The translator narrows the shape into camelCase and coerces
 * `created_at` / `updated_at` to real `Date` values.
 *
 * TODO PA2-14: drop once `CandidatesCompatService` is replaced by a
 * Drizzle-backed `CandidateRepository` with typed rows.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyCandidateRow {
  id: string | number;
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
  vacancy_id?: unknown;
  status?: unknown;
  rating?: unknown;
  experience_years?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  full_name?: unknown;
  department_name?: unknown;
  position_name?: unknown;
}

export interface CandidateDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  vacancyId: string | null;
  status: string;
  rating: number | null;
  experienceYears: number | null;
  departmentName: string | null;
  positionName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
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

export class CandidateAclTranslator implements IAclTranslator<LegacyCandidateRow, CandidateDto> {
  toDomain(legacy: LegacyCandidateRow): Result<CandidateDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CandidateAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'CandidateAcl: legacy.id missing'));
    }
    const firstName = toStr(legacy.first_name);
    const lastName = toStr(legacy.last_name);
    const fullName = toStr(legacy.full_name) ?? [firstName, lastName].filter(Boolean).join(' ').trim();
    if (!fullName) {
      return Err(AppErr('VALIDATION', 'CandidateAcl: no name (first_name/last_name/full_name all missing)'));
    }
    return Ok({
      id: String(legacy.id),
      firstName,
      lastName,
      fullName,
      email: toStr(legacy.email),
      phone: toStr(legacy.phone),
      vacancyId: toStr(legacy.vacancy_id),
      status: toStr(legacy.status) ?? 'new',
      rating: toNumOrNull(legacy.rating),
      experienceYears: toNumOrNull(legacy.experience_years),
      departmentName: toStr(legacy.department_name),
      positionName: toStr(legacy.position_name),
      createdAt: toDate(legacy.created_at),
      updatedAt: toDate(legacy.updated_at),
    });
  }

  toLegacy(domain: CandidateDto): LegacyCandidateRow {
    return {
      id: domain.id,
      first_name: domain.firstName,
      last_name: domain.lastName,
      full_name: domain.fullName,
      email: domain.email,
      phone: domain.phone,
      vacancy_id: domain.vacancyId,
      status: domain.status,
      rating: domain.rating,
      experience_years: domain.experienceYears,
      department_name: domain.departmentName,
      position_name: domain.positionName,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
      updated_at: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
