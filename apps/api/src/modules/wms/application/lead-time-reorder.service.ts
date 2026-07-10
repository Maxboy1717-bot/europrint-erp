/**
 * @module lead-time-reorder.service
 * @description 10-wms #39 — Lead-time o'zgarsa reorder point DARHOL qayta hisoblanadi
 *   (event-driven) va tanqislik bo'lsa PR loyihasi (draft) AVTO yaratiladi.
 *
 *   Oqim (changeLeadTime):
 *     1. inventory_policy'dan joriy siyosatni o'qi (safety_stock, reorder_point, lead_time).
 *     2. Qayta-hisob bazasi = saqlangan siyosatdan kelib chiqqan kunlik talab
 *        (queue ko'rsatmasi: "Recompute defaults to the 31 persisted policy rows";
 *        tashqi harakat-jadvaliga bog'liq emas):
 *          impliedDailyDemand = max(0, oldRop - safetyStock) / max(oldLead, 1)
 *     3. Yangi ROP = ceil(impliedDailyDemand * newLead + safetyStock) — RopService orqali.
 *     4. inventory_policy'ni yangila (lead_time_days, reorder_point, reorder_recomputed_at).
 *     5. Joriy zaxira yangi ROP'dan past bo'lsa VA 24 soatda ochiq PR yo'q bo'lsa —
 *        DRAFT (status='pending') PR yaratiladi. Draft = qo'lda tasdiq talab qiladi;
 *        avtomatik xarid-vakolati berilmaydi (egasi-sezgir qism default DRAFT bilan yechildi).
 * @layer Application Service (WMS)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, AppError, AppErr } from '@common/result';
import { LeadTimeReorderRepository } from '../infrastructure/repositories/lead-time-reorder.repository';
import { RopService } from '../domain/services/rop.service';

export interface AutoPrSummary {
  requisitionId: number;
  requisitionNumber: string;
  status: string;
  quantity: number;
}

export interface LeadTimeChangeResult {
  materialId: number;
  leadTimeDays: number;
  previousReorderPoint: number;
  newReorderPoint: number;
  currentStock: number;
  autoPr: AutoPrSummary | null;
}

@Injectable()
export class LeadTimeReorderService {
  constructor(
    private readonly repo: LeadTimeReorderRepository,
    private readonly ropSvc: RopService,
  ) {}

  async changeLeadTime(materialId: number, newLeadTimeDays: number): Promise<Result<LeadTimeChangeResult, AppError>> {
    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Err(AppErr('VALIDATION', 'materialId musbat butun son bo\'lishi kerak'));
    }
    if (!Number.isInteger(newLeadTimeDays) || newLeadTimeDays <= 0) {
      return Err(AppErr('VALIDATION', 'leadTimeDays musbat butun son bo\'lishi kerak'));
    }

    const policyRes = await this.repo.getPolicy(materialId);
    if (!policyRes.ok) return Err(policyRes.error);
    const policy = policyRes.data;
    if (!policy) return Err(AppErr('NOT_FOUND', `inventory_policy topilmadi: material #${materialId}`));

    // Qayta-hisob bazasi: saqlangan siyosatdan kelib chiqqan kunlik talab.
    const oldLead = Math.max(policy.leadTimeDays, 1);
    const impliedDailyDemand = Math.max(0, policy.reorderPoint - policy.safetyStock) / oldLead;

    const ropRes = this.ropSvc.calculate({
      avgDailyDemand: impliedDailyDemand,
      leadTimeDays: newLeadTimeDays,
      safetyStock: policy.safetyStock,
    });
    if (!ropRes.ok) return Err(ropRes.error);
    const newReorderPoint = ropRes.data.rop;

    const updRes = await this.repo.updatePolicyReorder(materialId, newLeadTimeDays, newReorderPoint);
    if (!updRes.ok) return Err(updRes.error);

    // Tanqislik bo'lsa — DRAFT PR (pending). Aks holda auto-PR yo'q.
    const stockRes = await this.repo.getStock(materialId);
    if (!stockRes.ok) return Err(stockRes.error);
    const stock = stockRes.data;
    const currentStock = stock ? stock.currentStock : 0;

    let autoPr: AutoPrSummary | null = null;
    if (stock && currentStock <= newReorderPoint) {
      const dedupRes = await this.repo.hasOpenRequisition(materialId);
      if (!dedupRes.ok) return Err(dedupRes.error);
      if (!dedupRes.data) {
        const shortfall = Math.ceil(newReorderPoint - currentStock);
        const orderQty = shortfall > 0 ? shortfall : 1;
        const title = `[AUTO_LEADTIME_REORDER] ${stock.name} #${materialId} — lead-time ${oldLead}->${newLeadTimeDays}d`;
        const notes = `Lead-time change recompute: rop ${policy.reorderPoint}->${newReorderPoint}, on_hand=${currentStock} <= rop=${newReorderPoint}. Draft — manual approval required.`;
        const prRes = await this.repo.createDraftRequisition(materialId, orderQty, title, notes);
        if (!prRes.ok) return Err(prRes.error);
        autoPr = prRes.data;
      }
    }

    return Ok({
      materialId,
      leadTimeDays: newLeadTimeDays,
      previousReorderPoint: policy.reorderPoint,
      newReorderPoint,
      currentStock,
      autoPr,
    });
  }
}
