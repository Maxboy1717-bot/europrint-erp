/**
 * @module i-warehouse-rental.repo
 * @description Domain repository interface for warehouse rental records,
 *   summary, settings, close, and payment marking.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/warehouse-rental.repository.ts`.
 * @layer Domain (WMS)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IWarehouseRentalRepo {
  getRecords(status?: string): Promise<Result<Row[]>>;
  createRecord(body: Row, userId: number | null): Promise<Result<Row>>;
  getSummary(): Promise<Result<Row>>;
  getSettings(): Promise<Result<Row>>;
  updateSettings(body: Row): Promise<Result<Row>>;
  closeRecord(id: number, userId: number | null): Promise<Result<Row>>;
  markPaid(id: number, userId: number | null, notes?: string): Promise<Result<Row>>;
}

export const WAREHOUSE_RENTAL_REPO = Symbol('WAREHOUSE_RENTAL_REPO');
