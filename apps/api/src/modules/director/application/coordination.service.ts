/**
 * @module coordination.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err } from '@common/result';
import { COORDINATION_REPO, type ICoordinationRepo } from '../domain/repositories/i-coordination.repo';

const PRIVILEGED_ROLES = new Set(['admin', 'super_admin', 'director', 'ceo']);

@Injectable()
export class CoordinationService {
  constructor(@Inject(COORDINATION_REPO) private readonly repo: ICoordinationRepo) {}

  async createDoklaWithValidation(
    userId: number,
    body: Record<string, unknown>,
  ): Promise<Result<object, AppError>> {
    const { title, subject, content, council_level, problem, result: result_, proposal } = body;
    const resolvedTitle = (title as string) ?? (subject as string);
    if (!resolvedTitle) return Err({ code: 'BAD_REQUEST', message: 'title yoki subject majburiy' });
    return safeCall(() =>
      this.repo.createDokla(
        userId,
        (council_level as string) ?? null,
        resolvedTitle,
        (problem as string) ?? (content as string) ?? null,
        (result_ as string) ?? null,
        (proposal as string) ?? null,
      ),
    );
  }

  async listDokla() {
    return this.repo.listDokla();
  }

  async updateDoklaWithAuth(
    id: number,
    userId: number,
    userRole: string,
    status: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getDoklaById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (String(record.from_user_id) !== String(userId) && !PRIVILEGED_ROLES.has(userRole))
      return Err({ code: 'FORBIDDEN', message: "Faqat muallif yoki administrator o'zgartira oladi" });
    return this.repo.updateDokla(id, status);
  }

  async deleteDoklaWithAuth(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getDoklaById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (String(record.from_user_id) !== String(userId) && !PRIVILEGED_ROLES.has(userRole))
      return Err({ code: 'FORBIDDEN', message: "Faqat muallif yoki administrator o'chira oladi" });
    await this.repo.deleteDokla(id);
    return { ok: true, data: { message: "O'chirildi", deleted: String(id) } };
  }

  async createRaspWithValidation(
    userId: number,
    body: Record<string, unknown>,
  ): Promise<Result<object, AppError>> {
    const { title, task: taskAlias, description, deadline, assignee_id, to_user, priority } = body;
    const task = (title as string) ?? (taskAlias as string) ?? (description as string);
    if (!task) return Err({ code: 'BAD_REQUEST', message: 'title yoki task majburiy' });
    const toUser = (to_user as string) ?? (assignee_id ? String(assignee_id) : null);
    return safeCall(() =>
      this.repo.createRasporyazhenie(userId, toUser, task, (deadline as string) ?? null, (priority as string) ?? 'normal'),
    );
  }

  async listRasporyazhenie() {
    return this.repo.listRasporyazhenie();
  }

  async markRaspDoneWithAuth(
    id: number,
    userId: number,
    userRole: string,
    note: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getRaspById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    const isAssignee = String(record.to_user) === String(userId);
    const isIssuer = String(record.from_user_id) === String(userId);
    if (!isAssignee && !isIssuer && !PRIVILEGED_ROLES.has(userRole))
      return Err({ code: 'FORBIDDEN', message: "Faqat bajaruvchi, beruvchi yoki administrator bajarildi deb belgilashi mumkin" });
    return this.repo.markRaspDone(id, userId, note);
  }

  async updateRaspWithAuth(
    id: number,
    userId: number,
    userRole: string,
    status: string | null,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getRaspById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (String(record.from_user_id) !== String(userId) && !PRIVILEGED_ROLES.has(userRole))
      return Err({ code: 'FORBIDDEN', message: "Faqat beruvchi yoki administrator o'zgartira oladi" });
    return this.repo.updateRasp(id, status);
  }

  async deleteRaspWithAuth(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<Result<object, AppError>> {
    const existing = await this.repo.getRaspById(id);
    if (!existing.ok) return existing;
    if (!existing.data.length) return Err({ code: 'BAD_REQUEST', message: 'Topilmadi' });
    const record = existing.data[0] as Record<string, unknown>;
    if (String(record.from_user_id) !== String(userId) && !PRIVILEGED_ROLES.has(userRole))
      return Err({ code: 'FORBIDDEN', message: "Faqat beruvchi yoki administrator o'chira oladi" });
    await this.repo.deleteRasp(id);
    return { ok: true, data: { message: "O'chirildi", deleted: String(id) } };
  }

  async getBaskets(): Promise<Result<object, AppError>> {
    return safeCall(async () => this.repo.listBaskets());
  }

  async getStats() {
    return safeCall(async () => {
      const [doklaResult, raspResult] = await Promise.all([
        this.repo.getStatsDokla(),
        this.repo.getStatsRasp(),
      ]);
      return {
        dokla: doklaResult.ok
          ? doklaResult.data
          : { total: 0, sent: 0, read: 0, resolved: 0 },
        rasporyazhenie: raspResult.ok
          ? raspResult.data
          : { total: 0, assigned: 0, in_progress: 0, done: 0, overdue: 0 },
      };
    });
  }
}
