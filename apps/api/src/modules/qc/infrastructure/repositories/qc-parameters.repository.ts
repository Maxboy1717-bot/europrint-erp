/**
 * @module qc-parameters.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, qc_parameters, qc_lab_tests, qc_standards } from '@shared/db';
import { eq, desc, sql } from 'drizzle-orm';
import { rawSql } from '@shared/db';
import { safeCall, Err, Ok, isOk, Result } from '@common/result';

type Row = Record<string, unknown>;

const DEFAULT_PARAMETERS: Array<{
  name: string; category: string; unit: string;
  minValue: string; maxValue: string; targetValue: string;
}> = [
  { name: 'Bosma sifati', category: 'printing', unit: '%', minValue: '85', maxValue: '100', targetValue: '95' },
  { name: 'Rang aniqligi (Delta E)', category: 'color', unit: 'ΔE', minValue: '0', maxValue: '3', targetValue: '1' },
  { name: "Qog'oz qalinligi", category: 'material', unit: 'mkm', minValue: '70', maxValue: '130', targetValue: '100' },
  { name: 'Lak qatlami', category: 'finishing', unit: 'mkm', minValue: '5', maxValue: '15', targetValue: '10' },
  { name: 'Temir taranglik', category: 'cutting', unit: 'N/cm', minValue: '20', maxValue: '50', targetValue: '35' },
];

@Injectable()
export class QcParametersRepository {
  async findGrouped(): Promise<Result<Record<string, unknown[]>>> {
    
    return safeCall(async () => {
      const rows = await db.select().from(qc_parameters)
        .where(eq(qc_parameters.isActive, true))
        .orderBy(qc_parameters.category, qc_parameters.name);
      const grouped: Record<string, unknown[]> = {};
      for (const row of rows) {
        const cat = row.category ?? 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(row);
      }
      return grouped;
    }, 'DB_ERROR');
  }

  async insert(data: {
    name: string; category?: string; unit?: string;
    minValue?: number; maxValue?: number; targetValue?: number; description?: string;
  }): Promise<Result<Row>> {
    
    return safeCall(async () => {
      const rows = await db.insert(qc_parameters).values({
        name: data.name,
        category: data.category ?? 'general',
        unit: data.unit ?? null,
        minValue: data.minValue != null ? String(data.minValue) : null,
        maxValue: data.maxValue != null ? String(data.maxValue) : null,
        targetValue: data.targetValue != null ? String(data.targetValue) : null,
        description: data.description ?? null,
      }).returning();
      return rows[0] as Row;
    }, 'DB_ERROR');
  }

  async update(id: number, data: Partial<{
    name: string; category: string; unit: string;
    minValue: number; maxValue: number; targetValue: number; description: string;
  }>): Promise<Result<Row>> {
    try {
    const r = await safeCall(async () => {
      const rows = await db.update(qc_parameters).set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.minValue !== undefined && { minValue: String(data.minValue) }),
        ...(data.maxValue !== undefined && { maxValue: String(data.maxValue) }),
        ...(data.targetValue !== undefined && { targetValue: String(data.targetValue) }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: _time.now(),
      }).where(eq(qc_parameters.id, id)).returning();
      return rows;
    }, 'DB_ERROR');
    if (!isOk(r)) return r as Result<Row>;
    if (!r.data.length) return Err({ code: 'NOT_FOUND' as const, message: 'Parameter not found' });
    return Ok(r.data[0] as Row);
      } catch (_e) {
      return Err(String(_e));
    }
  }

  async deactivate(id: number): Promise<Result<void>> {
    
    return safeCall(async () => {
      await db.update(qc_parameters).set({ isActive: false, updatedAt: _time.now() }).where(eq(qc_parameters.id, id));
    }, 'DB_ERROR');
  }

  async seed(): Promise<Result<{ seeded: number }>> {
    
    return safeCall(async () => {
      await db.insert(qc_parameters).values(
        DEFAULT_PARAMETERS.map((p) => ({
          name: p.name,
          category: p.category,
          unit: p.unit,
          minValue: p.minValue,
          maxValue: p.maxValue,
          targetValue: p.targetValue,
        })),
      ).onConflictDoNothing();
      return { seeded: DEFAULT_PARAMETERS.length };
    }, 'DB_ERROR');
  }

  async findTests(limit: number, offset: number): Promise<Result<object[]>> {
    
    return safeCall(async () => {
      const rows = await db.select().from(qc_lab_tests)
        .orderBy(desc(qc_lab_tests.createdAt))
        .limit(limit)
        .offset(offset);
      return rows;
    }, 'DB_ERROR');
  }

  async findRecentTests(limit: number): Promise<Result<object[]>> {
    
    return safeCall(async () => {
      const rows = await db.select({
        id: qc_lab_tests.id,
        orderId: qc_lab_tests.orderId,
        parameterName: qc_lab_tests.parameterName,
        value: qc_lab_tests.value,
        unit: qc_lab_tests.unit,
        result: qc_lab_tests.result,
        testedBy: qc_lab_tests.testedBy,
        testedAt: qc_lab_tests.testedAt,
        createdAt: qc_lab_tests.createdAt,
      }).from(qc_lab_tests).orderBy(desc(qc_lab_tests.createdAt)).limit(limit);
      return rows;
    }, 'DB_ERROR');
  }

  async insertTest(data: {
    orderId?: number; parameterName: string; value?: number; unit?: string;
    minValue?: number; maxValue?: number; testedBy?: string; notes?: string; result: string;
  }): Promise<Result<Row>> {
    
    return safeCall(async () => {
      const rows = await db.insert(qc_lab_tests).values({
        orderId: data.orderId ?? null,
        parameterName: data.parameterName,
        value: data.value != null ? String(data.value) : null,
        unit: data.unit ?? null,
        result: data.result,
        minValue: data.minValue != null ? String(data.minValue) : null,
        maxValue: data.maxValue != null ? String(data.maxValue) : null,
        testedBy: data.testedBy ?? null,
        notes: data.notes ?? null,
        testedAt: _time.now(),
      }).returning();
      return rows[0] as Row;
    }, 'DB_ERROR');
  }

  async insertMaterialTest(data: {
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
    return safeCall(async () => {
      const testDate = data.testDate ?? new Date().toISOString().slice(0, 10);
      const testResults = data.testResults ?? [];
      const r = await rawSql(sql`
        INSERT INTO qc_material_tests
          (order_id, material_id, test_category, test_date, test_results, overall_status,
           passed_count, failed_count, notes, created_at)
        VALUES
          (${data.orderId ?? null}, ${data.materialId ?? null}, ${data.testCategory},
           ${testDate}, ${JSON.stringify(testResults)}::jsonb, ${data.overallStatus},
           ${data.passedCount ?? 0}, ${data.failedCount ?? 0}, ${data.notes ?? null}, NOW())
        RETURNING id, overall_status AS "overallStatus", test_category AS "testCategory", created_at AS "createdAt"
      `);
      const row = (r as { rows?: Row[] }).rows?.[0];
      if (!row) throw new Error('INSERT returned no row');
      return row;
    }, 'DB_ERROR');
  }

  async findTestById(id: number): Promise<Result<Row | null>> {

    return safeCall(async () => {
      const rows = await db.select().from(qc_lab_tests).where(eq(qc_lab_tests.id, id)).limit(1);
      return rows[0] as Row ?? null;
    }, 'DB_ERROR');
  }

  async findMaterialTestById(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, order_id AS "orderId", material_id AS "materialId",
               test_category AS "testCategory", test_date AS "testDate",
               test_results AS "testResults", overall_status AS "overallStatus",
               passed_count AS "passedCount", failed_count AS "failedCount",
               ai_analysis AS "aiAnalysis", ai_confidence_score AS "aiConfidenceScore",
               notes, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM qc_material_tests WHERE id = ${id} LIMIT 1
      `);
      const row = (r as { rows?: Row[] }).rows?.[0];
      return row ?? null;
    }, 'DB_ERROR');
  }

  async updateMaterialTestAiAnalysis(
    id: number,
    analysis: Record<string, unknown>,
    confidenceScore: number,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        UPDATE qc_material_tests
        SET ai_analysis = ${JSON.stringify(analysis)}::jsonb,
            ai_confidence_score = ${confidenceScore},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, ai_analysis AS "aiAnalysis", ai_confidence_score AS "aiConfidenceScore", updated_at AS "updatedAt"
      `);
      const row = (r as { rows?: Row[] }).rows?.[0];
      if (!row) throw new Error(`qc_material_tests id=${id} not found`);
      return row;
    }, 'DB_ERROR');
  }

  async deleteStandard(id: number): Promise<Result<void>> {
    
    return safeCall(async () => {
      await db.delete(qc_standards).where(eq(qc_standards.id, id));
    }, 'DB_ERROR');
  }
}
