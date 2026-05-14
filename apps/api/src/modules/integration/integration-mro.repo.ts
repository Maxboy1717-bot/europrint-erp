/**
 * @module integration-mro.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';
import { CreateMroItemDto, CreateMroRequestDto } from './dto/mro.dto';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class IntegrationMroRepository {
  private readonly logger = new Logger(IntegrationMroRepository.name);

  findItems(category?: string): Promise<Result<Row[]>> {
    return safeCall(async () =>
      category
        ? exec(sql`SELECT * FROM mro_items WHERE category = ${category} ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT * FROM mro_items ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
    );
  }

  insertItem(dto: CreateMroItemDto): Promise<Result<Row>> {
    return safeCall(async () => {
      const { name, category, unit, currentStock, minStock, unitCost, location, supplier } = dto;
      const r = await exec(sql`INSERT INTO mro_items (name, category, unit, current_stock, min_stock, unit_cost, location, supplier, created_at) VALUES (${name}, ${category ?? 'general'}, ${unit ?? 'dona'}, ${currentStock ?? 0}, ${minStock ?? 0}, ${unitCost ?? 0}, ${location ?? null}, ${supplier ?? null}, NOW()) RETURNING *`);
      return r[0] ?? {};
    });
  }

  findRequests(status?: string): Promise<Result<Row[]>> {
    return safeCall(async () =>
      status
        ? exec(sql`SELECT * FROM mro_requests WHERE status = ${status} ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT * FROM mro_requests ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
    );
  }

  insertRequest(dto: CreateMroRequestDto): Promise<Result<Row>> {
    return safeCall(async () => {
      const { itemId, requestedQuantity, reason, requestedBy, priority } = dto;
      const r = await exec(sql`INSERT INTO mro_requests (item_id, requested_quantity, reason, requested_by, priority, status, created_at) VALUES (${itemId ?? null}, ${requestedQuantity ?? 1}, ${reason ?? null}, ${requestedBy ?? null}, ${priority ?? 'normal'}, 'pending', NOW()) RETURNING *`);
      return r[0] ?? {};
    });
  }

  updateRequestStatus(id: string, status: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`UPDATE mro_requests SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r[0] ?? {};
    });
  }

  findEquipment(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM mro_equipment ORDER BY name ASC LIMIT ${MAX_QUERY_LIMIT}`));
  }

  getStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await exec(sql`SELECT (SELECT COUNT(*) FROM mro_items) AS total_items, (SELECT COUNT(*) FROM mro_items WHERE current_stock <= min_stock) AS low_stock_count, (SELECT COUNT(*) FROM mro_requests WHERE status = 'pending') AS pending_requests, (SELECT COALESCE(SUM(unit_cost * current_stock), 0) FROM mro_items) AS total_value`);
      return (rows[0] ?? {}) as Row;
    });
  }

  findBudgets(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM mro_budgets ORDER BY created_at DESC LIMIT 50`));
  }

  findCleaningSchedules(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM mro_cleaning_schedules ORDER BY scheduled_date ASC LIMIT 100`));
  }

  findUtilityReadings(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM mro_utility_readings ORDER BY reading_date DESC LIMIT 100`));
  }

  findFacilities(): Promise<Result<Row[]>> {
    return safeCall(async () => exec(sql`SELECT * FROM mro_facilities ORDER BY name ASC LIMIT 100`));
  }
}
