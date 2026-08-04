/**
 * @module mes-shifts-stats.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { safeCall, Result, AppError } from '@common/result';
import { MesShiftsStatsRepository } from '../infrastructure/repositories/mes-shifts-stats.repo';
import { WmsGoodsIssuedEvent } from '@modules/wms/application/events/wms-goods-issued.event';

/**
 * Bo'lim-scope RBAC izolyatsiyasi (discovery-sweep gap, vizyon `docs/vision/_parts/08-mes.md`
 * #35 — "НО faqat o'z bo'limi (Ofset/Flekso) ma'lumotini ko'radi; boshqa uchun ruxsat").
 * Floor/bo'lim-darajali rollar (operator/worker — sex ishchisi; shift_supervisor — "НО",
 * vizyon itemning aynan o'zi) faqat o'z KARTA'siga (org_departments.id) tegishli mashina/
 * ish-markazi ma'lumotini ko'radi. production_manager/mro_manager/super_admin/admin/director
 * butun zavodni nazorat qiladigan rollar — cheklovsiz qoladi (mavjud MES_WRITE_ROLES/
 * MES_FLOOR_ROLES konstantalarida bu ikkalasi doim super_admin/director bilan bir qatorda
 * turadi — controller'dagi rol-guruhlash shu farqni allaqachon aks ettiradi).
 */
const MES_DEPT_SCOPED_ROLES = new Set(['operator', 'worker', 'shift_supervisor']);

/** Bo'lim biriktirilmagan scoped-foydalanuvchi uchun "hech narsaga mos kelmaydi" sentinel (fail-closed, Q-40). */
const NO_DEPARTMENT_SCOPE_SENTINEL = -1;

@Injectable()
export class MesShiftsStatsService {
  private readonly logger = new Logger(MesShiftsStatsService.name);

