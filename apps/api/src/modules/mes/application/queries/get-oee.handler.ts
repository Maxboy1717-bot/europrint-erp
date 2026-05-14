/**
 * @module get-oee.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, mes_sessions } from '@shared/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { GetOeeQuery } from './get-oee.query';

import { MS_PER_MINUTE } from '@common/constants/app.constants';
@Injectable()
@QueryHandler(GetOeeQuery)
export class GetOeeHandler implements IQueryHandler<GetOeeQuery> {
  private readonly logger = new Logger(GetOeeHandler.name);

  async execute(query: GetOeeQuery): Promise<Result<object[]>> {
      const conditions = [];

      if (query.filters.from) {
        conditions.push(gte(mes_sessions.started_at, query.filters.from));
      }

      if (query.filters.to) {
        conditions.push(lte(mes_sessions.started_at, query.filters.to));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sessions = await db.select().from(mes_sessions).where(where);

      const groupedByWorkCenter = new Map<string, (typeof sessions)[number][]>();

      for (const session of sessions) {
        const workCenterId = query.filters.workCenterId || session.work_center_id || 'unknown';

        if (!groupedByWorkCenter.has(workCenterId)) {
          groupedByWorkCenter.set(workCenterId, []);
        }

        const wcArr = groupedByWorkCenter.get(workCenterId);
        if (wcArr) wcArr.push(session);
      }

      const oeeResults = [];

      for (const [workCenterId, sessionList] of groupedByWorkCenter.entries()) {
        let totalPlannedTime = 0;
        let totalActualTime = 0;
        let totalPlannedOutput = 0;
        let totalActualOutput = 0;
        let totalPassedQty = 0;

        for (const session of sessionList) {
          const startTime = new Date(session.started_at).getTime();
          const endTime = session.completed_at ? new Date(session.completed_at).getTime() : Date.now();
          const actualTime = (endTime - startTime) / MS_PER_MINUTE;

          totalActualTime += actualTime;
          totalPlannedTime += actualTime;

          const defects = session.defect_qty || 0;
          const passedQty = Math.max(0, (session.quality_passed ? 1 : 0) - defects);

          totalActualOutput += 1;
          totalPlannedOutput += 1;
          totalPassedQty += passedQty;
        }

        const availability = totalPlannedTime > 0 ? totalActualTime / totalPlannedTime : 0;
        const performance = totalPlannedOutput > 0 ? totalActualOutput / totalPlannedOutput : 0;
        const quality = totalActualOutput > 0 ? totalPassedQty / totalActualOutput : 0;

        const oee = availability * performance * quality;

        oeeResults.push({
          workCenterId,
          availability: Math.round(availability * 100),
          performance: Math.round(performance * 100),
          quality: Math.round(quality * 100),
          oee: Math.round(oee * 100),
          sessionCount: sessionList.length,
          from: query.filters.from,
          to: query.filters.to,
        });
      }

      this.logger.debug(`OEE calculated for ${oeeResults.length} work centers`);

      return { ok: true, data: oeeResults };
  }
}
