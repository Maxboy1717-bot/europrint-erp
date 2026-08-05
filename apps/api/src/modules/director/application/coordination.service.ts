/**
 * @module coordination.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { safeCall, Result, AppError, Err } from '@common/result';
import { COORDINATION_REPO, type ICoordinationRepo } from '../domain/repositories/i-coordination.repo';
import { RasporyazhenieStatusChangedEvent } from '../domain/events/rasporyazhenie-status-changed.event';

const PRIVILEGED_ROLES = new Set(['admin', 'super_admin', 'director', 'ceo']);

@Injectable()
export class CoordinationService {
  constructor(
    @Inject(COORDINATION_REPO) private readonly repo: ICoordinationRepo,
    private readonly eventBus: EventBus,
  ) {}

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
    const updated = await this.repo.updateDokla(id, status);
    if (!updated.ok) return updated;
    // Batch 5 Item 11 — hisobot (dokla) 'resolved' bo'lsa, taklifidan avtomatik ko'rsatma
    // (rasporyazhenie) yaratiladi. Idempotent (source_dokla_id unique) — takror 'resolved' PATCH
    // ikkinchi rasp yaratmaydi. Xatoni yutamiz: avto-rasp dokla yangilanishini buzmasin.
    let autoRasp: unknown = null;
    if (status === 'resolved') {
      const rasp = await this.repo.createRaspFromDokla(id, userId);
      if (rasp.ok) autoRasp = rasp.data;
    }
    return { ok: true, data: { ...(updated.data as Record<string, unknown>), autoRasporyazhenie: autoRasp } };
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
    await this.repo.deleteDokla(id, userId);
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
    const done = await this.repo.markRaspDone(id, userId, note);
    // 04-coordination #4 — 'done' status: event -> OutboxEventWriter domain_events'ga yozadi,
    // RasporyazhenieStatusChangedListener COR bajarilish %ini qayta hisoblaydi.
    if (done.ok) {
      this.eventBus.publish(new RasporyazhenieStatusChangedEvent(id, 'done', userId));
    }
    return done;
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
    const updated = await this.repo.updateRasp(id, status);
    // 04-coordination #4 — status o'zgarganda event -> OutboxEventWriter domain_events'ga yozadi,
    // RasporyazhenieStatusChangedListener COR bajarilish %ini qayta hisoblaydi.
    if (updated.ok && status) {
      this.eventBus.publish(new RasporyazhenieStatusChangedEvent(id, status, userId));
    }
    return updated;
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
    await this.repo.deleteRasp(id, userId);
    return { ok: true, data: { message: "O'chirildi", deleted: String(id) } };
  }

  async updateCouncilWithAuth(
    id: number,
    userRole: string,
    chairpersonId: number | null,
    description: string | null,
    meetingSchedule: string | null,
    quorumNumerator: number | null,
    quorumDenominator: number | null,
  ): Promise<Result<object, AppError>> {
    if (!PRIVILEGED_ROLES.has(userRole))
      return Err({ code: 'FORBIDDEN', message: "Faqat administrator, direktor yoki CEO o'zgartira oladi" });
    const existing = await this.repo.getCouncilById(id);
    if (!existing.ok) return existing;
    if (!Array.isArray(existing.data) || !existing.data.length)
      return Err({ code: 'BAD_REQUEST', message: 'Kengash topilmadi' });
    return safeCall(() =>
      this.repo.updateCouncil(id, chairpersonId, description, meetingSchedule, quorumNumerator, quorumDenominator),
    );
  }

  async getBaskets(): Promise<Result<object, AppError>> {
    return this.repo.listBaskets();
  }

  async getCouncils() {
    return this.repo.listCouncils();
  }

  async getUsersForSelect() {
    return this.repo.listUsersForSelect();
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
