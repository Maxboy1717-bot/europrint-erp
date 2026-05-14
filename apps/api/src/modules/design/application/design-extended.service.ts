/**
 * @module design-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { DesignExtendedRepository } from './design-extended.repository';

@Injectable()
export class DesignExtendedService {
  constructor(private readonly repo: DesignExtendedRepository) {}

  async getOrdersList(): Promise<Result<object, AppError>> { return this.repo.findOrdersList(); }
  async getDashboardSummary() { return this.repo.findDashboardSummary(); }
  async getOrderRevisions(orderId: string) { return this.repo.findOrderRevisions(orderId); }
  async getTemplates() { return this.repo.findTemplates(); }
  async markNotificationRead(id: string) { return this.repo.markNotificationRead(id); }
  async updateOrderStatus(orderId: string, newStatus: string) { return this.repo.updateOrderStatus(orderId, newStatus); }
  async generateDesigns(orderId: string, prompt: string, count: number) { return this.repo.generateDesigns(orderId, prompt, count); }
  async verifyDesign(designId: string, checkTypes: string[]) { return this.repo.verifyDesign(designId, checkTypes); }
  async generateMockup(designId: string, productType: string) { return this.repo.generateMockup(designId, productType); }
  async approveDesign(designId: string) { return this.repo.approveDesign(designId); }
  async rejectDesign(designId: string, reason: string) { return this.repo.rejectDesign(designId, reason); }
}
