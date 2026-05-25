/**
 * @module strategic.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { STRATEGIC_REPO, type IStrategicRepo } from '../domain/repositories/i-strategic.repo';

@Injectable()
export class StrategicService {
  constructor(@Inject(STRATEGIC_REPO) private readonly repo: IStrategicRepo) {}

  async listCategories(): Promise<Result<object, AppError>> {
    return this.repo.listCategories();
  }

  async createCategory(name: string, description: string | null, color: string) {
    return this.repo.createCategory(name, description, color);
  }

  async updateCategory(id: number, name: string | null, description: string | null, color: string | null) {
    return this.repo.updateCategory(id, name, description, color);
  }

  async deleteCategory(id: number) {
    return this.repo.deleteCategory(id);
  }

  async listTasks(status: string | null, categoryId: number | null, assigneeId: number | null, lim: number, off: number) {
    return this.repo.listTasks(status, categoryId, assigneeId, lim, off);
  }

  async getTask(id: number) {
    return this.repo.getTask(id);
  }

  async createTask(title: string, categoryId: number | null, assigneeId: number | null, dueDate: string | null, priority: string, description: string | null, createdBy: number) {
    return this.repo.createTask(title, categoryId, assigneeId, dueDate, priority, description, createdBy);
  }

  async updateTask(id: number, title: string | null, status: string | null, assigneeId: number | null, dueDate: string | null, priority: string | null, description: string | null, progress: number | null) {
    return this.repo.updateTask(id, title, status, assigneeId, dueDate, priority, description, progress);
  }

  async deleteTask(id: number) {
    return this.repo.deleteTask(id);
  }

  async createMilestone(taskId: number, title: string, dueDate: string | null, description: string | null) {
    return this.repo.createMilestone(taskId, title, dueDate, description);
  }

  async updateMilestone(id: number, title: string | null, status: string | null, dueDate: string | null) {
    return this.repo.updateMilestone(id, title, status, dueDate);
  }

  async getDashboard() {
    return safeCall(async () => {
      const [tasks, categories] = await Promise.all([
        this.repo.getDashboardTasksStats(),
        this.repo.getDashboardCategories(),
      ]);
      return { tasks, categories };
    });
  }
}
