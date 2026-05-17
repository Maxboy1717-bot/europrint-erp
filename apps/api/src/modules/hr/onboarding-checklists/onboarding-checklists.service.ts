import { Injectable } from '@nestjs/common';
import { OnboardingChecklistsRepository } from './onboarding-checklists.repository';
import { Result, Ok, Err, AppErr } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class OnboardingChecklistsService {
  constructor(private readonly repo: OnboardingChecklistsRepository) {}

  list(type?: string) {
    return this.repo.listAll(type);
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  /**
   * Create-or-return: if a checklist already exists for `(userId, type)`
   * return it (idempotent re-submits from `HROnboarding.tsx`). Otherwise
   * insert a fresh row.
   */
  async createForUser(dto: { userId: number; type: string; totalItems?: number }): Promise<Result<Row>> {
    const existing = await this.repo.findByUser(dto.userId, dto.type);
    if (existing.ok && existing.data) {
      return Ok(existing.data);
    }
    return this.repo.create({
      userId: dto.userId,
      type: dto.type,
      totalItems: dto.totalItems,
    });
  }

  async updateProgress(id: number, completedItems: number): Promise<Result<Row>> {
    if (!Number.isFinite(completedItems) || completedItems < 0) {
      return Err(AppErr('VALIDATION', 'completedItems must be >= 0'));
    }
    const r = await this.repo.updateProgress(id, completedItems);
    if (!r.ok) return Err(r.error);
    if (!r.data) return Err(AppErr('NOT_FOUND', `Checklist #${id} not found`));
    return Ok(r.data);
  }
}