  constructor(
    private readonly repo: MesShiftsStatsRepository,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * `null`  — cheklovsiz (privileged rol; barcha bo'lim ko'rinadi).
   * raqam   — faqat shu org_department_id (KARTA) bilan bog'liq qatorlar.
   * `NO_DEPARTMENT_SCOPE_SENTINEL` (-1) — scoped rol, lekin viewer'ga hali karta biriktirilmagan
   *           (owner-DATA gap, kutilgan — get-oee.handler.ts'dagi "shop" darajasi bilan bir xil holat) →
   *           hech qanday haqiqiy org_department_id bilan mos kelmaydi, natija bo'sh (ko'rinmaydi emas,
   *           "hozircha hech narsa" — xavfsiz-yopiq).
   */
  async resolveVisibilityScope(user: { id: number; role?: string | null } | undefined): Promise<number | null> {
    const role = user?.role ? String(user.role).toLowerCase() : null;
    if (!role || !MES_DEPT_SCOPED_ROLES.has(role)) return null;
    if (!user?.id) return NO_DEPARTMENT_SCOPE_SENTINEL;
    const deptId = await this.repo.resolveViewerOrgDepartmentId(user.id);
    return deptId ?? NO_DEPARTMENT_SCOPE_SENTINEL;
  }

  async getCurrentShift(orgDepartmentId: number | null = null): Promise<Result<object | null, AppError>> {
    return safeCall(async () => this.repo.getCurrentShift(orgDepartmentId));
  }

  async shiftHandover(outgoing_supervisor: number, incoming_supervisor: number, notes: string | null, issues: string | null) {
    return safeCall(async () => this.repo.shiftHandover(outgoing_supervisor, incoming_supervisor, notes, issues));
  }

  async confirmShiftHandover(id: number, confirmerId: number, signatureData: string) {
    return safeCall(async () => this.repo.confirmShiftHandover(id, confirmerId, signatureData));
  }

  async closeShiftEvaluation(shift_id: number, supervisor_id: number | null, production_score: number, quality_score: number, safety_score: number, notes: string | null) {
    return safeCall(async () => this.repo.closeShiftEvaluation(shift_id, supervisor_id, production_score, quality_score, safety_score, notes));
  }

  async getShiftEvaluations(from: string | undefined, to: string | undefined, lim: number) {
    return safeCall(async () => this.repo.getShiftEvaluations(from, to, lim));
  }

  async getOee(orgDepartmentId: number | null = null) {
    return safeCall(async () => this.repo.getOee(orgDepartmentId));
  }

  async getStats(date?: string) {
    return safeCall(async () => {
      const d = date ?? _time.now().toISOString().split('T')[0];
      return this.repo.getStats(d);
    });
  }

  async getGamificationLeaderboard(period: string) {
    return safeCall(async () => {
      const validPeriods: Record<string, string> = { daily: '1 day', weekly: '7 days', monthly: '30 days' };
      const interval = validPeriods[period] ?? '7 days';
      return this.repo.getGamificationLeaderboard(interval);
    });
  }

  async getPapkaOrders(status: string | undefined, lim: number, off: number) {
    return safeCall(async () => this.repo.getPapkaOrders(status, lim, off));
  }

  async pauseSession(sid: number, reason: string | undefined) {
    return safeCall(async () => this.repo.pauseSession(sid, reason));
  }

  async resumeSession(sid: number) {
    return safeCall(async () => this.repo.resumeSession(sid));
  }

  async updateSessionQuantity(sid: number, produced_qty?: number, rejected_qty?: number) {
    return safeCall(async () => this.repo.updateSessionQuantity(sid, produced_qty, rejected_qty));
  }

  /**
   * P0 fix: after the repo INSERTs the audit row and (best-effort, guarded) decrements
   * warehouse_stock, publish the SAME `WmsGoodsIssuedEvent` every other WMS goods-issue
   * publishes (GoodsIssueHandler) — FIN's WmsGoodsIssuedListener is already registered app-wide
   * and posts the Dr COGS / Cr Inventory journal from it, so MES consumption reaches the
   * ledger via the existing golden-thread hop instead of a new, duplicated GL code path.
   * Only published when the repo actually decremented stock (`wms_stock_synced=true`) — a
   * skipped sync (no raw_material warehouse / insufficient stock, both logged by the repo)
   * must NOT post a COGS entry for a movement that never happened (Q-40).
   */
  async recordMaterialConsumption(session_id: number, material_id: number, quantity: number, batch_number: string | null, unit_of_measure: string | null = null) {
    return safeCall(async () => {
      const rows = await this.repo.recordMaterialConsumption(session_id, material_id, quantity, batch_number, unit_of_measure);
      const row = rows[0] as Record<string, unknown> | undefined;
      if (row?.wms_stock_synced === true) {
        try {
          this.eventBus.publish(
            new WmsGoodsIssuedEvent({
              materialId: material_id,
              amount: quantity,
              ppId: session_id,
              timestamp: _time.now(),
            }),
          );
        } catch (e) {
          // Best-effort (#22 listener resilience pattern): the stock decrement + consumption
          // row already committed; a GL-trigger publish failure must not fail the request.
          this.logger.error(
            `recordMaterialConsumption: WmsGoodsIssuedEvent publish failed for material=${material_id} session=${session_id}: ${(e as Error)?.message ?? String(e)}`,
          );
        }
      }
      return rows;
    });
  }

  async getProductionOrders(status: string | undefined, lim: number, off: number) {
    return safeCall(async () => this.repo.getProductionOrders(status, lim, off));
  }

  async getProductionOrderById(id: number) {
    return safeCall(async () => this.repo.getProductionOrderById(id));
  }

  async getShifts(from: string | undefined, to: string | undefined, lim: number) {
    return safeCall(async () => this.repo.getShifts(from, to, lim));
  }

  async getMaintenanceRequests(status: string | undefined, lim: number, off: number, orgDepartmentId: number | null = null) {
    return safeCall(async () => this.repo.getMaintenanceRequests(status, lim, off, orgDepartmentId));
  }

  async getWorkCenterNorms(orgDepartmentId: number | null = null) {
    return safeCall(async () => this.repo.getWorkCenterNorms(orgDepartmentId));
  }
}
