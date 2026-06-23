/**
 * @module drizzle-work-center.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { ppWorkCenters as workCenters } from '@shared/db/schema-pp';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/result';
import { WorkCenter, WorkCenterType } from '../../domain/aggregates/work-center.aggregate';

export interface WorkCenterFilters {
  type?: WorkCenterType;
  isActive?: boolean;
  departmentId?: number;
  departmentKind?: string; // Wave 1: FLEKSO | OFSET (sex taxonomy)
}

export interface WorkCenterStats {
  total: number;
  byType: Record<string, number>;
  avgCostPerHour: number;
  withLmsCertification: number;
}

@Injectable()
export class DrizzleWorkCenterRepository {
  private readonly logger = new Logger(DrizzleWorkCenterRepository.name);

  async findById(id: string): Promise<Result<WorkCenter>> {
    try {
      const numId = parseInt(id, 10);
      const rowArr = await db.select().from(workCenters).where(eq(workCenters.id, numId)).limit(1);
      const row = rowArr[0] as Record<string, unknown> | undefined;

      if (!row) {
        return Err('Work center topilmadi');
      }

      const workCenter = this.toDomain(row);
      return Ok(workCenter);
    } catch (error: unknown) {
      this.logger.error(`Failed to find work center ${id}: ${(error as Error).message}`);
      return Err('Work center oqishda xatolik');
    }
  }

  async findAll(filters?: WorkCenterFilters): Promise<Result<WorkCenter[]>> {
    try {
      const conditions = [];

      if (filters?.type) {
        conditions.push(eq(workCenters.type, filters.type));
      }

      if (filters?.isActive !== undefined) {
        conditions.push(eq(workCenters.isActive, filters.isActive));
      }

      if (filters?.departmentId !== undefined) {
        conditions.push(eq(workCenters.departmentId, filters.departmentId));
      }

      if (filters?.departmentKind) {
        conditions.push(eq(workCenters.departmentKind, filters.departmentKind));
      }

      conditions.push(isNull(workCenters.deletedAt));

      const where = and(...conditions);

      const rows = await db.select().from(workCenters).where(where).orderBy(desc(workCenters.createdAt));

      const workCenterList = (rows as Record<string, unknown>[]).map((row) => this.toDomain(row));
      return Ok(workCenterList);
    } catch (error: unknown) {
      this.logger.error(`Failed to find all work centers: ${(error as Error).message}`);
      return Err('Work centerlari oqishda xatolik');
    }
  }

  async save(workCenter: WorkCenter): Promise<Result<WorkCenter>> {
    try {
      await db.insert(workCenters).values({
        code: workCenter.code,
        name: workCenter.name,
        type: workCenter.type,
        capacity: workCenter.capacity,
        isActive: workCenter.isActive,
        createdAt: workCenter.createdAt,
      });

      return Ok(workCenter);
    } catch (error: unknown) {
      this.logger.error(`Failed to save work center: ${(error as Error).message}`);
      return Err('Work center saqlashda xatolik');
    }
  }

  async update(workCenter: WorkCenter): Promise<Result<WorkCenter>> {
    try {
      const numId = parseInt(workCenter.id, 10);
      await db
        .update(workCenters)
        .set({
          code: workCenter.code,
          name: workCenter.name,
          type: workCenter.type,
          capacity: workCenter.capacity,
          isActive: workCenter.isActive,
        })
        .where(eq(workCenters.id, numId));

      return Ok(workCenter);
    } catch (error: unknown) {
      this.logger.error(`Failed to update work center: ${(error as Error).message}`);
      return Err('Work center yangilashda xatolik');
    }
  }

  // Wave 4: per-sex norma/brak/crew config (qisman yangilash). Faqat berilgan maydonlar yoziladi;
  // qiymatlar egasi-DATA (PUT /pp/work-centers/:id/norms orqali kiritiladi). Numeric → string (Drizzle).
  async updateNorms(
    id: string,
    norms: { normaM2PerShift?: number; normaKgPerShift?: number; brakLimitPct?: number; minCrewSize?: number; maxCrewSize?: number },
  ): Promise<Result<Record<string, unknown>>> {
    try {
      const numId = parseInt(id, 10);
      const patch: Record<string, unknown> = {};
      if (norms.normaM2PerShift !== undefined) patch.normaM2PerShift = String(norms.normaM2PerShift);
      if (norms.normaKgPerShift !== undefined) patch.normaKgPerShift = String(norms.normaKgPerShift);
      if (norms.brakLimitPct !== undefined) patch.brakLimitPct = String(norms.brakLimitPct);
      if (norms.minCrewSize !== undefined) patch.minCrewSize = norms.minCrewSize;
      if (norms.maxCrewSize !== undefined) patch.maxCrewSize = norms.maxCrewSize;
      if (Object.keys(patch).length === 0) return Err('Yangilanadigan norma maydoni yo\'q');
      const rows = await db.update(workCenters).set(patch).where(eq(workCenters.id, numId)).returning();
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return Err('Work center topilmadi');
      return Ok(row);
    } catch (error: unknown) {
      this.logger.error(`Failed to update work center norms: ${(error as Error).message}`);
      return Err('Work center norma yangilashda xatolik');
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<Result<WorkCenter>> {
    try {
      const numId = parseInt(id, 10);
      const rowArr = await db.select().from(workCenters).where(eq(workCenters.id, numId)).limit(1);
      const row = rowArr[0] as Record<string, unknown> | undefined;

      if (!row) {
        return Err('Work center topilmadi');
      }

      await db
        .update(workCenters)
        .set({ isActive })
        .where(eq(workCenters.id, numId));

      return Ok(this.toDomain({ ...row, is_active: isActive }));
    } catch (error: unknown) {
      this.logger.error(`Failed to toggle work center: ${(error as Error).message}`);
      return Err('Work center o\'zgartirishda xatolik');
    }
  }

  async getStats(): Promise<Result<WorkCenterStats>> {
    try {
      const allWorkCenters = await db
        .select()
        .from(workCenters)
        .where(isNull(workCenters.deletedAt));

      const byType: Record<string, number> = {};
      let withCertification = 0;
      let costSum = 0;

      for (const wc of (allWorkCenters as Record<string, unknown>[])) {
        const wcType = String(wc['type'] ?? 'machine');
        byType[wcType] = (byType[wcType] || 0) + 1;
        if (wc['certificationLmsCourseId']) {
          withCertification++;
        }
        costSum += safeNum(wc['costPerHour'] ?? wc['cost_per_hour'], 0);
      }

      const total = allWorkCenters.length;
      const stats: WorkCenterStats = {
        total,
        byType,
        avgCostPerHour: total > 0 ? costSum / total : 0,
        withLmsCertification: withCertification,
      };

      return Ok(stats);
    } catch (error: unknown) {
      this.logger.error(`Failed to get work center stats: ${(error as Error).message}`);
      return Err('Statistika olishda xatolik');
    }
  }

  async checkCodeUnique(code: string, excludeId?: string): Promise<Result<boolean>> {
    try {
      const existingArr = await db.select().from(workCenters).where(eq(workCenters.code, code)).limit(1);
      const existing = existingArr[0] as Record<string, unknown> | undefined;

      if (existing && String(existing['id']) !== excludeId) {
        return Err('Kod allaqachon mavjud');
      }

      return Ok(true);
    } catch (error: unknown) {
      this.logger.error(`Failed to check code uniqueness: ${(error as Error).message}`);
      return Err('Tekshirishda xatolik');
    }
  }

  private toDomain(row: Record<string, unknown>): WorkCenter {
    return new WorkCenter(
      String(row['id'] ?? ''),
      String(row['code'] ?? ''),
      String(row['name'] ?? ''),
      ((row['type'] ?? 'machine') as WorkCenterType),
      safeNum(row['capacity'] ?? 0),
      safeNum(row['costPerHour'] ?? row['cost_per_hour'], 0),
      row['certificationLmsCourseId'] ? String(row['certificationLmsCourseId']) : null,
      row['departmentId'] ? String(row['departmentId']) : null,
      Boolean(row['isActive'] ?? row['is_active']),
      row['createdAt'] ? new Date(String(row['createdAt'])) : _time.now(),
      _time.now(),
    );
  }
}
