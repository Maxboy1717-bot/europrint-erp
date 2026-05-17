/**
 * @module cron-job-acl
 * @description ACL translator: legacy synthetic cron-job entries (from
 * `system.service.ts:getCronJobs`) ↔ canonical `CronJobDto` consumed by
 * new BC-10 (Platform / Ops) code.
 *
 * The legacy list is hand-coded with `{ name, schedule, module, status }`.
 * The translator narrows the row to a strict shape, normalises `status`
 * to the known values, and ensures every field is a non-empty string.
 *
 * TODO PA2-14: drop once cron metadata is sourced from a real
 * `CronJobRepository` rather than a service-level literal.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyCronJobRow {
  name?: unknown;
  schedule?: unknown;
  module?: unknown;
  status?: unknown;
}

export type CronJobStatus = 'active' | 'inactive' | 'paused' | 'failed' | 'unknown';

export interface CronJobDto {
  name: string;
  schedule: string;
  module: string;
  status: CronJobStatus;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function toStatus(v: unknown): CronJobStatus {
  const s = toStr(v);
  if (s === 'active' || s === 'inactive' || s === 'paused' || s === 'failed') return s;
  return 'unknown';
}

export class CronJobAclTranslator
  implements IAclTranslator<LegacyCronJobRow, CronJobDto>
{
  toDomain(legacy: LegacyCronJobRow): Result<CronJobDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CronJobAcl: legacy row is null/non-object'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'CronJobAcl: name missing'));
    }
    return Ok({
      name,
      schedule: toStr(legacy.schedule) ?? '',
      module: toStr(legacy.module) ?? 'UNKNOWN',
      status: toStatus(legacy.status),
    });
  }

  toLegacy(domain: CronJobDto): LegacyCronJobRow {
    return {
      name: domain.name,
      schedule: domain.schedule,
      module: domain.module,
      status: domain.status,
    };
  }
}
