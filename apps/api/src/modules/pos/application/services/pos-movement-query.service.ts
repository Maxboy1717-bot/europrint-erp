/**
 * @module pos-movement-query.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MovementFilterDto } from '../../dto/movement.dto';
import { safeCall, Result, AppError } from '@common/result';
import { PosMovementQueryRepository } from '../../infrastructure/repositories/pos-movement-query.repository';

@Injectable()
export class PosMovementQueryService {
  private readonly logger = new Logger(PosMovementQueryService.name);

  constructor(
    private readonly repo: PosMovementQueryRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(filter: MovementFilterDto): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      this.logger.log(`POS harakatlar so'rovi bajarilmoqda`);
      return this.repo.findAll(filter);
    });
  }

  async findOne(movementId: number) {
    return safeCall(async () => {
      const result = await this.repo.findOne(movementId);
      if (!result) throw new NotFoundException(await this.i18n.t('errors.movementNotFound', { args: { id: movementId } }));
      return result;
    });
  }
}
