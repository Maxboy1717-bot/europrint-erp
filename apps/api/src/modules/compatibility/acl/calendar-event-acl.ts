/**
 * @module calendar-event-acl
 * @description ACL translator: legacy `calendar_events` rows ↔ canonical
 * `CalendarEventDto`. Legacy repo already emits mostly camelCase via Drizzle,
 * but the values are `unknown`-typed (`Record<string, unknown>`) and dates
 * come back as ISO strings. This translator validates the shape and coerces
 * `startDate` / `endDate` / `createdAt` into real `Date` objects.
 *
 * TODO PA2-14: drop once `calendar-events.service.ts` returns a typed row
 * shape directly from a strongly-typed repo.
 *
 * @see docs/context-map.md — "Legacy / Migration" bounded-context entry
 */

import { Ok, Err, AppErr, type Result } from '@common/result';
import type { IAclTranslator } from '@shared/domain/acl/i-acl-translator';

export interface LegacyCalendarEventRow {
  id: string | number;
  title?: unknown;
  description?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  allDay?: unknown;
  eventType?: unknown;
  location?: unknown;
  attendees?: unknown;
  createdBy?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CalendarEventDto {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
  eventType: string;
  location: string | null;
  attendees: unknown[];
  createdById: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toDate(v: unknown): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

export class CalendarEventAclTranslator
  implements IAclTranslator<LegacyCalendarEventRow, CalendarEventDto>
{
  toDomain(legacy: LegacyCalendarEventRow): Result<CalendarEventDto> {
    if (legacy == null || typeof legacy !== 'object') {
      return Err(AppErr('VALIDATION', 'CalendarEventAcl: legacy row is null/non-object'));
    }
    if (legacy.id == null) {
      return Err(AppErr('VALIDATION', 'CalendarEventAcl: legacy.id missing'));
    }
    const title = toStr(legacy.title);
    if (!title) {
      return Err(AppErr('VALIDATION', 'CalendarEventAcl: title missing'));
    }
    const startDate = toDate(legacy.startDate);
    if (!startDate) {
      return Err(AppErr('VALIDATION', 'CalendarEventAcl: startDate invalid'));
    }
    const attendees = Array.isArray(legacy.attendees) ? legacy.attendees : [];
    return Ok({
      id: String(legacy.id),
      title,
      description: toStr(legacy.description),
      startDate,
      endDate: toDate(legacy.endDate) ?? null,
      allDay: Boolean(legacy.allDay),
      eventType: toStr(legacy.eventType) ?? 'general',
      location: toStr(legacy.location),
      attendees,
      createdById: toStr(legacy.createdBy),
      createdAt: toDate(legacy.createdAt) ?? null,
      updatedAt: toDate(legacy.updatedAt) ?? null,
    });
  }

  toLegacy(domain: CalendarEventDto): LegacyCalendarEventRow {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      startDate: domain.startDate.toISOString(),
      endDate: domain.endDate ? domain.endDate.toISOString() : null,
      allDay: domain.allDay,
      eventType: domain.eventType,
      location: domain.location,
      attendees: domain.attendees,
      createdBy: domain.createdById,
      createdAt: domain.createdAt ? domain.createdAt.toISOString() : null,
      updatedAt: domain.updatedAt ? domain.updatedAt.toISOString() : null,
    };
  }
}
