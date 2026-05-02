import { Injectable, Logger } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { AdaptationRepository } from './adaptation.repo';

@Injectable()
export class AdaptationService {
  private readonly logger = new Logger(AdaptationService.name);

  constructor(private readonly repo: AdaptationRepository) {}

  async getPrograms(limit: number, offset: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findPrograms(limit, offset);
      if (!r.ok) { this.logger.error('getPrograms failed', r.error); return { items: [], total: 0 }; }
      return { items: r.data, total: r.data.length };
    });
  }

  async getRecords(status: string | undefined, limit: number, offset: number) {
    const r = await this.repo.findRecords(status, limit, offset);
    if (!r.ok) { this.logger.error('getRecords failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }

  async getDashboard() {
    const r = await this.repo.getDashboardStats();
    if (!r.ok) {
      this.logger.error('getDashboard failed', r.error);
      return { inProgress: 0, completed: 0, extended: 0, avgProgress: 0, activePrograms: 0 };
    }
    const d = r.data;
    return {
      inProgress:     Number(d['in_progress'])   || 0,
      completed:      Number(d['completed'])      || 0,
      extended:       Number(d['extended'])       || 0,
      avgProgress:    Number(d['avg_progress'])   || 0,
      activePrograms: Number(d['active_programs'])|| 0,
    };
  }

  async getCases(limit: number, offset: number) {
    const r = await this.repo.findCases(limit, offset);
    if (!r.ok) { this.logger.error('getCases failed', r.error); return { items: [], total: 0 }; }
    return { items: r.data, total: r.data.length };
  }

  async findRecordById(id: number): Promise<Result<Record<string, unknown> | null, AppError>> {
    return safeCall(async () => {
      const r = await this.repo.findRecordById(id);
      if (!r.ok) { this.logger.error('findRecordById failed', r.error); throw new Error(String(r.error)); }
      return r.data ?? null;
    });
  }
}
