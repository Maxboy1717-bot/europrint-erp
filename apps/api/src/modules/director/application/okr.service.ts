import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { OkrRepository } from './okr.repository';

@Injectable()
export class OkrService {
  constructor(private readonly repo: OkrRepository) {}

  async listObjectives(type: string | null, year: number | null, quarter: string | null, status: string | null): Promise<Result<object, AppError>> {
    return this.repo.listObjectives(type, year, quarter, status);
  }

  async getObjective(id: number) {
    return this.repo.getObjective(id);
  }

  async createObjective(title: string, type: string, year: number, quarter: string, description: string | null, ownerId: number) {
    return this.repo.createObjective(title, type, year, quarter, description, ownerId);
  }

  async updateObjective(id: number, title: string | null, status: string | null, description: string | null) {
    return this.repo.updateObjective(id, title, status, description);
  }

  async deleteObjective(id: number) {
    return this.repo.deleteObjective(id);
  }

  async listKeyResults(objectiveId: number | null) {
    return this.repo.listKeyResults(objectiveId);
  }

  async createKeyResult(objectiveId: number, title: string, targetValue: number, currentValue: number, unit: string, ownerId: number) {
    return this.repo.createKeyResult(objectiveId, title, targetValue, currentValue, unit, ownerId);
  }

  async updateKeyResult(id: number, currentValue: number | null, status: string | null, title: string | null) {
    return this.repo.updateKeyResult(id, currentValue, status, title);
  }

  async deleteKeyResult(id: number) {
    return this.repo.deleteKeyResult(id);
  }

  async getDashboard() {
    return safeCall(async () => {
      const [objs, krs] = await Promise.all([
        this.repo.getDashboardObjectives(),
        this.repo.getDashboardKeyResults(),
      ]);
      return { objectives: objs, keyResults: krs };
    });
  }
}
