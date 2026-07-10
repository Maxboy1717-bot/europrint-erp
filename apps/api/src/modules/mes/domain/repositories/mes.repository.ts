/**
 * @module mes.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { ProductionSession, ChecklistStatus } from '../aggregates/production-session.aggregate';
import { Result, Ok, Err } from '@common/result';
import type { DrizzleExecutor } from '../../../../common/types/drizzle.types';
export type { DrizzleExecutor };

export interface IMesRepository {
  saveSession(session: ProductionSession, tx?: DrizzleExecutor): Promise<Result<number>>;
  getSession(id: number, tx?: DrizzleExecutor): Promise<Result<ProductionSession>>;
  getSessionByPpId(ppId: number): Promise<Result<ProductionSession>>;
  getAllSessionsByStatus(status: string): Promise<Result<ProductionSession[]>>;
  checkOperatorCertification(operatorId: number, courseId: number): Promise<Result<Record<string, unknown>>>;

  /**
   * 08-mes #4 — Sessiya BOSHLANGANDAGI norma versiyasini production_sessions.norma_version
   * ga snapshot qiladi (retro-buzilmaslik): started_at sanasida amalda bo'lgan
   * (material_norms.effective_date <= started_at) eng yuqori aktiv norma versiyasi.
   * Bir marta yozilgach qayta yozilmaydi (first-write-wins). Amaldagi norma yo'q bo'lsa
   * (0 qator yoki hammasi kelajakda amalga kiradi) NULL qaytadi — mavjud sessiyalar regressiyasiz.
   */
  snapshotNormaVersion(sessionId: number, tx?: DrizzleExecutor): Promise<Result<number | null>>;

  /**
   * Loads the TB-safety / smena-readiness checklist status for a session from the
   * canonical `setup_checklists` + `checklist_items` tables (required items only).
   * Feeds {@link ProductionSession.passChecklist} so the start gate is real (Q-40).
   */
  getChecklistStatus(sessionId: number, tx?: DrizzleExecutor): Promise<Result<ChecklistStatus>>;

  /**
   * Runs the supplied work inside a Drizzle transaction. Lets callers keep the
   * transaction boundary inside the repo layer (handlers don't need `db`).
   */
  withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>>;

  /**
   * PP#3 — bitta stanokda (work_center) parallel sessiya to'qnashuvini oldini olish.
   * Berilgan tranzaksiya ichida work_center bo'yicha advisory xact-lock oladi (parallel
   * start'lar shu stanok bo'yicha serializatsiya qilinadi; qulf tranzaksiya tugashida
   * avto-bo'shaydi), so'ng shu stanokda FAOL (in_progress/running) boshqa sessiyalar sonini
   * qaytaradi (joriy sessiya `excludeSessionId` chiqarib tashlanadi). > 0 => stanok band.
   */
  lockWorkCenterAndCountActive(
    workCenterId: number,
    excludeSessionId: number,
    tx: DrizzleExecutor,
  ): Promise<Result<number>>;
}

/**
 * DI token for IMesRepository — Symbol-based to avoid string-literal collisions.
 * (P2-20: replaces the legacy `'IMesRepository'` string token.)
 */
export const MES_REPO = Symbol('MES_REPO');

/**
 * DI token for the Drizzle Downtime repository.
 * (P2-20: replaces the legacy `'IDowntimeRepository'` string token.)
 */
export const DOWNTIME_REPO = Symbol('DOWNTIME_REPO');
