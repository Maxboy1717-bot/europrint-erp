/**
 * @module i-coordination.repo
 * @description Domain repository interface for director coordination
 *   (dokla, rasporyazhenie, baskets, stats).
 *   Concrete implementation lives at
 *   `infrastructure/repositories/coordination.repository.ts`.
 * @layer Domain (Director)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface DoklaStats { sent: number; read: number; resolved: number; total: number }
export interface RaspStats { assigned: number; in_progress: number; done: number; overdue: number; total: number }

export interface ICoordinationRepo {
  createDokla(
    userId: number,
    councilLevel: string | null,
    title: string,
    problem: string | null,
    result_: string | null,
    proposal: string | null,
  ): Promise<Result<Row>>;
  listDokla(): Promise<Result<Row[]>>;
  getDoklaById(id: number): Promise<Result<unknown[]>>;
  updateDokla(id: number, status: string | null): Promise<Result<Row>>;
  deleteDokla(id: number, deletedBy?: number): Promise<void>;
  createRasporyazhenie(
    userId: number,
    toUser: string | null,
    task: string,
    deadline: string | null,
    priority: string,
  ): Promise<Result<Row>>;
  listRasporyazhenie(): Promise<Result<Row[]>>;
  getRaspById(id: number): Promise<Result<unknown[]>>;
  /**
   * Batch 5 Item 11 — dokla (hisobot) 'resolved' bo'lganda undan avtomatik rasporyazhenie
   * (ko'rsatma) yaratish. Idempotent: shu dokla uchun rasp allaqachon bo'lsa null qaytaradi.
   * task = dokla.proposal (bo'lmasa subject); to_user = dokla muallifi; auto_generated=true.
   */
  createRaspFromDokla(doklaId: number, issuedBy: number): Promise<Result<Row | null>>;
  markRaspDone(id: number, userId: number, note: string | null): Promise<Result<Row>>;
  updateRasp(id: number, status: string | null): Promise<Result<Row>>;
  deleteRasp(id: number, deletedBy?: number): Promise<void>;
  getStatsDokla(): Promise<Result<DoklaStats>>;
  listBaskets(): Promise<Result<Row[]>>;
  getStatsRasp(): Promise<Result<RaspStats>>;
  getCouncilById(id: number): Promise<Result<unknown[]>>;
  updateCouncil(
    id: number,
    chairpersonId: number | null,
    description: string | null,
    meetingSchedule: string | null,
    quorumNumerator: number | null,
    quorumDenominator: number | null,
  ): Promise<Result<Row>>;
  listCouncils(): Promise<Result<unknown[]>>;
  listUsersForSelect(): Promise<Result<unknown[]>>;
}

export const COORDINATION_REPO = Symbol('COORDINATION_REPO');
