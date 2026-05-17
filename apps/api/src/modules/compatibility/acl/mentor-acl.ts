/**
 * @module mentor-acl
 * @description ACL translator: legacy `mentors` JOIN `users` rows (from
 * `mentorships-compat.service.ts:getMentorships`) ↔ canonical `MentorDto`
 * consumed by new BC-3 (HR / People — Learning & Mentorship) code.
 *
 * The legacy SELECT emits snake_case columns + a denormalised `mentor_username`
 * string. The translator narrows the dynamic types into camelCase and coerces
 * `created_at` to a real `Date`.
 *
 * TODO PA2-14: drop once `MentorshipsCompatService` is replaced by a
 * Drizzle-backed `MentorRepository` with typed rows.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyMentorRow {
  id: string | number;
  user_id?: unknown;
  bio?: unknown;
  expertise?: unknown;
  rating?: unknown;
  is_active?: unknown;
  name?: unknown;
  source?: unknown;
  experience?: unknown;
  created_at?: unknown;
  mentor_username?: unknown;
}

export interface MentorDto {
  id: string;
  userId: string | null;
  name: string;
  bio: string | null;
  expertise: string | null;
  rating: number | null;
  experience: string | null;
  isActive: boolean;
  source: string | null;
  mentorUsername: string | null;
  createdAt: Date | null;
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

export class MentorAclTranslator implements IAclTranslator<LegacyMentorRow, MentorDto> {
  toDomain(legacy: LegacyMentorRow): Result<MentorDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'MentorAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'MentorAcl: legacy.id missing'));
    }
    const name = toStr(legacy.name);
    if (!name) {
      return Err(AppErr('VALIDATION', 'MentorAcl: name missing'));
    }
    return Ok({
      id: String(legacy.id),
      userId: toStr(legacy.user_id),
      name,
      bio: toStr(legacy.bio),
      expertise: toStr(legacy.expertise),
      rating: toNumOrNull(legacy.rating),
      experience: toStr(legacy.experience),
      isActive: Boolean(legacy.is_active),
      source: toStr(legacy.source),
      mentorUsername: toStr(legacy.mentor_username),
      createdAt: toDate(legacy.created_at),
    });
  }

  toLegacy(domain: MentorDto): LegacyMentorRow {
    return {
      id: domain.id,
      user_id: domain.userId,
      name: domain.name,
      bio: domain.bio,
      expertise: domain.expertise,
      rating: domain.rating,
      experience: domain.experience,
      is_active: domain.isActive,
      source: domain.source,
      mentor_username: domain.mentorUsername,
      created_at: domain.createdAt ? domain.createdAt.toISOString() : null,
    };
  }
}
