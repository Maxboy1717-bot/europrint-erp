/**
 * @module drizzle-ai-reservation.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { eq, desc, sql } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { safeCall, Ok, Err, Result } from '@common/result';
import { aiReservationRequests, aiReservationBatches } from '@europrint/schemas';

/** 2.8 — AI-reservation → warehouse_stock wiring: resolves a free-text
 * `materialType` (e.g. "Karton 250g/m²") to the canonical material_cards
 * row + its default warehouse, so the reservation can hit the SAME
 * warehouse_stock row the rest of WMS uses. Best-effort exact/partial
 * name match (material_cards has no FK from ai_reservation_requests —
 * the table predates a material_id column; Rule 4 raw-SQL exemption,
 * same join pattern as get-inventory-levels.tool.ts). */
export interface ResolvedMaterial {
  materialId: number;
  warehouseId: number;
}

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
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly i18n: I18nService,
  ) {}

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

  /**
   * 2.8 — resolves `materialType` free text to a material_cards.id + its
   * warehouse_id (exact name match first, then case-insensitive partial
   * match), so callers can reserve against the canonical warehouse_stock
   * row. Returns Ok(null) when no material_cards row matches (caller then
   * skips the stock-reserve step instead of failing the whole request —
   * the AI-reservation request itself is still a valid planning record).
   */
  async resolveMaterial(materialType: string): Promise<Result<ResolvedMaterial | null>> {
    return safeCall(async () => {
      const exec = this.drizzle.db as unknown as { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> };
      const r = await exec.execute(sql`
        SELECT id, warehouse_id
        FROM material_cards
        WHERE deleted_at IS NULL
          AND (LOWER(xom_ashyo) = LOWER(${materialType}) OR LOWER(kod) = LOWER(${materialType}))
        ORDER BY (LOWER(xom_ashyo) = LOWER(${materialType})) DESC
        LIMIT 1
      `);
      const rows = (Array.isArray(r.rows) ? r.rows : []) as Array<{ id: number; warehouse_id: number | null }>;
      let row = rows[0];
      if (!row) {
        const r2 = await exec.execute(sql`
          SELECT id, warehouse_id
          FROM material_cards
          WHERE deleted_at IS NULL AND LOWER(xom_ashyo) LIKE LOWER('%' || ${materialType} || '%')
          ORDER BY id ASC LIMIT 1
        `);
        const rows2 = (Array.isArray(r2.rows) ? r2.rows : []) as Array<{ id: number; warehouse_id: number | null }>;
        row = rows2[0];
      }
      if (!row || row.warehouse_id == null) return null;
      return { materialId: Number(row.id), warehouseId: Number(row.warehouse_id) };
    });
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
    const insertR = await safeCall(async () =>
      this.drizzle.db
        .insert(aiReservationRequests)
        .values({ materialType, quantity, unit, neededBy, priority, notes, status: 'pending' })
        .returning(), 'DB_ERROR');
    if (!insertR.ok) return Err(insertR.error);
    const row = Array.isArray(insertR.data) ? insertR.data[0] : undefined;
    if (!row) return Err({ code: 'DB_ERROR', message: 'Rezervatsiya so\'rovi yaratishda xato: natija qaytmadi' });
    return Ok(this.toRequest(row));
  }

  async updateRequestStatus(id: string, status: string): Promise<Result<ReservationRequest>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .update(aiReservationRequests)
        .set({ status })
        .where(eq(aiReservationRequests.id, id))
        .returning();
      if (!row) throw new NotFoundException(await this.i18n.t('errors.reservationNotFound', { args: { id } }));
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
    const insertR = await safeCall(async () =>
      this.drizzle.db
        .insert(aiReservationBatches)
        .values({ materialType, items, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, status: 'scheduled' })
        .returning(), 'DB_ERROR');
    if (!insertR.ok) return Err(insertR.error);
    const row = Array.isArray(insertR.data) ? insertR.data[0] : undefined;
    if (!row) return Err({ code: 'DB_ERROR', message: 'Rezervatsiya partiyasi yaratishda xato: natija qaytmadi' });
    return Ok(this.toBatch(row));
  }
}
