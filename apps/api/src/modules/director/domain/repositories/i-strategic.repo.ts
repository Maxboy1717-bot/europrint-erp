/**
 * @module i-strategic.repo
 * @description Domain repository interface for director strategic categories,
 *   tasks and milestones. Concrete implementation lives at
 *   `infrastructure/repositories/strategic.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IStrategicRepo {
  listCategories(): Promise<Result<Row[]>>;
  createCategory(name: string, description: string | null, color: string): Promise<Result<Row>>;
  updateCategory(
    id: number,
    name: string | null,
    description: string | null,
    color: string | null,
  ): Promise<Result<Row>>;
  deleteCategory(id: number): Promise<void>;
  listTasks(
    status: string | null,
    categoryId: number | null,
    assigneeId: number | null,
    lim: number,
    off: number,
  ): Promise<Result<Row[]>>;
  getTask(id: number): Promise<Result<Row[]>>;
  createTask(
    title: string,
    categoryId: number | null,
    assigneeId: number | null,
    dueDate: string | null,
    priority: string,
    description: string | null,
    createdBy: number,
  ): Promise<Result<Row>>;
  updateTask(
    id: number,
    title: string | null,
    status: string | null,
    assigneeId: number | null,
    dueDate: string | null,
    priority: string | null,
    description: string | null,
    progress: number | null,
  ): Promise<Result<Row>>;
  deleteTask(id: number): Promise<void>;
  createMilestone(
    taskId: number,
    title: string,
    dueDate: string | null,
    description: string | null,
  ): Promise<Result<Row>>;
  updateMilestone(
    id: number,
    title: string | null,
    status: string | null,
    dueDate: string | null,
  ): Promise<Result<Row>>;
  getDashboardTasksStats(): Promise<Result<unknown[]>>;
  getDashboardCategories(): Promise<Result<unknown[]>>;
}

export const STRATEGIC_REPO = Symbol('STRATEGIC_REPO');
