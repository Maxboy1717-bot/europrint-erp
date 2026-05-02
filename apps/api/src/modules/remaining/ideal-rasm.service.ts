import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { IdealRasmRepository } from './ideal-rasm.repository';

@Injectable()
export class IdealRasmService {
  constructor(private readonly repo: IdealRasmRepository) {}

  async getAll(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      await this.repo.ensureSeeded();
      const targets = await this.repo.getAll();
      const weeklyRevenue = await this.repo.getWeeklyRevenue();
      const employeesCount = await this.repo.getActiveEmployeesCount();

      const actuals: Record<string, number> = {
        weekly_profit:   0,
        weekly_revenue:  weeklyRevenue.ok ? (weeklyRevenue.data as number) : 0,
        branches_count:  1,
        employees_count: employeesCount.ok ? (employeesCount.data as number) : 0,
        market_share:    0,
      };

      const targetsRaw = (targets.ok ? targets.data as Record<string, unknown>[] : []);
      const targetsArr = Array.isArray(targetsRaw) ? targetsRaw : [];
      const enriched = (targetsArr ?? []).map((t) => ({
        ...t,
        actualValue:    actuals[String(t['target_key'])] ?? 0,
        achievementPct: safeNum(t['target_value']) > 0
          ? Math.round(((actuals[String(t['target_key'])] ?? 0) / safeNum(t['target_value'])) * 100)
          : 0,
      }));
      return { targets: enriched, generatedAt: _time.now().toISOString() };
    });
  }

  async updateAll(body: Record<string, unknown>) {
    return safeCall(async () => {
      const targets = body['targets'] as Array<{ targetKey: string; targetValue: string | number; horizonYears?: number; description?: string }>;
      if (!Array.isArray(targets)) throw new BadRequestException('targets array talab qilinadi');
      const updated = [];
      for (const t of targets) {
        const row = await this.repo.updateTarget(t.targetKey, String(t.targetValue), t.horizonYears ?? 3, t.description ?? null);
        if (row) updated.push(row);
      }
      return { updated };
    });
  }

  async updateOne(key: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const row = await this.repo.updateTarget(key, String(body['targetValue']), Number(body['horizonYears'] ?? 3), (body['description'] as string) ?? null);
      if (!row) throw new NotFoundException('Maqsad topilmadi');
      return { target: row };
    });
  }
}
