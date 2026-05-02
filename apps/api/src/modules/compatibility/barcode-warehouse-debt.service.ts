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
}
