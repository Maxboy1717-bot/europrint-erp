/**
 * @module iot-enhanced.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { IOT_ENHANCED_REPO, type IIotEnhancedRepo } from '../domain/repositories/i-iot-enhanced.repo';

@Injectable()
export class IotEnhancedService {
  constructor(@Inject(IOT_ENHANCED_REPO) private readonly repo: IIotEnhancedRepo) {}

  async getOrdersForKits(status?: string): Promise<Result<object, AppError>> {
    return this.repo.getOrdersForKits(status);
  }

  async getMaterialKits(status?: string) {
    return this.repo.getMaterialKits(status);
  }

  async createMaterialKit(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createMaterialKit(body, userId);
  }

  async calculateBom(orderId: number) {
    return safeCall(async () => {
      const bom_items = await this.repo.calculateBom(orderId);
      return { order_id: orderId, bom_items };
    });
  }

  async getKitItems(kitId: number) {
    return this.repo.getKitItems(kitId);
  }

  async addKitItem(kitId: number, body: Record<string, unknown>) {
    return this.repo.addKitItem(kitId, body);
  }

  async getMaterialKitById(kitId: number) {
    return safeCall(async () => {
      const row = await this.repo.getMaterialKitById(kitId);
      return row ?? null;
    });
  }

  async prepareMaterialKit(kitId: number) {
    return safeCall(async () => {
      const row = await this.repo.updateMaterialKitStatus(kitId, 'preparing');
      return row ?? { id: kitId, status: 'preparing' };
    });
  }

  async readyMaterialKit(kitId: number) {
    return safeCall(async () => {
      const row = await this.repo.updateMaterialKitStatus(kitId, 'ready');
      return row ?? { id: kitId, status: 'ready' };
    });
  }

  async generateMaterialKit(body: Record<string, unknown>, userId: number | null) {
    return this.repo.createMaterialKit({
      ...body,
      productionOrderId: body['orderId'] ?? body['productionOrderId'] ?? body['production_order_id'] ?? null,
    }, userId);
  }
}
