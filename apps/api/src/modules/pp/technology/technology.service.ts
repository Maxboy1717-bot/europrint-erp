/**
 * @module technology.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import {
  TechnologyRepository, CreateCardInput, UpdateCardInput, AddRouteInput,
} from './technology.repository';
import { TechnologyGrammageService } from './technology-grammage.service';

@Injectable()
export class TechnologyService {
  constructor(
    private readonly repo: TechnologyRepository,
    private readonly grammage: TechnologyGrammageService,
  ) {}

  /**
   * ⭐ Effective corrugated grammage (Formula 3) + kg↔sheet chains (Formula 1+2)
   * for a tech card, via the pure GofraConversionService. Returns an HONEST
   * `complete:false` payload when the card's material lacks layer config / flute
   * factor / dimensions — never a fabricated number.
   */
  async getCardGrammage(cardId: number, materialCardId?: number) {
    return this.grammage.computeForCard(cardId, materialCardId);
  }

  async getOrders(status?: string): Promise<Result<object, AppError>> { return this.repo.findOrders(status); }
  async getDashboard() { return this.repo.findDashboardStats(); }
  async getTechCards() { return this.repo.findTechCards(); }
  async getCards() { return this.repo.findTechnologyCards(); }
  async getCardById(id: string) { return this.repo.findTechnologyCardById(id); }
  async getOrderTechCard(orderId: string) { return this.repo.findOrderTechCard(orderId); }
  async runAiCheck(orderId: string) { return this.repo.runAiCheck(orderId); }
  async getApprovalLog(orderId: string) { return this.repo.findApprovalLog(orderId); }
  async getMaterialAlternatives(material: string) { return this.repo.findMaterialAlternatives(material); }

  // Phase 1: texkarta master CRUD + child tables + lab-gate.
  async createCard(data: CreateCardInput) { return this.repo.createCard(data); }
  async updateCard(id: string, data: UpdateCardInput, changedBy?: number) { return this.repo.updateCard(id, data, changedBy); }
  async deleteCard(id: string, byId?: number) { return this.repo.softDeleteCard(id, byId); }
  async labApprove(id: string, byId?: number) { return this.repo.setLabApproved(id, byId); }
  async maketApprove(id: string) { return this.repo.setMaketApproved(id); }
  async getBom(id: string) { return this.repo.getBom(id); }
  async addBomItem(id: string, item: { materialCode: string; quantity: number; unit?: string; layer?: string }) { return this.repo.addBomItem(id, item); }
  async getRoutes(id: string) { return this.repo.getRoutes(id); }
  async addRoute(id: string, route: AddRouteInput) { return this.repo.addRoute(id, route); }
  async getVersions(id: string) { return this.repo.getVersions(id); }
  async restoreVersion(id: string, versionId: string, restoredBy?: number) { return this.repo.restoreVersion(id, versionId, restoredBy); }

  async approveOrder(orderId: string, data: { bomApproved: boolean; routingApproved: boolean; techCardApproved: boolean; notes?: string; approvedById: string }) {
    return this.repo.approveOrder(orderId, data);
  }

  async rejectOrder(orderId: string, data: { reason: string; returnTo: string; rejectedById: string }) {
    return this.repo.rejectOrder(orderId, data);
  }
}
