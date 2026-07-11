/**
 * @module sd-order-sync.service
 * @description SD order sync-scheduling (vision 06-sd#40 — Kashirovka offset+gofra).
 *   Result<T> only; controller delegates here, service delegates to the repo.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  ISdOrderSyncRepo, SD_ORDER_SYNC_REPO, OrderSyncStatusRow,
} from '../domain/repositories/i-sd-order-sync.repo';

@Injectable()
export class SdOrderSyncService {
  constructor(@Inject(SD_ORDER_SYNC_REPO) private readonly repo: ISdOrderSyncRepo) {}

  getSyncStatus(orderId: number): Promise<Result<OrderSyncStatusRow>> {
    return this.repo.getSyncStatus(orderId);
  }

  setPredecessor(orderId: number, predecessorOrderId: number | null): Promise<Result<OrderSyncStatusRow>> {
    return this.repo.setPredecessor(orderId, predecessorOrderId);
  }
}
