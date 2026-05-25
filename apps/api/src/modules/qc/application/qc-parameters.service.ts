/**
 * @module qc-parameters.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Err, Ok, isOk, Result } from '@common/result';
import { QcParametersRepository } from '../infrastructure/repositories/qc-parameters.repository';

type Row = Record<string, unknown>;

@Injectable()
export class QcParametersService {
  constructor(private readonly repo: QcParametersRepository) {}

  getParametersGrouped(): Promise<Result<Record<string, unknown[]>>> {
    return this.repo.findGrouped();
  }

  createParameter(data: { name: string; category?: string; unit?: string; min_value?: number; max_value?: number; target_value?: number; description?: string }): Promise<Result<Row>> {
    return this.repo.insert({ name: data.name, category: data.category, unit: data.unit, minValue: data.min_value, maxValue: data.max_value, targetValue: data.target_value, description: data.description });
  }

  async updateParameter(id: number, data: Partial<{ name: string; category: string; unit: string; min_value: number; max_value: number; target_value: number; description: string }>): Promise<Result<Row>> {
    return this.repo.update(id, { name: data.name, category: data.category, unit: data.unit, minValue: data.min_value, maxValue: data.max_value, targetValue: data.target_value, description: data.description });
  }

  deleteParameter(id: number): Promise<Result<void>> {
    return this.repo.deactivate(id);
  }

  seedParameters(): Promise<Result<{ seeded: number }>> {
    return this.repo.seed();
  }

  getTests(limit: number, offset: number): Promise<Result<object[]>> {
    return this.repo.findTests(limit, offset);
  }

  getRecentTests(limit: number): Promise<Result<object[]>> {
    return this.repo.findRecentTests(limit);
  }

  createTest(data: { order_id?: number; parameter_name: string; value?: number; unit?: string; min_value?: number; max_value?: number; tested_by?: string; notes?: string }): Promise<Result<Row>> {
    const v = data.value ?? null;
    const min = data.min_value ?? null;
    const max = data.max_value ?? null;
    const result = (min !== null && max !== null && v !== null)
      ? (Number(v) >= Number(min) && Number(v) <= Number(max) ? 'pass' : 'fail')
      : 'pending';
    return this.repo.insertTest({ orderId: data.order_id, parameterName: data.parameter_name, value: data.value, unit: data.unit, minValue: data.min_value, maxValue: data.max_value, testedBy: data.tested_by, notes: data.notes, result });
  }

  async aiAnalyzeTest(id: number): Promise<Result<Record<string, unknown>>> {
    const r = await this.repo.findTestById(id);
    if (!isOk(r)) return Err(r.error);
    if (!r.data) return Err({ code: 'NOT_FOUND' as const, message: 'Test not found' });
    const test = r.data;
    const value = Number(test.value ?? 0);
    const min = Number(test.minValue ?? test.min_value ?? 0);
    const max = Number(test.maxValue ?? test.max_value ?? 100);
    const range = max - min;
    const deviation = range > 0 ? Math.abs(value - (min + range / 2)) / (range / 2) : 0;
    const confidenceScore = Math.max(0, Math.min(1, 1 - deviation * 0.5));
    return Ok({
      test,
      analysis: {
        deviation: `${(deviation * 100).toFixed(1)}%`,
        trend: deviation < 0.2 ? 'stable' : deviation < 0.5 ? 'warning' : 'critical',
        recommendation: deviation < 0.2 ? 'Jarayon barqaror' : 'Jarayonni tekshirish kerak',
      },
      confidenceScore: Number(confidenceScore.toFixed(3)),
    });
  }

  deleteStandard(id: number): Promise<Result<void>> {
    return this.repo.deleteStandard(id);
  }
}
