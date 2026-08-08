/**
 * @module cc-baskets.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { CcBasketsRepository } from '../infrastructure/repositories/cc-baskets.repo';
import { BasketState } from '../domain/types';
import { unwrapOrThrow } from '@common/http-result';

@Injectable()
export class CcBasketsService {
  constructor(private readonly repo: CcBasketsRepository) {}

  /** Berilgan xodim uchun bitta savatdagi hujjatlar (CC #19: 100+ hujjat sahifalanadi) */
  async listBasket(userId: number, basket: BasketState, limit?: number, offset?: number) {
    return unwrapOrThrow(await this.repo.listBasket(userId, basket, limit, offset));
  }

  /** Sarlavhada ko'rsatiladigan badge raqamlari */
  async summary(userId: number) {
    return unwrapOrThrow(await this.repo.summary(userId));
  }

  /** Hujjatni boshqa savatga o'tkazish */
  async move(documentId: string, actorUserId: number, toBasket: BasketState, note?: string) {
    return unwrapOrThrow(await this.repo.moveBasket(documentId, actorUserId, toBasket, note));
  }

  /** Bitta hujjat ma'lumotlari */
  async getOne(documentId: string) {
    return unwrapOrThrow(await this.repo.getById(documentId));
  }
}
