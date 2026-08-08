/**
 * @module warehouse-rental.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (WMS)
 */

import { Ok, Err, Result, safeCall, AppErr } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { safeInt } from '../../../hr/common/db-rows';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import type { IWarehouseRentalRepo } from '../../domain/repositories/i-warehouse-rental.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

// ── VISION-3340 #56: rental-fee SQL fragments (table alias = `wr`) ──────────
// Live columns (verified against europrint DB, 2026-07-08): start_date DATE
// (nullable, added after the canonical schema), admitted_date VARCHAR
// 'YYYY-MM-DD' (NOT NULL, canonical start marker), free_days INT,
// daily_rate_per_m2 NUMERIC, area_m2 NUMERIC, total_days INT,
// billable_days INT, total_amount NUMERIC.
/** O'tgan kunlar: CURRENT_DATE - boshlanish (start_date, bo'lmasa admitted_date). */
const ELAPSED_DAYS_SQL = sql`GREATEST(0, CURRENT_DATE - COALESCE(wr.start_date, wr.admitted_date::date))`;
/** To'lanadigan kunlar: GREATEST(0, o'tgan kunlar - bepul kunlar). */
const BILLABLE_DAYS_SQL = sql`GREATEST(0, (CURRENT_DATE - COALESCE(wr.start_date, wr.admitted_date::date)) - wr.free_days)`;
/** Ijara summasi: billable_days × kunlik tarif (m²) × maydon (m²). */
const RENTAL_FEE_SQL = sql`(${BILLABLE_DAYS_SQL} * wr.daily_rate_per_m2 * wr.area_m2)::numeric(15,2)`;

@Injectable()
export class WarehouseRentalRepository implements IWarehouseRentalRepo {
  async getRecords(status?: string): Promise<Result<Row[]>>  {
  try {
      // VISION-3340 #56: total_days / billable_days / total_amount are shadowed by
      // live CASE expressions (node-pg keeps the LAST duplicate field name), so
      // still-open ('active') records show a running total as of CURRENT_DATE while
      // closed/paid records keep the values frozen by closeRecord().
      const liveCols = sql`CASE WHEN wr.status = 'active' THEN (${ELAPSED_DAYS_SQL})::int ELSE wr.total_days END AS total_days, CASE WHEN wr.status = 'active' THEN (${BILLABLE_DAYS_SQL})::int ELSE wr.billable_days END AS billable_days, CASE WHEN wr.status = 'active' THEN ${RENTAL_FEE_SQL} ELSE wr.total_amount END AS total_amount`;
      return status
        ? exec(sql`SELECT wr.*, ${liveCols} FROM warehouse_rental_records wr WHERE wr.status = ${status} ORDER BY wr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
        : exec(sql`SELECT wr.*, ${liveCols} FROM warehouse_rental_records wr ORDER BY wr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createRecord(body: Row, userId: number | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO warehouse_rental_records (warehouse_id, customer_id, area_m2, daily_rate_per_m2, free_days, start_date, end_date, managed_by, notes, status) VALUES (${safeInt(String(body.warehouseId ?? body.warehouse_id ?? 0), 0)}, ${body.customerId ?? body.customer_id ?? null}, ${body.areaM2 ?? body.area_m2 ?? 0}, ${body.dailyRatePerM2 ?? body.daily_rate_per_m2 ?? 0}, ${body.freeDays ?? body.free_days ?? 0}, ${body.startDate ?? body.start_date ?? 'TODAY'}, ${body.endDate ?? body.end_date ?? null}, ${userId}, ${body.notes ?? null}, 'active') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getSummary(): Promise<Result<Row>>  {
  try {
      // VISION-3340 #56: active_value is a LIVE running total (stored total_amount is
      // only written at close time, so summing it for 'active' rows always gave 0).
      const rows = await exec(sql`SELECT COUNT(*) FILTER (WHERE wr.status = 'active')::int AS active_rentals, COUNT(*) FILTER (WHERE wr.status = 'closed')::int AS closed_rentals, COALESCE(SUM(${RENTAL_FEE_SQL}) FILTER (WHERE wr.status = 'active'), 0)::numeric(15,2) AS active_value, COALESCE(SUM(wr.total_amount) FILTER (WHERE wr.status = 'closed'), 0)::numeric(15,2) AS collected, 0::numeric(15,2) AS outstanding FROM warehouse_rental_records wr`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getSettings(): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`SELECT * FROM warehouse_rental_settings ORDER BY updated_at DESC LIMIT 1`);
      return r.ok ? Ok(r.data[0] ?? { default_daily_rate: 0, default_free_days: 0 }) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateSettings(body: Row): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO warehouse_rental_settings (default_daily_rate, default_free_days, notify_days_before, updated_at) VALUES (${body.defaultDailyRate ?? body.default_daily_rate ?? 0}, ${body.defaultFreeDays ?? body.default_free_days ?? 0}, ${body.notifyDaysBefore ?? body.notify_days_before ?? 8}, NOW()) ON CONFLICT DO NOTHING RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? body) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async closeRecord(id: number, _userId: number | null): Promise<Result<Row>>  {
  try {
      // VISION-3340 #56: fee is computed inside the SAME UPDATE (single round-trip):
      // billable_days = GREATEST(0, (CURRENT_DATE - start) - free_days) and
      // total_amount = billable_days * daily_rate_per_m2 * area_m2, where start =
      // COALESCE(start_date, admitted_date::date). Only 'active' records can be
      // closed — re-closing would silently recompute the frozen fee.
      // NOTE (live-DB verified 2026-07-08): warehouse_rental_records has NO
      // closed_by / closed_at columns (the previous UPDATE referenced them and
      // always failed at runtime); close metadata = status + closed_date +
      // end_date + last_calculated_at, so `_userId` is not persisted.
      const r = await exec(sql`UPDATE warehouse_rental_records wr SET status = 'closed', closed_date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), end_date = CURRENT_DATE, total_days = (${ELAPSED_DAYS_SQL})::int, billable_days = (${BILLABLE_DAYS_SQL})::int, total_amount = ${RENTAL_FEE_SQL}, last_calculated_at = NOW() WHERE wr.id = ${id} AND wr.status = 'active' RETURNING *`);
      if (!r.ok) return Err(r.error);
      const row = r.data[0];
      if (!row) return Err(AppErr('NOT_FOUND', `Faol ijara yozuvi topilmadi (id=${id})`));
      return Ok(row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async markPaid(id: number, userId: number | null, notes?: string): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`UPDATE warehouse_rental_records SET paid_at = NOW(), paid_by = ${userId}, payment_notes = ${notes ?? null} WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
