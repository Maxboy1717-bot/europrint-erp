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

  createMaterialTest(data: {
    orderId?: number;
    materialId?: number;
    testCategory: string;
    testDate?: string;
    testResults?: Record<string, unknown>[];
    overallStatus: string;
    passedCount?: number;
    failedCount?: number;
    notes?: string;
  }): Promise<Result<Row>> {
    return this.repo.insertMaterialTest(data);
  }

  async aiAnalyzeTest(id: number): Promise<Result<Record<string, unknown>>> {
    // Step 1: Read from qc_material_tests (FE creates tests there via POST /api/qc/tests)
    const r = await this.repo.findMaterialTestById(id);
    if (!isOk(r)) return Err(r.error);
    if (!r.data) return Err({ code: 'NOT_FOUND' as const, message: 'Test not found' });
    const test = r.data;

    // Step 2: Derive passed/failed from test_results JSONB array if counts are zero/null
    const rawResults = Array.isArray(test.testResults) ? test.testResults as Row[] : [];
    const passedCount = typeof test.passedCount === 'number' && test.passedCount > 0
      ? test.passedCount
      : rawResults.filter((row) => String(row.result ?? row.status ?? '').toLowerCase() === 'pass').length;
    const failedCount = typeof test.failedCount === 'number' && test.failedCount > 0
      ? test.failedCount
      : rawResults.filter((row) => String(row.result ?? row.status ?? '').toLowerCase() === 'fail').length;
    const totalCount = passedCount + failedCount;
    const passRate = totalCount > 0 ? passedCount / totalCount : (test.overallStatus === 'passed' ? 1 : 0);
    const confidenceScore = Number(Math.max(0, Math.min(1, passRate)).toFixed(3));

    const overallStatus = String(test.overallStatus ?? 'pending');
    const riskLevel = overallStatus === 'passed' ? 'low'
      : overallStatus === 'conditional' ? 'medium'
      : overallStatus === 'failed' ? 'high'
      : failedCount > 0 ? 'medium' : 'low';

    const analysis: Record<string, unknown> = {
      passedCount,
      failedCount,
      totalCount,
      passRate: `${(passRate * 100).toFixed(1)}%`,
      riskLevel,
      trend: confidenceScore >= 0.8 ? 'stable' : confidenceScore >= 0.5 ? 'warning' : 'critical',
      recommendation: confidenceScore >= 0.8
        ? "Jarayon barqaror — qayta sinovdan o'tkazish shart emas"
        : confidenceScore >= 0.5
          ? "Jarayonni kuzatish tavsiya etiladi"
          : "Ishlab chiqarish to'xtatilsin, muammoni tekshiring",
      analyzedAt: new Date().toISOString(),
    };

    // Step 3: Persist analysis and confidence score back to qc_material_tests
    const updateR = await this.repo.updateMaterialTestAiAnalysis(id, analysis, confidenceScore);
    if (!isOk(updateR)) return Err(updateR.error);

    return Ok({
      test: { ...test, aiAnalysis: analysis, aiConfidenceScore: confidenceScore },
      analysis,
      confidenceScore,
    });
  }

  deleteStandard(id: number): Promise<Result<void>> {
    return this.repo.deleteStandard(id);
  }
}
