/**
 * @module calendar-events.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { CalendarEventsRepo } from './repositories/calendar-events.repo';

@Injectable()
export class CalendarEventsService {
  constructor(private readonly repo: CalendarEventsRepo) {}

  async getAll(eventType?: string): Promise<Result<Record<string, unknown>[]>> {
    const result = await safeCall(() => this.repo.findAll());
    if (!result.ok) return result;
    return Ok(eventType ? (Array.isArray(result.data) ? result.data : []).filter((r) => r.eventType === eventType) : result.data);
  }

  async getUpcoming(): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(() => this.repo.findUpcoming());
  }

  async getById(id: string): Promise<Result<Record<string, unknown>>> {
    const result = await safeCall(() => this.repo.findById(id));
    if (!result.ok) return result;
    if (!result.data) return Err({ code: 'NOT_FOUND', message: `Calendar event ${id} not found` });
    return result;
  }

  async create(body: { title: string; description?: string; startDate: string; endDate?: string; allDay: boolean; eventType: string; location?: string; attendees: unknown[]; createdBy?: string }): Promise<Result<Record<string, unknown>>> {
    const result = await safeCall(() =>
      this.repo.insert({
        title:       body.title,
        description: body.description,
        startDate:   new Date(body.startDate),
        endDate:     body.endDate ? new Date(body.endDate) : undefined,
        allDay:      body.allDay,
        eventType:   body.eventType,
        location:    body.location,
        attendees:   body.attendees,
        createdBy:   body.createdBy,
      }),
    );
    if (!result.ok) return Err(result.error);
    return Ok(result.data[0]);
  }

  async update(id: string, body: Partial<{ title: string; description?: string; startDate: string; endDate?: string; allDay: boolean; eventType: string; location?: string; attendees: unknown[] }>): Promise<Result<Record<string, unknown>>> {
    const result = await safeCall(() =>
      this.repo.update(id, {
        title:       body.title,
        description: body.description,
        startDate:   body.startDate ? new Date(body.startDate) : undefined,
        endDate:     body.endDate ? new Date(body.endDate) : undefined,
        allDay:      body.allDay,
        eventType:   body.eventType,
        location:    body.location,
        attendees:   body.attendees,
        updatedAt:   _time.now(),
      }),
    );
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Calendar event ${id} not found` });
    return Ok(result.data[0]);
  }

  async delete(id: string): Promise<Result<Record<string, unknown>>> {
    const result = await safeCall(() => this.repo.delete(id));
    if (!result.ok) return Err(result.error);
    if (result.data.length === 0) return Err({ code: 'NOT_FOUND', message: `Calendar event ${id} not found` });
    return Ok({ deleted: true, id });
  }
}
