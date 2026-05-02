import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { calendarEvents } from '@shared/db/europrint-compat';
import { eq, gte, desc } from 'drizzle-orm';

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
  async findAll() {
    return db.select().from(calendarEvents).orderBy(desc(calendarEvents.startDate));
  }

  async findUpcoming() {
    return db.select().from(calendarEvents)
      .where(gte(calendarEvents.startDate, _time.now()))
      .orderBy(calendarEvents.startDate);
  }

  async findById(id: string) {
    const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return rows[0] ?? null;
  }

  async insert(data: EventInsert) {
    return db.insert(calendarEvents).values({
      title:       data.title,
      description: data.description ?? null,
      startDate:   data.startDate,
      endDate:     data.endDate ?? null,
      allDay:      data.allDay,
      eventType:   data.eventType,
      location:    data.location ?? null,
      attendees:   data.attendees,
      createdBy:   data.createdBy ?? null,
    }).returning();
  }

  async update(id: string, data: EventUpdate) {
    return db.update(calendarEvents).set({
      title:       data.title,
      description: data.description,
      startDate:   data.startDate,
      endDate:     data.endDate,
      allDay:      data.allDay,
      eventType:   data.eventType,
      location:    data.location,
      attendees:   data.attendees,
      updatedAt:   data.updatedAt,
    }).where(eq(calendarEvents.id, id)).returning();
  }

  async delete(id: string) {
    return db.delete(calendarEvents).where(eq(calendarEvents.id, id)).returning();
  }
}
