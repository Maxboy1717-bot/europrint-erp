/**
 * @module calendar-events.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { calendarEvents } from '@shared/db/europrint-compat';
import { eq, gte, desc } from 'drizzle-orm';
import { Ok, Err, safeCall, AppErr } from '@common/result';

type EventInsert = {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  eventType: string;
  location?: string;
  attendees: unknown[];
  createdBy?: string;
};

type EventUpdate = Partial<Omit<EventInsert, 'startDate' | 'endDate'>> & {
  startDate?: Date;
  endDate?: Date;
  updatedAt: Date;
};

@Injectable()
export class CalendarEventsRepo {
  findAll() {
    return safeCall(() => db.select().from(calendarEvents).orderBy(desc(calendarEvents.startDate)), 'DB_ERROR');
  }

  findUpcoming() {
    return safeCall(() => db.select().from(calendarEvents)
      .where(gte(calendarEvents.startDate, _time.now()))
      .orderBy(calendarEvents.startDate), 'DB_ERROR');
  }

  async findById(id: string) {
    const r = await safeCall(() => db.select().from(calendarEvents).where(eq(calendarEvents.id, id)), 'DB_ERROR');
    if (!r.ok) return Err(r.error);
    const row = r.data[0];
    if (!row) return Err(AppErr('NOT_FOUND', `Calendar event ${id} not found`));
    return Ok(row);
  }

  insert(data: EventInsert) {
    return safeCall(() => db.insert(calendarEvents).values({
      title:       data.title,
      description: data.description ?? null,
      startDate:   data.startDate,
      endDate:     data.endDate ?? null,
      allDay:      data.allDay,
      eventType:   data.eventType,
      location:    data.location ?? null,
      attendees:   data.attendees,
      createdBy:   data.createdBy ?? null,
    }).returning(), 'DB_ERROR');
  }

  update(id: string, data: EventUpdate) {
    return safeCall(() => db.update(calendarEvents).set({
      title:       data.title,
      description: data.description,
      startDate:   data.startDate,
      endDate:     data.endDate,
      allDay:      data.allDay,
      eventType:   data.eventType,
      location:    data.location,
      attendees:   data.attendees,
      updatedAt:   data.updatedAt,
    }).where(eq(calendarEvents.id, id)).returning(), 'DB_ERROR');
  }

  delete(id: string) {
    return safeCall(() => db.delete(calendarEvents).where(eq(calendarEvents.id, id)).returning(), 'DB_ERROR');
  }
}
