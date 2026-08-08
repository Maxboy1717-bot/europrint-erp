/**
 * @module workflow-rules.service
 * @description Business-logic for horizontal workflow routing rules (GORIZONTAL
 *   approval chains). Thin delegation to WorkflowRulesRepository; returns Result<T>.
 * @layer Application (Director / Coordination)
 */

import { Injectable } from '@nestjs/common';
import { Result } from '@common/result';
import {
  WorkflowRulesRepository,
  WorkflowRuleInput,
  WorkflowRuleFilters,
} from '../infrastructure/repositories/workflow-rules.repository';

type Row = Record<string, unknown>;

@Injectable()
export class WorkflowRulesService {
  constructor(private readonly repo: WorkflowRulesRepository) {}

  list(filters: WorkflowRuleFilters): Promise<Result<Row[]>> {
    return this.repo.list(filters);
  }

  resolve(requestType: string, sourceDepartmentId: number): Promise<Result<Row[]>> {
    return this.repo.resolve(requestType, sourceDepartmentId);
  }

  getById(id: number): Promise<Result<Row | null>> {
    return this.repo.getById(id);
  }

  create(dto: WorkflowRuleInput): Promise<Result<Row>> {
    return this.repo.create(dto);
  }

  update(id: number, dto: WorkflowRuleInput): Promise<Result<Row | null>> {
    return this.repo.update(id, dto);
  }

  remove(id: number): Promise<Result<Row | null>> {
    return this.repo.softDelete(id);
  }
}
