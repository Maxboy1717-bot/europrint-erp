/**
 * @module seven-functions.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Ok, Result, AppError } from '@common/result';
import { SEVEN_FUNCTIONS_REPO, type ISevenFunctionsRepo } from '../domain/repositories/i-seven-functions.repo';

const FALLBACK_FUNCTIONS = [
  { id: 1, name: 'HR', icon: 'users', route: '/hr', status: 'active', order_index: 1 },
  { id: 2, name: 'Moliya', icon: 'wallet', route: '/finance', status: 'active', order_index: 2 },
  { id: 3, name: 'POS', icon: 'shopping-cart', route: '/pos', status: 'active', order_index: 3 },
  { id: 4, name: 'CRM', icon: 'briefcase', route: '/crm', status: 'active', order_index: 4 },
  { id: 5, name: 'Ishlab chiqarish', icon: 'factory', route: '/mes', status: 'active', order_index: 5 },
  { id: 6, name: 'Ombor', icon: 'warehouse', route: '/wms', status: 'active', order_index: 6 },
  { id: 7, name: 'Hisobotlar', icon: 'chart', route: '/reports', status: 'active', order_index: 7 },
];

@Injectable()
export class SevenFunctionsService {
  constructor(@Inject(SEVEN_FUNCTIONS_REPO) private readonly repo: ISevenFunctionsRepo) {}

  async listFunctions(): Promise<Result<object, AppError>> {
    const r = await this.repo.listFunctions();
    if (!r.ok) return Ok(FALLBACK_FUNCTIONS);
    return r;
  }

  async getFunction(id: number) {
    return this.repo.getFunction(id);
  }

  async createFunction(name: string, description: string | null, ownerId: number, orderIndex: number, createdBy: number) {
    return this.repo.createFunction(name, description, ownerId, orderIndex, createdBy);
  }

  async updateFunction(id: number, name: string | null, description: string | null, ownerId: number | null, orderIndex: number | null) {
    return this.repo.updateFunction(id, name, description, ownerId, orderIndex);
  }

  async deleteFunction(id: number) {
    return this.repo.deleteFunction(id);
  }

  async getFunctionKpis(functionId: number) {
    return this.repo.getFunctionKpis(functionId);
  }

  async createKpi(functionId: number, name: string, targetValue: number | null, unit: string, responsibleId: number | null, frequency: string) {
    return this.repo.createKpi(functionId, name, targetValue, unit, responsibleId, frequency);
  }

  async updateKpi(id: number, name: string | null, targetValue: number | null, actualValue: number | null, unit: string | null, responsibleId: number | null) {
    return this.repo.updateKpi(id, name, targetValue, actualValue, unit, responsibleId);
  }

  async deleteKpi(id: number) {
    return this.repo.deleteKpi(id);
  }

  async analyzeFunction(functionId: number) {
    return safeCall(async () => {
      const [funcDataR, kpiDataR] = await Promise.all([
        this.repo.getFunctionForAnalysis(functionId),
        this.repo.getKpisForAnalysis(functionId),
      ]);
      if (!funcDataR.ok) throw new Error(funcDataR.error.message);
      if (!kpiDataR.ok) throw new Error(kpiDataR.error.message);
      return { funcData: funcDataR.data[0], kpiData: kpiDataR.data };
    });
  }
}
