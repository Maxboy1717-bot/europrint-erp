/**
 * @module instrument-calibration.repository
 * @description QC o'lchov asboblari kalibrovkasi (qc_instrument_calibrations) — modul 09 (09.36).
 *   next_due_at yaqinlashganda due_soon bayrog'i (sertifikat-muddat patterni). Result (Qoida 1).
 *
 * NOTE: Raw SQL — due_soon hisoblash (next_due_at <= CURRENT_DATE+30), calibrate'da
 *   sana-arifmetika (next_due = calibrated + interval_days). ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (QC)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface CalibrationRow {
  id: number;
  instrument_name: string;
  instrument_code: string | null;
  location: string | null;
  responsible_user_id: number | null;
  interval_days: number;
  last_calibrated_at: string | null;
  next_due_at: string | null;
  certificate_number: string | null;
  status: string;
  notes: string | null;
  due_soon: boolean;
  is_overdue: boolean;
}

@Injectable()
export class InstrumentCalibrationRepository {
  async list(dueSoonOnly: boolean): Promise<Result<CalibrationRow[]>> {
    try {
      // Shartli WHERE — boolean parametrni SQL ichida solishtirishdan qochamiz (bind noaniqligi).
      const dueFilter = dueSoonOnly
        ? sql`WHERE next_due_at IS NOT NULL AND next_due_at <= CURRENT_DATE + 30`
        : sql``;
      const r = await runQuery<CalibrationRow>(sql`
        SELECT id, instrument_name, instrument_code, location, responsible_user_id,
               interval_days, last_calibrated_at, next_due_at, certificate_number, status, notes,
               (next_due_at IS NOT NULL AND next_due_at <= CURRENT_DATE + 30) AS due_soon,
               (next_due_at IS NOT NULL AND next_due_at <  CURRENT_DATE)      AS is_overdue
        FROM qc_instrument_calibrations
        ${dueFilter}
        ORDER BY (next_due_at IS NULL), next_due_at ASC, id DESC
      `);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async getById(id: number): Promise<Result<CalibrationRow>> {
    try {
      const r = await runQuery<CalibrationRow>(sql`
        SELECT id, instrument_name, instrument_code, location, responsible_user_id,
               interval_days, last_calibrated_at, next_due_at, certificate_number, status, notes,
               (next_due_at IS NOT NULL AND next_due_at <= CURRENT_DATE + 30) AS due_soon,
               (next_due_at IS NOT NULL AND next_due_at <  CURRENT_DATE)      AS is_overdue
        FROM qc_instrument_calibrations WHERE id = ${id}
      `);
      if (!r.rows[0]) return Err({ message: 'Asbob topilmadi', code: 'NOT_FOUND' });
      return Ok(r.rows[0]);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async create(input: {
    instrumentName: string; instrumentCode: string | null; location: string | null;
    responsibleUserId: number | null; intervalDays: number;
  }): Promise<Result<{ id: number }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO qc_instrument_calibrations
          (instrument_name, instrument_code, location, responsible_user_id, interval_days)
        VALUES (${input.instrumentName}, ${input.instrumentCode}, ${input.location},
                ${input.responsibleUserId}, ${input.intervalDays})
        RETURNING id
      `);
      const row = r.rows[0];
      if (!row) return Err({ message: 'Asbob qo\'shilmadi', code: 'DB_ERROR' });
      return Ok({ id: row.id });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async update(id: number, patch: {
    instrumentName?: string | null; instrumentCode?: string | null; location?: string | null;
    responsibleUserId?: number | null; intervalDays?: number | null; status?: string | null;
    notes?: string | null;
  }): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE qc_instrument_calibrations SET
          instrument_name     = COALESCE(${patch.instrumentName ?? null}, instrument_name),
          instrument_code     = COALESCE(${patch.instrumentCode ?? null}, instrument_code),
          location            = COALESCE(${patch.location ?? null}, location),
          responsible_user_id = COALESCE(${patch.responsibleUserId ?? null}, responsible_user_id),
          interval_days       = COALESCE(${patch.intervalDays ?? null}, interval_days),
          status              = COALESCE(${patch.status ?? null}, status),
          notes               = COALESCE(${patch.notes ?? null}, notes),
          updated_at          = NOW()
        WHERE id = ${id} RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Asbob topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** Kalibrovka yozish: last=berilgan sana (yoki bugun), next = last + interval_days. */
  async calibrate(id: number, certificateNumber: string | null, calibratedAt: string | null): Promise<Result<{ nextDueAt: string | null }>> {
    try {
      const r = await runQuery<{ next_due_at: string | null }>(sql`
        UPDATE qc_instrument_calibrations SET
          last_calibrated_at = COALESCE(${calibratedAt}::date, CURRENT_DATE),
          next_due_at        = COALESCE(${calibratedAt}::date, CURRENT_DATE) + (interval_days || ' days')::interval,
          certificate_number = COALESCE(${certificateNumber}, certificate_number),
          updated_at         = NOW()
        WHERE id = ${id} AND status = 'active'
        RETURNING next_due_at
      `);
      if (r.rows.length === 0) return Err({ message: 'Faol asbob topilmadi', code: 'NOT_FOUND' });
      return Ok({ nextDueAt: r.rows[0].next_due_at });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`DELETE FROM qc_instrument_calibrations WHERE id = ${id} RETURNING id`);
      if (r.rows.length === 0) return Err({ message: 'Asbob topilmadi', code: 'NOT_FOUND' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
