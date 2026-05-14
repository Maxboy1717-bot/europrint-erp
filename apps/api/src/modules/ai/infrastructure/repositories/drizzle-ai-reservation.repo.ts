/**
 * @module drizzle-ai-reservation.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Ok, Result } from '@common/result';
import { aiReservationRequests, aiReservationBatches } from '@europrint/schemas';

export interface ReservationRequest {
  id:           string;
  materialType: string;
  quantity:     number;
  unit:         string;
  neededBy:     string | null;
  priority:     string;
  status:       string;
  notes:        string | null;
  createdAt:    string;
  optimization: Record<string, unknown> | null;
}

export interface ReservationBatch {
  id:           string;
  materialType: string;
  items:        unknown[];
  scheduledAt:  string | null;
  status:       string;
  createdAt:    string;
}

@Injectable()
export class DrizzleAiReservationRepo {
  constructor(private readonly drizzle: DrizzleService) {}

  private toRequest(r: typeof aiReservationRequests.$inferSelect): ReservationRequest {
    return {
      id:           r.id,
      materialType: r.materialType,
      quantity:     r.quantity,
      unit:         r.unit,
      neededBy:     r.neededBy ?? null,
      priority:     r.priority,
      status:       r.status,
      notes:        r.notes ?? null,
      createdAt:    r.createdAt?.toISOString() ?? _time.now().toISOString(),
      optimization: (r.optimization as Record<string, unknown>) ?? null,
    };
  }

  private toBatch(r: typeof aiReservationBatches.$inferSelect): ReservationBatch {
    return {
      id:           r.id,
      materialType: r.materialType,
      items:        (r.items as Record<string, unknown>[]) ?? [],
      scheduledAt:  r.scheduledAt?.toISOString() ?? null,
      status:       r.status,
      createdAt:    r.createdAt?.toISOString() ?? _time.now().toISOString(),
    };
  }

  async findAllRequests(): Promise<Result<ReservationRequest[]>> {
    const result = await safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiReservationRequests)
        .orderBy(desc(aiReservationRequests.createdAt))
        .limit(50);
      return (Array.isArray(rows) ? rows : []).map((r) => this.toRequest(r));
    });
    if (!result.ok) return Ok([]);
    return result;
  }

  async findRequestById(id: string): Promise<Result<ReservationRequest | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiReservationRequests)
        .where(eq(aiReservationRequests.id, id))
        .limit(1);
      return row ? this.toRequest(row) : null;
    });
  }

  async createRequest(
    materialType: string, quantity: number, unit: string,
    neededBy: string | null, priority: string, notes: string | null,
  ): Promise<Result<ReservationRequest>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiReservationRequests)
        .values({ materialType, quantity, unit, neededBy, priority, notes, status: 'pending' })
        .returning();
      if (!row) throw new Error('Rezervatsiya so\'rovi yaratishda xato: natija qaytmadi');
      return this.toRequest(row);
    });
  }

  async updateRequestStatus(id: string, status: string): Promise<Result<ReservationRequest>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .update(aiReservationRequests)
        .set({ status })
        .where(eq(aiReservationRequests.id, id))
        .returning();
      if (!row) throw new NotFoundException(`Rezervatsiya topilmadi: ${id}`);
      return this.toRequest(row);
    });
  }

  async findAllBatches(): Promise<Result<ReservationBatch[]>> {
    const result = await safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiReservationBatches)
        .orderBy(desc(aiReservationBatches.createdAt))
        .limit(50);
      return (Array.isArray(rows) ? rows : []).map((r) => this.toBatch(r));
    });
    if (!result.ok) return Ok([]);
    return result;
  }

  async createBatch(materialType: string, items: unknown[], scheduledAt: string | null): Promise<Result<ReservationBatch>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiReservationBatches)
        .values({ materialType, items, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, status: 'scheduled' })
        .returning();
      if (!row) throw new Error('Rezervatsiya partiyasi yaratishda xato: natija qaytmadi');
      return this.toBatch(row);
    });
  }
}
