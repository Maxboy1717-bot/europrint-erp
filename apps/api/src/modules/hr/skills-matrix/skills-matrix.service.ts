/**
 * @module skills-matrix.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { errMsg } from "../hr-v2-error";
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { HrV2Events } from '../events/hr-v2-events';
import { safeCall, Result, AppError } from '@common/result';
import { SkillsMatrixRepository } from './skills-matrix.repository';

@Injectable()
export class SkillsMatrixService {
  private readonly logger = new Logger(SkillsMatrixService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: SkillsMatrixRepository,
  ) {}

  async getSkillCatalog(): Promise<Result<object, AppError>> {
    return this.repo.getSkillCatalog();
  }

  async getEmployeeSkills(employeeId: number) {
    return this.repo.getEmployeeSkills(employeeId);
  }

  async upsertSkillScore(dto: {
    employeeId: number;
    skillCode: string;
    currentLevel: number;
    assessedBy?: number;
  }) {
    const rows = await this.repo.upsertSkillScore(dto.employeeId, dto.skillCode, dto.currentLevel, dto.assessedBy);
    this.eventEmitter.emit(HrV2Events.SKILL_UPDATED, {
      employeeId: dto.employeeId,
      skillCode: dto.skillCode,
      currentLevel: dto.currentLevel,
    });
    return rows.data?.[0];
  }

  async getGapAnalysis(employeeId: number, positionId?: number) {
    return safeCall(async () => {
      const rows = await this.repo.getGapAnalysis(employeeId, positionId);
      const gapSkills = (Array.isArray(rows) ? rows : []).filter(r => parseInt(String((r as Record<string, unknown>)['gap'] ?? '0')) > 0);
      if (gapSkills.length > 0) {
        this.eventEmitter.emit(HrV2Events.SKILL_GAP_DETECTED, { employeeId, positionId, gapCount: gapSkills.length });
      }
      return { gapAnalysis: rows, totalGaps: gapSkills.length };
    });
  }

  async getTeamMatrix(departmentId: number) {
    return this.repo.getTeamMatrix(departmentId);
  }

  @Cron('0 9 1 1,4,7,10 *')
  async quarterlySkillReview() {
    try {
      const rows = await this.repo.getEmployeesNeedingAssessment();
      if (rows.ok && rows.data.length > 0) {
        this.eventEmitter.emit(HrV2Events.SKILL_GAP_DETECTED, {
          employeeId: 0,
          positionId: undefined,
          gapCount: rows.data.length,
          context: 'quarterly_review',
        });
        this.logger.warn(`Quarterly skill review: ${rows.data.length} employees need skill assessments`);
      }
    } catch (err) {
      this.logger.error('quarterlySkillReview error', errMsg(err));
    }
  }

  @OnEvent(HrV2Events.CERTIFICATE_EARNED)
  async onCertificateEarned(payload: { employeeId: number; skillCode?: string; level?: number }) {
    return safeCall(async () => {
      if (payload.skillCode) {
        await this.upsertSkillScore({
          employeeId: payload.employeeId,
          skillCode: payload.skillCode,
          currentLevel: payload.level || 3,
        });
        this.logger.log(`Auto-updated skill ${payload.skillCode} for employee ${payload.employeeId}`);
      }
    });
  }
}
