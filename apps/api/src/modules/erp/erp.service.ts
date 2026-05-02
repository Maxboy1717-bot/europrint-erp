import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { ErpRepository } from './erp.repository';

@Injectable()
export class ErpService {
  constructor(private readonly repo: ErpRepository) {}

  async listProducts(page: number, limit: number): Promise<Result<object, AppError>> {
    return safeCall(() => this.repo.listProducts(limit, (page - 1) * limit));
  }

  async getProduct(id: number) {
    return this.repo.getProduct(id);
  }

  async updateProduct(id: number, body: Record<string, unknown>) {
    return this.repo.updateProduct(id, body);
  }

  async listBomHeaders(page: number, limit: number) {
    return safeCall(() => this.repo.listBomHeaders(limit, (page - 1) * limit));
  }

  async getBomHeader(id: number) {
    return this.repo.getBomHeader(id);
  }

  async bomExplosion(id: number, quantity: number) {
    return this.repo.bomExplosion(id, quantity);
  }

  async listBomItems(bomHeaderId: number) {
    return this.repo.listBomItems(bomHeaderId);
  }

  async createBomItem(body: Record<string, unknown>) {
    return this.repo.createBomItem(body);
  }

  async updateBomItem(id: number, body: Record<string, unknown>) {
    return this.repo.updateBomItem(id, body);
  }

  async listRoutings(page: number, limit: number) {
    return safeCall(() => this.repo.listRoutings(limit, (page - 1) * limit));
  }

  async getRouting(id: number) {
    return this.repo.getRouting(id);
  }

  async listRoutingOperations(routingId?: number) {
    return this.repo.listRoutingOperations(routingId);
  }

  async updateRoutingOperation(id: number, body: Record<string, unknown>) {
    return this.repo.updateRoutingOperation(id, body);
  }
}
