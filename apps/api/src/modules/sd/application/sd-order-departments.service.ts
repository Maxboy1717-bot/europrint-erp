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

  setMoldStatus(orderId: number, moldId: string, status: string) {
    return this.repo.setMoldStatus(orderId, moldId, status);
  }

  setDesignStatus(orderId: number, techCardId: string, status: string) {
    return this.repo.setDesignStatus(orderId, techCardId, status);
  }

  setClicheStatus(orderId: number, clicheId: string, status: string) {
    return this.repo.setClicheStatus(orderId, clicheId, status);
  }

  setShippingStatus(orderId: number, status: string) {
    return this.repo.setShippingStatus(orderId, status);
  }

  setMaterialStatus(orderId: number, reqId: string, status: string) {
    return this.repo.setMaterialStatus(orderId, reqId, status);
  }

  setDieCode(orderId: number, moldId: string, dieCode: string) {
    return this.repo.setDieCode(orderId, moldId, dieCode);
  }

  getSharedDieWarnings() {
    return this.repo.getSharedDieWarnings();
  }
}
