/**
 * @module orders-registry.service
 * @description Business-logic service. Returns Result<T>; raw SQL over orders_registry (compat shim table).
 */
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

export interface OrdersRegistryInput {
  number?: string;
  category?: string;
  title: string;
  content?: string;
  issuedBy?: string;
  issuedDate?: string;
  status?: string;
  departmentIds?: unknown;
}

@Injectable()
export class OrdersRegistryService {
  listOrders(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await db.execute(sql`SELECT id, number, category, title, content, issued_by, issued_date, status, department_ids, created_at FROM orders_registry ORDER BY id DESC LIMIT 200`);
      return ((r as { rows?: Row[] }).rows ?? []) as Row[];
    }, 'DB_ERROR');
  }

  createOrder(dto: OrdersRegistryInput): Promise<Result<Row>> {
    return safeCall(async () => {
      const deptJson = JSON.stringify(Array.isArray(dto.departmentIds) ? dto.departmentIds : []);
      const r = await db.execute(sql`
        INSERT INTO orders_registry (number, category, title, content, issued_by, issued_date, status, department_ids, created_at)
        VALUES (${dto.number ?? null}, ${dto.category ?? null}, ${dto.title}, ${dto.content ?? null}, ${dto.issuedBy ?? null}, ${dto.issuedDate ?? null}, ${dto.status ?? 'draft'}, ${deptJson}::jsonb, NOW())
        RETURNING id, number, category, title, status, department_ids, created_at`);
      return ((((r as { rows?: Row[] }).rows ?? [])[0]) ?? {}) as Row;
    }, 'DB_ERROR');
  }
}
