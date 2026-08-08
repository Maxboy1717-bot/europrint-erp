/**
 * @module barcode-warehouse-debt.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { rows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class BarcodeWarehouseDebtService {
  async getOperatorDebts(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const res = await rawSql(sql`
      SELECT elc.*, e.full_name AS employee_name, e.position
      FROM employee_liability_cases elc
      LEFT JOIN employees e ON e.id = elc.employee_id
      WHERE elc.status IN ('open', 'pending')
      ORDER BY elc.created_at DESC
    `);
    return rows(res);
    });}

  async getDebtById(id: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const res = await rawSql(sql`
      SELECT elc.*, e.full_name AS employee_name, e.position
      FROM employee_liability_cases elc
      LEFT JOIN employees e ON e.id = elc.employee_id
      WHERE elc.id = ${parseInt(id, 10)}
      LIMIT 1
    `);
    return rows(res)[0] ?? { id, not_found: true };
    });}

  async updateDebt(id: string, patch: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const intId = parseInt(id, 10);
      // Whitelisted nullable params — NULL means "leave existing value" (COALESCE pattern)
      const status            = patch['status']             !== undefined ? String(patch['status'])           : null;
      const description       = patch['description']        !== undefined ? String(patch['description'])      : null;
      const resolutionNotes   = patch['resolution_notes']   !== undefined ? String(patch['resolution_notes']) : null;
      const damageAmount      = patch['damage_amount']      !== undefined ? Number(patch['damage_amount'])    : null;
      const assessedValue     = patch['assessed_value']     !== undefined ? Number(patch['assessed_value'])   : null;
      const compensatedAmount = patch['compensated_amount'] !== undefined ? Number(patch['compensated_amount']) : null;
      const res = await rawSql(sql`
        UPDATE employee_liability_cases SET
          status             = COALESCE(${status},            status),
          description        = COALESCE(${description},       description),
          resolution_notes   = COALESCE(${resolutionNotes},   resolution_notes),
          damage_amount      = COALESCE(${damageAmount},      damage_amount),
          assessed_value     = COALESCE(${assessedValue},     assessed_value),
          compensated_amount = COALESCE(${compensatedAmount}, compensated_amount),
          updated_at         = NOW()
        WHERE id = ${intId}
        RETURNING *
      `);
      return rows(res)[0] ?? { id, updated: false };
    });
  }
}
