/**
 * @module i-sd-orders.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { salesOrders } from '@europrint/schemas';
import { Result } from '@common/result';

type SalesOrderRow = typeof salesOrders.$inferSelect;

export interface ISdOrdersRepository {
  findAll(): Promise<Result<SalesOrderRow[]>>;
  findById(id: number): Promise<Result<SalesOrderRow | null>>;
  findByDocumentNumber(docNum: string): Promise<Result<SalesOrderRow | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<SalesOrderRow>>;
  update(id: number, dto: Record<string, unknown>): Promise<Result<SalesOrderRow>>;
  updateMasterStatus(id: number, masterStatus: string): Promise<Result<SalesOrderRow>>;
  updateAdvancePayment(id: number, dto: { advancePaidAmount: string; advanceStatus: string; balanceDueAmount: string }): Promise<Result<SalesOrderRow>>;
  cancel(id: number): Promise<Result<void>>;
}

export const SD_ORDERS_REPO = 'ISdOrdersRepository';
