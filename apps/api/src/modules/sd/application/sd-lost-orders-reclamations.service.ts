/**
 * @module sd-lost-orders-reclamations.service
 * @description SD lost-orders (yo'qotilgan buyurtma sabab-katalogi) + reklamatsiya
 *   (SLA-timer) — T26-4-QC-WMS-SD genuine-gap. Result<T> only; controller delegates here.
 */

import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  ISdLostOrdersReclamationsRepo, SD_LOST_ORDERS_RECLAMATIONS_REPO,
  LostOrderRow, ReclamationRow, CreateLostOrderInput, CreateReclamationInput, ResolveReclamationInput,
} from '../domain/repositories/i-sd-lost-orders-reclamations.repo';

@Injectable()
export class SdLostOrdersReclamationsService {
  constructor(
    @Inject(SD_LOST_ORDERS_RECLAMATIONS_REPO) private readonly repo: ISdLostOrdersReclamationsRepo,
  ) {}

  listLostOrders(filters: { reasonCode?: string; customerId?: number }): Promise<Result<LostOrderRow[]>> {
    return this.repo.listLostOrders(filters);
  }

  createLostOrder(input: CreateLostOrderInput): Promise<Result<LostOrderRow>> {
    return this.repo.createLostOrder(input);
  }

  listReclamations(filters: { status?: string; customerId?: number }): Promise<Result<ReclamationRow[]>> {
    return this.repo.listReclamations(filters);
  }

  getReclamation(id: number): Promise<Result<ReclamationRow>> {
    return this.repo.getReclamation(id);
  }

  createReclamation(input: CreateReclamationInput): Promise<Result<ReclamationRow>> {
    return this.repo.createReclamation(input);
  }

  resolveReclamation(id: number, input: ResolveReclamationInput): Promise<Result<ReclamationRow>> {
    return this.repo.resolveReclamation(id, input);
  }
}
