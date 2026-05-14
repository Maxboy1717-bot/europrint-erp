/**
 * @module warehouse-employees.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, Ok, Err, AppError } from '@common/result';

export interface WarehouseEmployee {
  id:            number;
  warehouseId:   number;
  warehouseCode: string;
  warehouseName: string;
  userId:        number;
  username:      string;
  fullName:      string;
  role:          string;
  isPrimary:     boolean;
  assignedAt:    string;
}

@Injectable()
export class WarehouseEmployeesRepository {
  private readonly logger = new Logger(WarehouseEmployeesRepository.name);

  private selectFields = sql`
    we.id,
    we.warehouse_id  AS "warehouseId",
    w.code           AS "warehouseCode",
    w.name           AS "warehouseName",
    we.user_id       AS "userId",
    u.username,
    (COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS "fullName",
    we.role,
    we.is_primary    AS "isPrimary",
    we.assigned_at   AS "assignedAt"
  `;

  async listByWarehouse(warehouseId: number): Promise<Result<WarehouseEmployee[], AppError>> {
    try {
      const rows = await typedExecute<WarehouseEmployee>(sql`
        SELECT ${this.selectFields}
        FROM warehouse_employees we
        JOIN warehouses w ON w.id = we.warehouse_id
        JOIN users u      ON u.id = we.user_id
        WHERE we.warehouse_id = ${warehouseId}
          AND we.removed_at IS NULL
        ORDER BY we.is_primary DESC, we.role, u.first_name
      `);
      return Ok(rows);
    } catch (e) {
      this.logger.error(`listByWarehouse: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async listByUser(userId: number): Promise<Result<WarehouseEmployee[], AppError>> {
    try {
      const rows = await typedExecute<WarehouseEmployee>(sql`
        SELECT ${this.selectFields}
        FROM warehouse_employees we
        JOIN warehouses w ON w.id = we.warehouse_id
        JOIN users u      ON u.id = we.user_id
        WHERE we.user_id = ${userId}
          AND we.removed_at IS NULL
          AND w.is_active = true
        ORDER BY we.is_primary DESC, w.code
      `);
      return Ok(rows);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async findConflict(warehouseId: number, userId: number): Promise<Result<boolean, AppError>> {
    try {
      const rows = await typedExecute<{ id: number }>(sql`
        SELECT id FROM warehouse_employees
         WHERE warehouse_id = ${warehouseId}
           AND user_id      = ${userId}
           AND removed_at IS NULL
      `);
      return Ok(rows.length > 0);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async insert(dto: {
    warehouseId: number;
    userId:      number;
    role:        string;
    isPrimary:   boolean;
    assignedBy:  number;
    notes?:      string;
  }): Promise<Result<{ id: number }, AppError>> {
    try {
      const rows = await typedExecute<{ id: number }>(sql`
        INSERT INTO warehouse_employees
          (warehouse_id, user_id, role, is_primary, assigned_by, notes, assigned_at)
        VALUES
          (${dto.warehouseId}, ${dto.userId}, ${dto.role},
           ${dto.isPrimary}, ${dto.assignedBy}, ${dto.notes ?? null}, NOW())
        RETURNING id
      `);
      return Ok({ id: rows[0]?.id ?? 0 });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async softDelete(assignmentId: number, removedBy: number): Promise<Result<void, AppError>> {
    try {
      await db.execute(sql`
        UPDATE warehouse_employees
           SET removed_at = NOW(),
               notes = COALESCE(notes, '') || ' [Olib tashlandi user=' || ${removedBy} || ' at ' || NOW() || ']'
         WHERE id = ${assignmentId}
           AND removed_at IS NULL
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
