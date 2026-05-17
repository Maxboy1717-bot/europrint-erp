/**
 * @module saas-tenant-acl
 * @description ACL translator: legacy `tenants` rows (from
 * `saas.service.ts:getTenants` via `SaasRepo.findAll`) ↔ canonical
 * `SaasTenantDto` consumed by new BC-10 (Platform / SaaS) code.
 *
 * Drizzle returns camelCase already, but the runtime row type still
 * leaks as a plain object with `unknown`-shaped extras. The translator
 * narrows the shape, coerces `employeeLimit` to a finite number, and
 * normalises `plan` / `status` strings.
 *
 * TODO PA2-14: drop once a typed `TenantRepository` ships outside the
 * legacy compatibility layer.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacySaasTenantRow {
  id: string | number;
  name?: unknown;
  domain?: unknown;
  plan?: unknown;
  status?: unknown;
  employeeLimit?: unknown;
  employee_limit?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
}

export type SaasTenantPlan = 'basic' | 'pro' | 'enterprise' | 'other';
export type SaasTenantStatus = 'active' | 'suspended' | 'trial' | 'inactive' | 'other';

export interface SaasTenantDto {
  id: string;
  name: string;
  domain: string | null;
  plan: SaasTenantPlan;
  status: SaasTenantStatus;
  employeeLimit: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toNum(v: unknown, fallback: number): number {
  if (v == null) return fallback;
  const n = typeof v === 'number' ? v : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
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

function toPlan(v: unknown): SaasTenantPlan {
  const s = toStr(v);
  if (s === 'basic' || s === 'pro' || s === 'enterprise') return s;
  return 'other';
}

function toStatus(v: unknown): SaasTenantStatus {
  const s = toStr(v);
  if (s === 'active' || s === 'suspended' || s === 'trial' || s === 'inactive') return s;
  return 'other';
}

export class SaasTenantAclTranslator
  implements IAclTranslator<LegacySaasTenantRow, SaasTenantDto>
{
  toDomain(legacy: LegacySaasTenantRow): Result<SaasTenantDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'SaasTenantAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'SaasTenantAcl: legacy.id missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'SaasTenantAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      name,
      domain: toStr(legacy.domain),
      plan: toPlan(legacy.plan),
      status: toStatus(legacy.status),
      employeeLimit: toNum(legacy.employeeLimit ?? legacy.employee_limit, 0),
      createdAt: toDate(legacy.createdAt ?? legacy.created_at),
      updatedAt: toDate(legacy.updatedAt ?? legacy.updated_at),
    });
  }

  toLegacy(domain: SaasTenantDto): LegacySaasTenantRow {
    return {
      id: domain.id,
      name: domain.name,
      domain: domain.domain,
      plan: domain.plan,
      status: domain.status,
      employeeLimit: domain.employeeLimit,
      createdAt: domain.createdAt ? domain.createdAt.toISOString() : null,
      updatedAt: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
