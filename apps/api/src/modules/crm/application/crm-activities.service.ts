import { Injectable, NotFoundException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmActivitiesRepository } from './crm-activities.repository';

@Injectable()
export class CrmActivitiesService {
  constructor(private readonly repo: CrmActivitiesRepository) {}

  async list(lid: number | null, did: number | null, uid: number | null, type: string | undefined, status: string | undefined, lim: number, off: number): Promise<Result<object, AppError>> {
    return this.repo.list(lid, did, uid, type, status, lim, off);
  }

  async today() {
    return this.repo.today();
  }

  async getById(aid: number) {
    return safeCall(async () => {
      const rowResult = await this.repo.getById(aid);

      if (!rowResult.ok) throw new Error(rowResult.error.message);
      if (!rowResult.data) throw new NotFoundException(`Faoliyat #${aid} topilmadi`);

      return rowResult.data;
    });
  }

  async create(type: unknown, subject: unknown, lead_id: unknown, deal_id: unknown, assigned_to: unknown, due_date: unknown, notes: unknown, status: unknown) {
    return this.repo.create(type, subject, lead_id, deal_id, assigned_to, due_date, notes, status);
  }

  async update(aid: number, body: Record<string, unknown>) {
    return safeCall(async () => {
      const updatedResult = await this.repo.update(aid, body);

      if (!updatedResult.ok) throw new Error(updatedResult.error.message);
      if (!updatedResult.data) throw new NotFoundException(`Faoliyat #${aid} topilmadi`);

      return updatedResult.data;
    });
  }

  async complete(aid: number, outcome: unknown) {
    return safeCall(async () => {
      const completedResult = await this.repo.complete(aid, outcome);

      if (!completedResult.ok) throw new Error(completedResult.error.message);
      if (!completedResult.data) throw new NotFoundException(`Faoliyat #${aid} topilmadi`);

      return completedResult.data;
    });
  }

  async delete(aid: number) {
    return this.repo.delete(aid);
  }
}
