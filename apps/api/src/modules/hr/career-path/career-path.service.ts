/**
 * @module career-path.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { safeCall, isErr, Result } from '@common/result';
import { HrV2Events } from '../events/hr-v2-events';
import { CareerPathRepository } from './career-path.repository';

import { MS_PER_DAY } from '@common/constants/app.constants';
@Injectable()
export class CareerPathService {
  private readonly logger = new Logger(CareerPathService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly repo: CareerPathRepository,
  ) {}

  async createPath(dto: {
    employeeId: number;
    currentPositionId: number;
    targetPositionId: number;
    createdBy: number;
    estimatedMonths?: number;
  }): Promise<Result<Record<string, unknown>>> {
    return this.repo.createPath({ ...dto, estimatedMonths: dto.estimatedMonths || 12 });
  }

  async updateProgress(pathId: number, stepId: number, isCompleted: boolean, completedBy: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const stepRow = await this.repo.updateStep(stepId, pathId, isCompleted);

      const progressR = await this.repo.getPathProgress(pathId);
      const { total, completed } = (progressR.ok ? progressR.data : { total: 0, completed: 0 }) as { total: number; completed: number };
      const skillsProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

      const path = await this.repo.getPath(pathId);
      if (path.ok && path.data) {
        const startDate = new Date(String(path.data.start_date || path.data.created_at));
        const estimatedMonths = Number(path.data.estimated_months) || 12;
        const monthsPassed = (Date.now() - startDate.getTime()) / (MS_PER_DAY * 30);
        const timeProgress = Math.min(Math.round((monthsPassed / estimatedMonths) * 100), 100);
        const overallProgress = Math.round((timeProgress + skillsProgress) / 2);

        await this.repo.updatePathProgress(pathId, overallProgress);

        this.eventEmitter.emit(HrV2Events.CAREER_PATH_PROGRESS, {
          pathId,
          employeeId: path.data.employee_id,
          overallProgress,
        });

        if (overallProgress >= 100) {
          await this.repo.markPathCompleted(pathId);
          this.eventEmitter.emit(HrV2Events.CAREER_PATH_COMPLETED, {
            pathId,
            employeeId: path.data.employee_id,
          });
        }
      }

      return stepRow;
    });
  }

  async getByEmployee(employeeId: number): Promise<Result<object[]>> {
    return safeCall(async () => {
      const pathRowsR = await this.repo.getByEmployee(employeeId);
      const pathRows = (pathRowsR.ok ? pathRowsR.data as Record<string, unknown>[] : []);
      for (const path of pathRows) {
        path['steps'] = await this.repo.getStepsByPath(path['id'] as number);
      }
      return pathRows;
    });
  }

  async addStep(pathId: number, dto: {
    stepOrder: number;
    title?: string;
    description?: string;
    requiredSkillCode?: string;
    estimatedDays?: number;
  }): Promise<Result<Record<string, unknown>>> {
    return safeCall(() => {
      const estMonths = Math.max(1, Math.round((dto.estimatedDays || 30) / 30));
      const skills = ([dto.requiredSkillCode, dto.description]).filter(Boolean).join('; ') || null;
      return this.repo.addStep(pathId, {
        stepOrder: dto.stepOrder,
        positionTitle: dto.title || null,
        skills,
        requiredMonths: estMonths,
      });
    });
  }

  async getAll(): Promise<Result<object[]>> {
    return this.repo.getAll();
  }

  async getDepartmentLadder(departmentId: number): Promise<Result<object[]>> {
    return this.repo.getDepartmentLadder(departmentId);
  }

  @Cron('0 9 1 * *')
  async monthlyCareerProgressCheck(): Promise<void> {
    const result = await safeCall(() => this.repo.getActivePathsForMonthlyCheck());
    if (isErr(result)) {
      this.logger.error({ err: result.error.message }, '[CareerPath] Monthly check failed');
      return;
    }
    const rows = result.data;
    for (const path of (rows.ok ? rows.data : [])) {
      const estimated = Number(path.estimated_months) || 12;
      const elapsed = safeNum(path.months_elapsed ?? '0');
      if (elapsed > estimated * 1.2 && (Number(path.progress_percent) || 0) < 80) {
        this.eventEmitter.emit(HrV2Events.CAREER_PATH_PROGRESS, {
          pathId: path.id,
          employeeId: path.employee_id,
          overallProgress: path.progress_percent || 0,
          alert: 'behind_schedule',
        });
      }
    }
    this.logger.log(`Monthly career check: ${(rows.ok ? (rows.data as Record<string, unknown>[]).length : 0)} active paths reviewed`);
  }
}
