/**
 * @module enps.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { EnpsRepository } from './enps.repository';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class EnpsService {
  private readonly logger = new Logger(EnpsService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: EnpsRepository,
  ) {}

  async createSurvey(dto: {
    title: string;
    description?: string;
    period: string;
    startDate?: string;
    endDate?: string;
    createdBy?: number;
  }) {
    const endDate = dto.endDate || new Date(Date.now() + 14 * MS_PER_DAY).toISOString().split('T')[0];
    const row = await this.repo.createSurvey({ ...dto, endDate });

    const rowData = (row?.ok ? row.data as Record<string, unknown> : {});
    this.eventEmitter.emit(HrV2Events.ENPS_SURVEY_SENT, {
      surveyId: rowData?.['id'],
      period: dto.period,
    });

    return row;
  }

  async launchSurvey(surveyId: number): Promise<Result<object, AppError>> {
    return this.repo.launchSurvey(surveyId);
  }

  async closeSurvey(surveyId: number) {
    return this.repo.closeSurvey(surveyId);
  }

  async submitResponse(dto: {
    surveyId: number;
    employeeId: number;
    score: number;
    comment?: string;
    answers?: Record<string, unknown>;
  }) {
    return safeCall(async () => {
      if (dto.score < 0 || dto.score > 10) {
        throw new InternalServerErrorException('Score must be between 0 and 10');
      }
      const row = await this.repo.submitResponse(dto);

      this.eventEmitter.emit(HrV2Events.ENPS_RESPONSE_SUBMITTED, {
        surveyId: dto.surveyId,
        employeeId: dto.employeeId,
        score: dto.score,
      });

      return row;
    });
  }

  async getSurveyResults(surveyId: number) {
    return safeCall(async () => {
      const data = await this.repo.getSurveyResults(surveyId);
      const d: Record<string, unknown> = (data.data ?? {}) as Record<string, unknown>;
      const total = parseInt(String(d['total_responses'] ?? '0'));
      const promoters = parseInt(String(d['promoters'] ?? '0'));
      const detractors = parseInt(String(d['detractors'] ?? '0'));
      const enpsScore = total > 0
        ? Math.round(((promoters - detractors) / total) * 100)
        : 0;

      return {
        surveyId,
        totalResponses: total,
        avgScore: safeNum(d['avg_score'] ?? '0').toFixed(1),
        promoters,
        passives: parseInt(String(d['passives'] ?? '0')),
        detractors,
        enpsScore,
        category: enpsScore >= 50 ? 'excellent' : enpsScore >= 0 ? 'good' : 'poor',
      };
    });
  }

  async listSurveys() {
    return this.repo.listSurveys();
  }

  @Cron('0 9 1 1,4,7,10 *')
  async launchQuarterlySurvey() {
    try {
      const now = _time.now();
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      const period = `Q${quarter}-${now.getFullYear()}`;
      const endDate = new Date(now.getTime() + 14 * MS_PER_DAY).toISOString().split('T')[0];

      await this.createSurvey({
        title: `eNPS so'rovnomasi — ${period}`,
        description: 'Har choraklik xodimlar qoniqish indeksi',
        period,
        endDate,
      });

      this.logger.log(`✅ Quarterly eNPS survey launched for ${period}`);
    } catch (err) {
      this.logger.error('launchQuarterlySurvey error', errMsg(err));
    }
  }

  @Cron('0 10 15 * *')
  async remindPendingSurveyRespondents() {
    try {
      const rows = await this.repo.getPendingSurveys();
      for (const survey of (rows.ok ? rows.data : [])) {
        this.eventEmitter.emit(HrV2Events.ENPS_SURVEY_REMINDER, {
          surveyId: survey['survey_id'],
          title: survey['title'],
          pendingCount: parseInt(String(survey['pending_count'] || '0')),
        });
      }
      if (rows.ok && rows.data.length > 0) {
        this.logger.log(`Monthly eNPS reminder sent for ${rows.data.length} active surveys`);
      }
    } catch (err) {
      this.logger.error('remindPendingSurveyRespondents error', errMsg(err));
    }
  }
}
