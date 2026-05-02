import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { HrGsdRepository } from './hr-gsd.repository';

type Row = Record<string, unknown>;

@Injectable()
export class HrGsdService {
  constructor(private readonly repo: HrGsdRepository) {}

  getEmployee(id: number): Promise<Result<Row | null, AppError>> {
    return this.repo.findEmployee(id);
  }

  getEmployeeHistory(id: number): Promise<Result<Row[], AppError>> {
    return this.repo.findEmployeeHistory(id);
  }

  getReferrals(): Promise<Result<Row[], AppError>> {
    return this.repo.findReferrals();
  }

  getBoomerangs(): Promise<Result<Row[], AppError>> {
    return this.repo.findBoomerangs();
  }

  getSkills(): Promise<Result<Row[], AppError>> {
    return this.repo.findSkills();
  }

  getMilestone(id: number): Promise<Result<Row | null, AppError>> {
    return this.repo.findMilestone(id);
  }

  completeMilestone(id: number): Promise<Result<Row, AppError>> {
    return this.repo.completeMilestone(id);
  }

  async getEmployeesList(limit = 100, offset = 0): Promise<Row[]> {
    const r: Result<Row[], AppError> = await this.repo.findEmployeesList(limit, offset);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }
}
