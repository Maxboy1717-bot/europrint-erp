/**
 * @module pos-requisition-workflow.helpers
 * @description Pure helpers for fetching, stock reservation, barcode validation
 *   and status setting. Extracted from pos-requisition-workflow.service.ts (Rule 16).
 */

import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { posMaterialRequests, posMaterialRequestLines } from '@workspace/db';
import { db } from '@shared/db';
import { eq } from 'drizzle-orm';
import { TashkentTimeService } from '@common/time';
import { Result, Ok, Err } from '@common/result';
import type { PosEmployeeBalanceRepository } from '../../../infrastructure/repositories/pos-employee-balance.repository';

const _time = new TashkentTimeService();

export type RequestRow = typeof posMaterialRequests.$inferSelect;
export type LineRow = typeof posMaterialRequestLines.$inferSelect;

export type ReqStatus =
  | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  | 'FULLY_ISSUED' | 'CANCELLED' | 'PARTIALLY_ISSUED';

export async function fetchRequest(requestId: number, i18n: I18nService): Promise<RequestRow> {
  const [req] = await db
    .select()
    .from(posMaterialRequests)
    .where(eq(posMaterialRequests.id, requestId));
  if (!req) throw new NotFoundException(await i18n.t('errors.requestNotFound', { args: { id: requestId } }));
  return req;
}

export async function fetchLines(requestId: number): Promise<LineRow[]> {
  return db
    .select()
    .from(posMaterialRequestLines)
    .where(eq(posMaterialRequestLines.requestId, requestId));
}

export async function setStatus(
  requestId: number,
  status: ReqStatus,
  extra?: Partial<typeof posMaterialRequests.$inferInsert>,
): Promise<RequestRow> {
  const [updated] = await db
    .update(posMaterialRequests)
    .set({ status: status as ReqStatus, updatedAt: _time.now(), ...extra } as Partial<typeof posMaterialRequests.$inferInsert>)
    .where(eq(posMaterialRequests.id, requestId))
    .returning();
  return updated;
}

export async function reserveStock(
  requestId: number,
  warehouseId: string,
  balanceRepo: PosEmployeeBalanceRepository,
  logger: Logger,
): Promise<Result<void>> {
  const lines = await fetchLines(requestId);
  for (const line of lines) {
    const qty = Number(line.approvedQty ?? line.requestedQty);
    const r = await balanceRepo.reserveStock(warehouseId, Number(line.materialCardId), qty);
    if (!r.ok) return Err(r.error);
  }
  logger.debug(`Stock reserved for request ${requestId} in warehouse ${warehouseId}`);
  return Ok();
}

export async function releaseReservedStock(
  requestId: number,
  warehouseId: string,
  balanceRepo: PosEmployeeBalanceRepository,
  logger: Logger,
): Promise<Result<void>> {
  const lines = await fetchLines(requestId);
  for (const line of lines) {
    const qty = Number(line.approvedQty ?? line.requestedQty);
    const r = await balanceRepo.releaseStock(warehouseId, Number(line.materialCardId), qty);
    if (!r.ok) return Err(r.error);
  }
  logger.debug(`Stock reservation released for request ${requestId}`);
  return Ok();
}

export async function validateBarcodes(
  barcodes: string[],
  balanceRepo: PosEmployeeBalanceRepository,
): Promise<Result<void>> {
  for (const barcode of barcodes) {
    const r = await balanceRepo.barcodeExists(barcode);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err({ code: 'BAD_REQUEST', message: `Barcode topilmadi: ${barcode}` });
  }
  return Ok();
}
