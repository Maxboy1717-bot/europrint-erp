/**
 * @module technology.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { TechnologyRepository } from './technology.repository';

@Injectable()
export class TechnologyService {
  constructor(private readonly repo: TechnologyRepository) {}

  async getOrders(status?: string): Promise<Result<object, AppError>> { return this.repo.findOrders(status); }
  async getDashboard() { return this.repo.findDashboardStats(); }
  async getTechCards() { return this.repo.findTechCards(); }
  async getCards() { return this.repo.findTechnologyCards(); }
  async getCardById(id: string) { return this.repo.findTechnologyCardById(id); }
  async getOrderTechCard(orderId: string) { return this.repo.findOrderTechCard(orderId); }
  async runAiCheck(orderId: string) { return this.repo.runAiCheck(orderId); }
  async getApprovalLog(orderId: string) { return this.repo.findApprovalLog(orderId); }
  async getMaterialAlternatives(material: string) { return this.repo.findMaterialAlternatives(material); }

  async approveOrder(orderId: string, data: { bomApproved: boolean; routingApproved: boolean; techCardApproved: boolean; notes?: string; approvedById: string }) {
    return this.repo.approveOrder(orderId, data);
  }

  async rejectOrder(orderId: string, data: { reason: string; returnTo: string; rejectedById: string }) {
    return this.repo.rejectOrder(orderId, data);
  }
}
