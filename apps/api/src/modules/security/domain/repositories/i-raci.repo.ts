/**
 * @module i-raci.repo
 * @description Domain repository interface for RACI tasks, assignments,
 *   crisis records, and risk assessments. Concrete implementation lives at
 *   `infrastructure/repositories/raci.repository.ts`.
 * @layer Domain (Security)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IRaciRepo {
  listTasks(status: string | null): Promise<Result<Row[]>>;
  createTask(
    title: string,
    description: string | null,
    responsibleId: number | null,
    accountableId: number | null,
    createdBy: number,
    deadline: string | null,
  ): Promise<Result<Row>>;
  getTaskAssignments(taskId: number): Promise<Result<Row[]>>;
  createAssignment(taskId: number, employeeId: number, role: string): Promise<Result<Row>>;
  deleteAssignment(id: number): Promise<Result<void>>;
  getStages(): Promise<Result<Row[]>>;
  listCrises(status: string | null): Promise<Result<Row[]>>;
  listAssessments(): Promise<Result<Row[]>>;
  createAssessment(
    title: string,
    riskLevel: string,
    description: string | null,
    likelihood: number,
    impact: number,
    assessorId: number,
  ): Promise<Result<Row>>;
}

export const RACI_REPO = Symbol('RACI_REPO');
