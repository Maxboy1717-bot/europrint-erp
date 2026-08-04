/**
 * @module i-sd-deliveries.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;
export interface ISdDeliveriesRepository {
  findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>>;
  findById(id: number): Promise<Result<any | null>>;
  findItemsByDeliveryId(deliveryId: number): Promise<Result<object[]>>;
  create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>>;
  /**
   * Vision 09-qc.md #28 SD-half ("muddat o'tsa buyurtma blok (SD ham)"): true when the given
   * sales order has an order-linked QC certificate (certificates.order_id) whose expiry_date
   * has passed. Checked live against expiry_date (not the 'expired' status flag) so a delivery
   * attempted before QcCertificateExpiryCron's nightly sweep runs is still correctly blocked.
   */
  hasExpiredCertificate(salesOrderId: number): Promise<Result<boolean>>;
}
export const SD_DELIVERIES_REPO = 'ISdDeliveriesRepository';
