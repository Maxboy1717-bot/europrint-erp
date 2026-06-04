/**
 * @module qc-new.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { QcNewRepository } from '../infrastructure/repositories/qc-new.repository';

type AiTrendBase = Extract<
  Awaited<ReturnType<QcNewRepository['getAiTrendData']>>,
  { ok: true; data: unknown }
>['data'];

type AiTrendPrediction = { nextWeekRisk: string; confidenceScore: number; recommendation: string };

@Injectable()
export class QcNewService {
  constructor(private readonly repo: QcNewRepository) {}

  getDashboard(): ReturnType<QcNewRepository['getDashboardStats']> {
    return this.repo.getDashboardStats();
  }

  getCheckpoints(stage?: string): ReturnType<QcNewRepository['findCheckpoints']> {
    return this.repo.findCheckpoints(stage);
  }

  createCheckpoint(
    data: { name: string; description?: string; stage?: string; standard_id?: number },
  ): ReturnType<QcNewRepository['insertCheckpoint']> {
    return this.repo.insertCheckpoint({
      name: data.name,
      description: data.description,
      stage: data.stage,
      standardId: data.standard_id,
    });
  }

  async getAiTrend(): Promise<Result<AiTrendBase & { prediction: AiTrendPrediction }>> {
    const prediction: AiTrendPrediction = {
      nextWeekRisk: 'medium',
      confidenceScore: 0.72,
      recommendation: 'Sifat nazoratini kuchaytirish tavsiya etiladi',
    };
    const r = await this.repo.getAiTrendData();
    return r.ok ? Ok({ ...r.data, prediction }) : Err(r.error);
  }

  getCertificates(status?: string): ReturnType<QcNewRepository['findCertificates']> {
    return this.repo.findCertificates(status);
  }

  getLabTests(orderId?: string): ReturnType<QcNewRepository['findLabTests']> {
    return this.repo.findLabTests(orderId ? parseInt(orderId, 10) : undefined);
  }

  createLabTest(data: {
    order_id?: number;
    parameter_name: string;
    value?: number;
    unit?: string;
    min_value?: number;
    max_value?: number;
    tested_by?: string;
    notes?: string;
  }): ReturnType<QcNewRepository['insertLabTest']> {
    const v = data.value ?? null;
    const min = data.min_value ?? null;
    const max = data.max_value ?? null;
    const result = (min !== null && max !== null && v !== null)
      ? (v >= min && v <= max ? 'pass' : 'fail')
      : 'pending';
    return this.repo.insertLabTest({
      orderId: data.order_id,
      parameterName: data.parameter_name,
      value: data.value,
      unit: data.unit,
      minValue: data.min_value,
      maxValue: data.max_value,
      testedBy: data.tested_by,
      notes: data.notes,
      result,
    });
  }

  getSpcControlChart(parameterId?: number): ReturnType<QcNewRepository['getSpcChartData']> {
    return this.repo.getSpcChartData(parameterId);
  }

  getSupplierQualityRatings(): ReturnType<QcNewRepository['getSupplierRatings']> {
    return this.repo.getSupplierRatings();
  }

  getInspectionById(id: string): ReturnType<QcNewRepository['findInspectionById']> {
    return this.repo.findInspectionById(id);
  }

  updateInspection(id: string, dto: Record<string, unknown>): ReturnType<QcNewRepository['updateInspection']> {
    // Whitelist the persistable fields; the FE sends `reason` on reject → notes.
    return this.repo.updateInspection(id, {
      status: typeof dto.status === 'string' ? dto.status : undefined,
      result: typeof dto.result === 'string' ? dto.result : undefined,
      notes:  typeof dto.notes === 'string' ? dto.notes : (typeof dto.reason === 'string' ? dto.reason : undefined),
    });
  }

  deleteInspection(id: string): ReturnType<QcNewRepository['deleteInspection']> {
    return this.repo.deleteInspection(id);
  }
}
