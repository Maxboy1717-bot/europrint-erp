/**
 * @module drizzle-downtime.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db, downtime_events as downtimeEvents } from '@shared/db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/result';
import { DowntimeEvent, DOWNTIME_REASON_CODES } from '../../domain/aggregates/downtime-event.aggregate';

import { MS_PER_MINUTE } from '@common/constants/app.constants';

export interface DowntimeFilters {
  sessionId?: string;
  workCenterId?: string;
  eventType?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface DowntimeSummary {
  totalDowntimeHours: number;
  totalDowntimeMinutes: number;
  totalEvents: number;
  topReasons: Array<{ code: string; name: string; count: number }>;
  mostAffectedWorkCenter: { id: string; name: string; downtimeMinutes: number } | null;
}

@Injectable()
export class DrizzleDowntimeRepository {
  private readonly logger = new Logger(DrizzleDowntimeRepository.name);

  async findById(id: string): Promise<Result<DowntimeEvent>> {
    try {
      const [row] = await db.select().from(downtimeEvents).where(eq(downtimeEvents.id, Number(id))).limit(1);

      if (!row) {
        return Err('Downtime event topilmadi');
      }

      const event = this.toDomain(row as Record<string, unknown>);
      return Ok(event);
    } catch (error: unknown) {
      this.logger.error(`Failed to find downtime event ${id}: ${(error as Error).message}`);
      return Err('Downtime event oqishda xatolik');
    }
  }

  async findAll(filters?: DowntimeFilters): Promise<Result<{ items: DowntimeEvent[]; total: number }>> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (filters?.sessionId) {
        conditions.push(eq(downtimeEvents.sessionId, filters.sessionId));
      }

      if (filters?.workCenterId) {
        conditions.push(eq(downtimeEvents.workCenterId, filters.workCenterId));
      }

      if (filters?.eventType) {
        conditions.push(eq(downtimeEvents.eventType, filters.eventType));
      }

      if (filters?.from) {
        conditions.push(gte(downtimeEvents.startedAt, filters.from));
      }

      if (filters?.to) {
        conditions.push(lte(downtimeEvents.startedAt, filters.to));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(downtimeEvents)
        .where(where);

      const rows = await db.select().from(downtimeEvents).where(where).orderBy(desc(downtimeEvents.startedAt)).limit(limit).offset(offset);

      const items = rows.map((row) => this.toDomain(row as Record<string, unknown>));

      return {
        ok: true,
        data: {
          items,
          total: parseInt(String(total[0]?.count || '0'), 10),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to find downtime events: ${(error as Error).message}`);
      return Err('Downtime events oqishda xatolik');
    }
  }

  async save(event: DowntimeEvent): Promise<Result<DowntimeEvent>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await db.insert(downtimeEvents).values({
        sessionId: event.sessionId,
        workCenterId: event.workCenterId,
        eventType: event.eventType,
        reasonCode: event.reasonCode,
        startedAt: event.startedAt,
        endedAt: event.endedAt,
        durationMinutes: event.durationMinutes,
        reportedBy: event.reportedBy,
        notes: event.notes,
        createdAt: event.createdAt,
      } as any);

      return Ok(event);
    } catch (error: unknown) {
      this.logger.error(`Failed to save downtime event: ${(error as Error).message}`);
      return Err('Downtime event saqlashda xatolik');
    }
  }

  async endDowntime(id: string, endedAt: Date): Promise<Result<DowntimeEvent>> {
    try {
      const [row] = await db.select().from(downtimeEvents).where(eq(downtimeEvents.id, Number(id))).limit(1);

      if (!row) {
        return Err('Downtime event topilmadi');
      }

      const rowData = row as Record<string, unknown>;
      const durationMinutes = Math.round(
        (endedAt.getTime() - (rowData.startedAt as Date).getTime()) / MS_PER_MINUTE,
      );

      await db
        .update(downtimeEvents)
        .set({
          endedAt,
          durationMinutes,
        })
        .where(eq(downtimeEvents.id, Number(id)));

      const updated = new DowntimeEvent(
        String(rowData.id ?? ''),
        String(rowData.sessionId ?? ''),
        rowData.workCenterId != null ? String(rowData.workCenterId) : null,
        String(rowData.eventType ?? ''),
        String(rowData.reasonCode ?? ''),
        rowData.startedAt as Date,
        endedAt,
        durationMinutes,
        String(rowData.reportedBy ?? ''),
        rowData.notes != null ? String(rowData.notes) : null,
        rowData.createdAt as Date,
      );

      return Ok(updated);
    } catch (error: unknown) {
      this.logger.error(`Failed to end downtime event: ${(error as Error).message}`);
      return Err('Downtime event yakunlashda xatolik');
    }
  }

  async getDowntimeSummary(from: Date, to: Date): Promise<Result<DowntimeSummary>> {
    try {
      const rows = await db.select().from(downtimeEvents).where(and(
        gte(downtimeEvents.startedAt, from),
        lte(downtimeEvents.startedAt, to),
      ));

      let totalMinutes = 0;
      const reasonCounts: Record<string, number> = {};
      const workCenterDowntime: Record<string, number> = {};

      for (const _row of rows) {
        const row = _row as Record<string, unknown>;
        if (row.durationMinutes) {
          totalMinutes += Number(row.durationMinutes);
        }

        reasonCounts[String(row.reasonCode)] = (reasonCounts[String(row.reasonCode)] || 0) + 1;

        if (row.workCenterId) {
          const wcId = String(row.workCenterId);
          workCenterDowntime[wcId] =
            (workCenterDowntime[wcId] || 0) + Number(row.durationMinutes || 0);
        }
      }

      const topReasons = Object.entries(reasonCounts)
        .map(([code, count]) => {
          const reasonInfo = DOWNTIME_REASON_CODES.find((r) => r.code === code);
          return {
            code,
            name: reasonInfo?.name || code,
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const mostAffectedWorkCenter =
        Object.entries(workCenterDowntime).length > 0
          ? {
              id: Object.entries(workCenterDowntime).sort((a, b) => b[1] - a[1])[0][0],
              name: 'Work Center',
              downtimeMinutes: Object.entries(workCenterDowntime).sort(
                (a, b) => b[1] - a[1],
              )[0][1],
            }
          : null;

      const summary: DowntimeSummary = {
        totalDowntimeHours: Math.round((totalMinutes / 60) * 100) / 100,
        totalDowntimeMinutes: totalMinutes,
        totalEvents: rows.length,
        topReasons,
        mostAffectedWorkCenter,
      };

      return Ok(summary);
    } catch (error: unknown) {
      this.logger.error(`Failed to get downtime summary: ${(error as Error).message}`);
      return Err('Downtime summary olishda xatolik');
    }
  }

  private toDomain(row: Record<string, unknown>): DowntimeEvent {
    return new DowntimeEvent(
      String(row.id ?? ''),
      String(row.sessionId ?? ''),
      row.workCenterId != null ? String(row.workCenterId) : null,
      String(row.eventType ?? ''),
      String(row.reasonCode ?? ''),
      row.startedAt as Date,
      row.endedAt != null ? row.endedAt as Date : null,
      row.durationMinutes != null ? Number(row.durationMinutes) : null,
      String(row.reportedBy ?? ''),
      row.notes != null ? String(row.notes) : null,
      row.createdAt as Date,
    );
  }
}
