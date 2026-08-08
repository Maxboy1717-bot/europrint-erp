/**
 * @module stat-regulation.service
 * @description Business-logic service for stat_regulations (versioned KPI
 *   master-data). Delegates to IStatRegulationRepo; returns Result<T>.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import {
  STAT_REGULATION_REPO,
  type IStatRegulationRepo,
  type IStatRegRow,
  type StatRegCreateInput,
  type StatRegUpdateInput,
} from '../domain/repositories/i-stat-regulation.repo';

@Injectable()
export class StatRegulationService {
  private readonly logger = new Logger(StatRegulationService.name);

  constructor(
    @Inject(STAT_REGULATION_REPO) private readonly repo: IStatRegulationRepo,
  ) {}

  async list(activeOnly: boolean): Promise<Result<IStatRegRow[]>> {
    return this.repo.list(activeOnly);
  }

  async getById(id: number): Promise<Result<IStatRegRow | null>> {
    return this.repo.getById(id);
  }

  async getHistory(nameUz: string): Promise<Result<IStatRegRow[]>> {
    return this.repo.getHistory(nameUz);
  }

  async create(dto: StatRegCreateInput): Promise<Result<IStatRegRow>> {
    this.logger.log({ code: 'EP-DIR-020', op: 'dir.statReg.create', name: dto.name_uz });
    if (dto.owner_card_id != null) {
      this.logger.log({ code: 'EP-DIR-023', op: 'dir.statReg.ownerCard', cardId: dto.owner_card_id });
    }
    return this.repo.create(dto);
  }

  async update(id: number, dto: StatRegUpdateInput): Promise<Result<IStatRegRow>> {
    this.logger.log({ code: 'EP-DIR-022', op: 'dir.statReg.version', id });
    return this.repo.update(id, dto);
  }

  async deactivate(id: number): Promise<Result<void>> {
    return this.repo.deactivate(id);
  }

  async approve(id: number, approverCardId: number): Promise<Result<IStatRegRow>> {
    this.logger.log({ code: 'EP-DIR-024', op: 'dir.statReg.approve', id, approverCardId });
    return this.repo.approve(id, approverCardId);
  }
}
