/**
 * @module guideline-acl
 * @description ACL translator: legacy `guidelines` rows ↔ canonical
 * `GuidelineDto` for new BC-6 (Platform / Admin) consumers.
 *
 * The legacy Drizzle row is already camelCase but exposes timestamps as
 * `Date | null` mixed with serialised strings depending on the driver path.
 * This translator standardises to `Date | null` and tightens the boolean
 * `isActive` field.
 *
 * TODO PA2-14: retire once `SettingsAdminRepo.findAllGuidelines()` returns
 * a typed domain row directly.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyGuidelineRow {
  id: string | number;
  title?: unknown;
  content?: unknown;
  category?: unknown;
  isActive?: unknown;
  createdBy?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GuidelineDto {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

export class GuidelineAclTranslator
  implements IAclTranslator<LegacyGuidelineRow, GuidelineDto>
{
  toDomain(legacy: LegacyGuidelineRow): Result<GuidelineDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'GuidelineAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'GuidelineAcl: legacy.id missing'));
    }
    const title = toStr(legacy.title);
    const content = toStr(legacy.content);
    if (!title)   return Err(AppErr('VALIDATION', 'GuidelineAcl: title missing'));
    if (!content) return Err(AppErr('VALIDATION', 'GuidelineAcl: content missing'));
    return Ok({
      id: String(legacy.id),
      title,
      content,
      category: toStr(legacy.category) ?? 'general',
      isActive: legacy.isActive == null ? true : Boolean(legacy.isActive),
      createdById: toStr(legacy.createdBy),
      createdAt: toDate(legacy.createdAt),
      updatedAt: toDate(legacy.updatedAt),
    });
  }

  toLegacy(domain: GuidelineDto): LegacyGuidelineRow {
    return {
      id: domain.id,
      title: domain.title,
      content: domain.content,
      category: domain.category,
      isActive: domain.isActive,
      createdBy: domain.createdById,
      createdAt: domain.createdAt ? domain.createdAt.toISOString() : null,
      updatedAt: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
