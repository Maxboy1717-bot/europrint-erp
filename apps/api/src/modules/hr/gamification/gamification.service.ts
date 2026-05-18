/**
 * @module gamification.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { GamificationRepository } from './gamification.repository';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: GamificationRepository,
  ) {}

  async awardPoints(
    employeeId: number,
    points: number,
    eventType: string,
    description: string,
    referenceId?: number,
  ) {
    await this.repo.insertPoints(employeeId, points, eventType, description, referenceId);
    await this.repo.upsertTotals(employeeId, points);

    this.eventEmitter.emit(HrV2Events.GAMIFICATION_POINTS_AWARDED, {
      employeeId,
      points,
      eventType,
      description,
    });

    return { success: true, employeeId, points };
  }

  async awardBadge(
    employeeId: number,
    badgeCode: string,
    awardedBy?: number,
    reason?: string,
  ) {
    const row = await this.repo.insertBadge(employeeId, badgeCode, awardedBy, reason);

    if (row.ok && row.data) {
      const catRow = await this.repo.getBadgeCatalogEntry(badgeCode);
      const catRowData = (catRow.ok && catRow.data) ? catRow.data as Record<string, unknown> : null;
      const pts = parseInt(String(catRowData?.['point_value'] || '0'));
      if (pts > 0) {
        await this.awardPoints(employeeId, pts, 'badge_awarded', `Badge: ${badgeCode}`);
      }

      this.eventEmitter.emit(HrV2Events.GAMIFICATION_BADGE_AWARDED, {
        employeeId,
        badgeCode,
        awardedBy,
      });
    }

    return (row.ok && row.data) ? row.data : { message: 'Badge already awarded' };
  }

  async getLeaderboard(period: 'monthly' | 'quarterly' | 'all' = 'monthly'): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const periodParam = period === 'monthly' ? 'monthly' : period === 'quarterly' ? 'quarterly' : 'all';
      return this.repo.getLeaderboard(periodParam);
    });
  }

  async getEmployeePoints(employeeId: number) {
    return safeCall(async () => {
      const [totals, history] = await Promise.all([
        this.repo.getEmployeeTotals(employeeId),
        this.repo.getEmployeePointsHistory(employeeId),
      ]);
      return {
        totals: totals || { total_points: 0, monthly_points: 0, quarterly_points: 0 },
        history,
      };
    });
  }

  async getEmployeeBadges(employeeId: number) {
    return this.repo.getEmployeeBadges(employeeId);
  }

  async getBadgeCatalog() {
    return this.repo.getBadgeCatalog();
  }

  async createBadgeCatalogEntry(body: {
    code: string;
    name: string;
    name_ru?: string;
    description?: string;
    icon?: string;
    point_value?: number;
    category?: string;
  }) {
    return this.repo.upsertBadgeCatalogEntry(body);
  }

  // Wave 4 round-4 (PA2-18): the three @OnEvent listeners that previously
  // lived here (DAILY_REPORT_SUBMITTED / DOCUMENT_APPROVED / CERTIFICATE_EARNED)
  // have been extracted into canonical @EventsHandler classes in
  // ./gamification.listeners.ts. Their side-effects (awardPoints / awardBadge)
  // are unchanged — they delegate back into this service.

  @Cron('0 9 1 * *')
  async announceMonthlyChampion() {
    try {
      const champion = await this.repo.getMonthlyChampion();
      if (champion.ok && champion.data) {
        const chData = champion.data as Record<string, unknown>;
        await this.awardBadge(Number(chData['employee_id']), 'CHAMPION', undefined, 'Oylik chempion');
        await this.repo.resetMonthlyPointsExcept(Number(chData['employee_id']));
        this.eventEmitter.emit(HrV2Events.GAMIFICATION_MONTHLY_CHAMPION, {
          employeeId: chData['employee_id'],
          name: `${chData['first_name']} ${chData['last_name']}`,
          points: chData['monthly_points'],
        });
      }
    } catch (err) {
      this.logger.error('announceMonthlyChampion error', errMsg(err));
    }
  }

  @Cron('0 8 * * 1')
  async weeklyPointsDigest() {
    try {
      const rows = await this.repo.getWeeklyDigest();
      const rowsData = (rows.ok ? rows.data : []) as Record<string, unknown>[];
      if (rowsData.length > 0) {
        this.eventEmitter.emit(HrV2Events.GAMIFICATION_MONTHLY_CHAMPION, {
          employeeId: rowsData[0]['employee_id'],
          name: `${rowsData[0]['first_name']} ${rowsData[0]['last_name']}`,
          points: rowsData[0]['monthly_points'],
          context: 'weekly_digest',
          topEmployees: rowsData.slice(0, 5),
        });
        this.logger.log(`Weekly points digest: top employee has ${rowsData[0]['monthly_points']} pts this month`);
      }
    } catch (err) {
      this.logger.error('weeklyPointsDigest error', errMsg(err));
    }
  }
}
