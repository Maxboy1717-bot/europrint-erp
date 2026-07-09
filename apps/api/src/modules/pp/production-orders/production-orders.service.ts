/**
 * @module production-orders.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Inject, Logger} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IPpProductionOrdersRepository, PP_PRODUCTION_ORDERS_REPO } from './i-pp-production-orders.repo';
import { safeCall, Result, AppError } from '@common/result';
import { PoStatus, canTransition } from '../domain/aggregates/production-order.aggregate';

@Injectable()
export class ProductionOrdersService {
  private readonly logger = new Logger(ProductionOrdersService.name);

  constructor(
    @Inject(PP_PRODUCTION_ORDERS_REPO) private readonly ppProductionOrdersRepo: IPpProductionOrdersRepository,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: Record<string, unknown> = {}): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const page = Number((query.page as number | undefined) ?? 1);
    const limit = Number((query.limit as number | undefined) ?? 10);
    const offset = (page - 1) * limit;
    const result = await this.ppProductionOrdersRepo.findAll(limit, offset);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    const { data, count: total } = result.data;
    return { data, pagination: { total, page, limit } };
  
    });}

  async findOne(id: number) {
    const result = await this.ppProductionOrdersRepo.findById(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    if (!result.data) throw new NotFoundException(await this.i18n.t('errors.productionOrderNotFoundWithId', { args: { id } }));
    return result.data;
  }

  async create(dto: Record<string, unknown>, createdBy?: number){
    return safeCall(async () => {
    const result = await this.ppProductionOrdersRepo.create(dto, createdBy);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  async update(id: number, dto: Record<string, unknown>){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppProductionOrdersRepo.update(id, dto);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;
  
    });}

  /**
   * Drive the production-order through its 9-status lifecycle (EP-PP-082).
   *
   * The canonical state machine lives in the ProductionOrder aggregate
   * (PoStatus + PO_STATUS_TRANSITIONS). Persistence MUST honour it: this method
   * is the single application-layer choke-point, so an arbitrary `status` string
   * can no longer be written straight to the row. We:
   *   1. validate `status` is a known PoStatus member,
   *   2. read the current persisted status (findOne),
   *   3. reject any hop the aggregate's transition table forbids (→ 400),
   *   4. persist only legal transitions.
   *
   * Additive / non-breaking (Q-46): the 6 legacy statuses remain valid members and
   * every previously-legal hop (planned→released_to_production→in_progress→completed)
   * is still allowed; the 3 new statuses (confirmed, in_qc, closed) + paused only
   * EXTEND the reachable set. The repo signature is unchanged.
   */
  async updateStatus(id: number, status: string, changedBy?: number, reason?: string){
    return safeCall(async () => {
    const target = await this.parsePoStatus(status);
    const current = await this.findOne(id);
    const from = await this.parsePoStatus(this.extractStatus(current));
    if (target !== from && !canTransition(from, target)) {
      // C.23 / XATO_KODLARI: typed business-rule code; maps to 400 via safeCall.
      throw new BadRequestException(await this.i18n.t('errors.ppInvalidTransition', { args: { from, target } }));
    }
    // T18-C3: pass the acting user so production_order_status_log records who
    // changed the status (kim/qachon/eski→yangi). EP-PP-082 #2/#39: `reason` is the
    // mandatory written justification, persisted on the audit row.
    const result = await this.ppProductionOrdersRepo.updateStatus(id, target, changedBy, reason);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return result.data;

    });}

  /** Coerce a raw status string into a canonical PoStatus member or reject it (400). */
  private async parsePoStatus(raw: unknown): Promise<PoStatus> {
    const values = Object.values(PoStatus) as string[];
    if (typeof raw === 'string' && values.includes(raw)) {
      return raw as PoStatus;
    }
    throw new BadRequestException(await this.i18n.t('errors.ppUnknownStatus', { args: { status: String(raw) } }));
  }

  /** Pull the `status` field off a persisted production-order row (defensively typed). */
  private extractStatus(row: unknown): string {
    if (row && typeof row === 'object' && 'status' in row) {
      return String((row as { status: unknown }).status ?? '');
    }
    return '';
  }

  /**
   * SB0237 (06-PP audit) — role-gated (owner/director, enforced by the controller's
   * @Roles) write-path for the ZARUR (isUrgent, EP-PP-097) and frozen-zone (isFrozen/
   * frozenUntil, EP-PP-025/061 no-preempt) flags. Kept out of the generic `update()`
   * so these authority-only fields can never be set through a lower-privileged PATCH.
   */
  async updateFlags(
    id: number,
    // VISION-3340 #23: reasonCodeId (pp_reason_codes.id) optionally tags the flag with a
    // structured reason. Threaded straight to the repo alongside the existing flags.
    flags: { isUrgent?: boolean; isFrozen?: boolean; frozenUntil?: Date | null; reasonCodeId?: number },
    // EP-PP-082 #2/#39: the acting user + mandatory written justification are threaded to
    // the repo so the freeze/urgent override is persisted as an order-queryable audit row.
    changedBy?: number,
    reason?: string,
  ) {
    return safeCall(async () => {
      await this.findOne(id);
      const result = await this.ppProductionOrdersRepo.updateFlags(id, flags, changedBy, reason);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }

  async remove(id: number){
    return safeCall(async () => {
    await this.findOne(id);
    const result = await this.ppProductionOrdersRepo.softDelete(id);
    if (!result.ok) throw new InternalServerErrorException(result.error);
    return { message: "O'chirildi" };

    });}

  /**
   * EP-PP-085 "Очеред" (Batch 5 Item 4) — read the operator-visible per-machine production queue,
   * ordered by the manual queue number (then urgent/priority as tiebreak).
   */
  async getQueue(workCenterId: string){
    return safeCall(async () => {
      const result = await this.ppProductionOrdersRepo.getQueueByWorkCenter(workCenterId);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { data: result.data };
    });
  }

  /**
   * Persist a drag-drop reorder of one machine's queue. `orderedIds` is the new top-to-bottom
   * order; queue_sequence is assigned 1..N accordingly (EP-PP-085).
   */
  async reorderQueue(workCenterId: string, orderedIds: number[]){
    return safeCall(async () => {
      const result = await this.ppProductionOrdersRepo.reorderQueue(workCenterId, orderedIds);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { data: result.data };
    });
  }

  /** EP-PP-110 (Batch 5 Item 14) — haftalik reja (weekStart = dushanba 'YYYY-MM-DD'). */
  async getWeeklyPlan(weekStart: string){
    return safeCall(async () => {
      const result = await this.ppProductionOrdersRepo.getWeeklyPlan(weekStart);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return { data: result.data, weekStart };
    });
  }

  /** Buyurtmani boshqa kunga/haftaga ko'chirish (haftalik ko'rinishdan). */
  async rescheduleOrder(id: number, plannedStartDate: string, plannedEndDate: string | null){
    return safeCall(async () => {
      const result = await this.ppProductionOrdersRepo.rescheduleOrder(id, plannedStartDate, plannedEndDate);
      if (!result.ok) throw new InternalServerErrorException(result.error);
      return result.data;
    });
  }
}
