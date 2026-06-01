/**
 * @module sd-order-departments.service
 * @description Thin business-logic layer over SdOrderDepartmentsRepository for the
 *   manager's per-order department selection (Phase 4 fan-out source).
 */

import { Injectable } from '@nestjs/common';
import { SdOrderDepartmentsRepository } from '../orders/drizzle-sd-order-departments.repo';

@Injectable()
export class SdOrderDepartmentsService {
  constructor(private readonly repo: SdOrderDepartmentsRepository) {}

  setForOrder(orderId: number, depts: Array<{ department: string; mode?: string }>) {
    return this.repo.setForOrder(orderId, depts);
  }

  listForOrder(orderId: number) {
    return this.repo.listForOrder(orderId);
  }

  getSaga(orderId: number) {
    return this.repo.getSaga(orderId);
  }
}
