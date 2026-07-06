/**
 * @module crm-activities.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { safeCall, Result, AppError, Err } from '@common/result';
import { CRM_ACTIVITIES_REPO, type ICrmActivitiesRepo } from '../domain/repositories/i-crm-activities.repo';

@Injectable()
export class CrmActivitiesService {
  constructor(
    @Inject(CRM_ACTIVITIES_REPO) private readonly repo: ICrmActivitiesRepo,
    private readonly i18n: I18nService,
  ) {}

  async list(lid: number | null, did: number | null, uid: number | null, type: string | undefined, status: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.list(lid, did, uid, type, status, lim, off);
  }

  async today() {
    return this.repo.today();
  }

  async getById(aid: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.getById(aid);

      if (!rowResult.ok) return Err(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(await this.i18n.t('errors.crmActivityNotFoundWithId', { args: { id: aid } }));

      return rowResult.data;
    });
  }

  async create(type: unknown, subject: unknown, lead_id: unknown, deal_id: unknown, assigned_to: unknown, due_date: unknown, notes: unknown, status: unknown) {
    return this.repo.create(type, subject, lead_id, deal_id, assigned_to, due_date, notes, status);
  }

  async update(aid: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const updatedResult = await this.repo.update(aid, body);

      if (!updatedResult.ok) return Err(updatedResult.error.message);
      if (!updatedResult.data) throw new NotFoundException(await this.i18n.t('errors.crmActivityNotFoundWithId', { args: { id: aid } }));

      return updatedResult.data;
    });
  }

  async complete(aid: number, outcome: unknown) {
    return safeCall(async () => {
      const completedResult = await this.repo.complete(aid, outcome);

      if (!completedResult.ok) return Err(completedResult.error.message);
      if (!completedResult.data) throw new NotFoundException(await this.i18n.t('errors.crmActivityNotFoundWithId', { args: { id: aid } }));

      return completedResult.data;
    });
  }

  async delete(aid: number) {
    return this.repo.delete(aid);
  }
}
