import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { CrmFollowupCompatRepository } from './crm-followup-compat.repository';

@Injectable()
export class CrmFollowupCompatService {
  constructor(private readonly repo: CrmFollowupCompatRepository) {}

  async list(lid: number | null, lim: number, off: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      return this.repo.list(lid, lim, off);
    });
  }

  async today() {
    return safeCall(async () => {
      return this.repo.today();
    });
  }
}
