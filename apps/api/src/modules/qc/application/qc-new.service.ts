/**
 * @module qc-new.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable } from '@nestjs/common';
import { QcNewRepository } from '../infrastructure/repositories/qc-new.repository';

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

  getAiTrend(): ReturnType<QcNewRepository['getAiTrendSummary']> {
    return this.repo.getAiTrendSummary();
  }

  getCertificates(status?: string): ReturnType<QcNewRepository['findCertificates']> {
    return this.repo.findCertificates(status);
  }

  createCertificate(data: {
    certNumber: string;
    orderId?: number;
    productName?: string;
    issuedDate?: string;
    status?: string;
    notes?: string;
    issuedBy?: string;
  }): ReturnType<QcNewRepository['insertCertificate']> {
    return this.repo.insertCertificate(data);
  }

  getLabTests(orderId?: string): ReturnType<QcNewRepository['findLabTests']> {
    return this.repo.findLabTests(orderId ? parseInt(orderId, 10) : undefined);
  }

  createLabTest(data: {
    order_id?: number;
    parameter_name?: string;
    value?: number;
    unit?: string;
    min_value?: number;
    max_value?: number;
    tested_by?: string;
    notes?: string;
    materialName?: string;
    lotNumber?: string;
    grammatura?: number;
    qalinlik?: number;
    bosim?: number;
    namlik?: number;
    operatorName?: string;
    result?: string;
  }): ReturnType<QcNewRepository['insertLabTest']> {
    const v = data.value ?? null;
    const min = data.min_value ?? null;
    const max = data.max_value ?? null;
    // Session-model rows (materialName present) carry their own operator-chosen result
    // (pass/fail/conditional from LabSchema on the FE); the generic model still derives
    // pass/fail/pending from a min/max compare when the caller didn't send one.
    const computedResult = (min !== null && max !== null && v !== null)
      ? (v >= min && v <= max ? 'pass' : 'fail')
      : 'pending';
    const result = data.result ?? computedResult;
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
      materialName: data.materialName,
      lotNumber: data.lotNumber,
      grammatura: data.grammatura,
      qalinlik: data.qalinlik,
      bosim: data.bosim,
      namlik: data.namlik,
      operatorName: data.operatorName,
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

  /** VISION-3340 #40 — full material→QC→delivery trace for one production order. */
  getTraceability(productionOrderId: number): ReturnType<QcNewRepository['getProductionOrderTrace']> {
    return this.repo.getProductionOrderTrace(productionOrderId);
  }
}
