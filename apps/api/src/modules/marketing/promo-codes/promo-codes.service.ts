/**
 * @module promo-codes.service
 * @description Business-logic service for marketing promo codes. Returns Result<T> from
 *   @common/result; never throws raw Errors (CLAUDE.md Qoida 1).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { MARKETING_PROMO_CODE_DEFAULT_USAGE_LIMIT } from '@common/constants/business.constants';
import { PromoCodesRepository } from './promo-codes.repository';

type Row = Record<string, unknown>;

interface CreatePromoCodeInput {
  code: string;
  campaignId: string;
  customerId?: number;
  usageLimit?: number;
}

@Injectable()
export class PromoCodesService {
  private readonly logger = new Logger(PromoCodesService.name);

  constructor(private readonly repo: PromoCodesRepository) {}

  findAll(campaignId?: string): Promise<Result<Row[]>> {
    return this.repo.findAll(campaignId);
  }

  findOne(id: number): Promise<Result<Row | null>> {
    return this.repo.findOne(id);
  }

  async create(dto: CreatePromoCodeInput): Promise<Result<Row>> {
    const created = await this.repo.create({
      code: dto.code,
      campaignId: dto.campaignId,
      customerId: dto.customerId,
      // Vision 14-marketing #20: "1 mijoz / 1 kampaniya bo'yicha cheklangan (default)";
      // caller (marketing boshliq, campaign settings) can override with a higher limit --
      // "yangi kampaniyada boshqa limit qo'yish mumkin".
      usageLimit: dto.usageLimit ?? MARKETING_PROMO_CODE_DEFAULT_USAGE_LIMIT,
    });
    if (!created.ok) return Err(String(created.error));
    this.logger.log(`promo-codes: yaratildi code=${dto.code} campaignId=${dto.campaignId}`);
    return Ok(created.data);
  }

  async redeem(id: number): Promise<Result<Row>> {
    const existing = await this.repo.findOne(id);
    if (!existing.ok || !existing.data) return Err('PROMO_CODE_NOT_FOUND');
    const result = await this.repo.redeem(id);
    if (!result.ok) return Err('PROMO_CODE_LIMIT_REACHED');
    return Ok(result.data);
  }

  async remove(id: number): Promise<Result<{ message: string }>> {
    const existing = await this.repo.findOne(id);
    if (!existing.ok || !existing.data) return Err('PROMO_CODE_NOT_FOUND');
    await this.repo.remove(id);
    this.logger.log(`promo-codes: o'chirildi id=${id}`);
    return Ok({ message: "O'chirildi" });
  }
}
