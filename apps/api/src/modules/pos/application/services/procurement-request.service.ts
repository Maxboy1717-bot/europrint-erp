/**
 * @module procurement-request.service
 * @description P2P xarid so'rovi yaratish (Increment 1.3). So'rov header + qatorlar yoziladi va
 *   org-sxema bo'yicha tasdiq zanjiri (ProcurementApprovalChainService) `procurement_approvals`
 *   ga pending bosqichlar sifatida biriktiriladi. Returns Result<T>; never throws raw Errors.
 */
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { TashkentTimeService } from '@common/time';
import { dbRows } from '../../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { ProcurementApprovalChainService } from './procurement-approval-chain.service';
import { CcSpawnRequestedEvent } from '../../../communication-center/domain/events/cc-spawn-requested.event';

const _time = new TashkentTimeService();

export interface ProcurementItemInput {
  description: string;
  quantity?: number;
  unit?: string;
  estimatedPrice?: number;
  materialId?: number;
}
export interface CreateProcurementRequestInput {
  requesterEmployeeId: number;
  requesterUserId?: number;
  title: string;
  description?: string;
  vendorId?: number;
  paymentMode?: 'advance' | 'reimburse';
  targetWarehouseType?: string;
  neededByDate?: string;
  currency?: string;
  items: ProcurementItemInput[];
}

@Injectable()
export class ProcurementRequestService {
  private readonly logger = new Logger(ProcurementRequestService.name);
  constructor(
    private readonly approvalChain: ProcurementApprovalChainService,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Xarid so'rovi yaratadi: header + qatorlar + org-sxema tasdiq zanjiri (pending bosqichlar).
   * Status → 'pending_approval'.
   */
  async createRequest(
    input: CreateProcurementRequestInput,
    createdBy?: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      if (!input.title?.trim()) throw new BadRequestException('title majburiy');
      if (!input.items?.length) throw new BadRequestException('Kamida 1 qator (item) kerak');
      if (!input.requesterEmployeeId) throw new BadRequestException('requesterEmployeeId majburiy');

      // 1. So'rov beruvchining org-bo'limi (tasdiq zanjiri uchun)
      const deptR = await this.approvalChain.findEmployeeDepartment(input.requesterEmployeeId);
      const orgDepartmentId = deptR.ok ? deptR.data : null;

      // 2. Qatorlar + jami summa
      const lines = input.items.map((it) => {
        const qty = Number(it.quantity ?? 1);
        const price = Number(it.estimatedPrice ?? 0);
        return {
          materialId: it.materialId,
          description: it.description,
          quantity: qty,
          unit: it.unit ?? 'dona',
          estimatedPrice: price,
          lineTotal: qty * price,
        };
      });
      const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);

      // 3. Raqam (PR-YYYY-NNNNN)
      const cntR = await rawSql(sql`SELECT COUNT(*)::int AS c FROM procurement_requests`);
      const count = Number(dbRows(cntR)[0]?.['c'] ?? 0);
      const requestNumber = `PR-${_time.now().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      // 4. Header
      const reqR = await rawSql(sql`
        INSERT INTO procurement_requests
          (request_number, requester_employee_id, requester_user_id, org_department_id, title, description,
           vendor_id, total_amount, currency, payment_mode, target_warehouse_type, status, needed_by_date, created_by)
        VALUES (${requestNumber}, ${input.requesterEmployeeId}, ${input.requesterUserId ?? null}, ${orgDepartmentId},
           ${input.title}, ${input.description ?? null}, ${input.vendorId ?? null}, ${totalAmount},
           ${input.currency ?? 'UZS'}, ${input.paymentMode ?? 'advance'}, ${input.targetWarehouseType ?? null},
           'pending_approval', ${input.neededByDate ?? null}, ${createdBy ?? null})
        RETURNING id
      `);
      const requestId = Number(dbRows(reqR)[0]?.['id']);

      // 5. Qatorlar
      for (const l of lines) {
        await rawSql(sql`
          INSERT INTO procurement_request_items (request_id, material_id, description, quantity, unit, estimated_price, line_total)
          VALUES (${requestId}, ${l.materialId ?? null}, ${l.description}, ${l.quantity}, ${l.unit}, ${l.estimatedPrice}, ${l.lineTotal})
        `);
      }

      // 6. Org-sxema tasdiq zanjiri → procurement_approvals (pending)
      let chain: { approverUserId: number; orgDepartmentId: number; level: number | null; depth: number }[] = [];
      if (orgDepartmentId != null) {
        const chainR = await this.approvalChain.resolveChainFromDepartment(orgDepartmentId, input.requesterUserId);
        if (chainR.ok) chain = chainR.data;
      }
      for (const step of chain) {
        await rawSql(sql`
          INSERT INTO procurement_approvals (request_id, level, org_department_id, approver_user_id, status)
          VALUES (${requestId}, ${step.depth}, ${step.orgDepartmentId}, ${step.approverUserId}, 'pending')
        `);
      }
      if (chain.length === 0) {
        this.logger.warn(`[P2P] So'rov ${requestNumber}: tasdiq zanjiri bo'sh (org-bo'lim/head topilmadi)`);
      }

      // 7. Communication Center'da ko'rinish (N0 SUB-2): informational broadcast, HAQIQIY
      //    tasdiq qarori shu yerda emas — procurement_approvals zanjirida davom etadi
      //    (Q-39: mavjud approval-mexanizm o'zgarmaydi). CC'ning mavjud cc-event.listener
      //    ko'prigi bu draft'dan avtomatik Kanban karta yaratadi (related_type='cc_document').
      const ccSenderUserId = input.requesterUserId ?? createdBy;
      if (ccSenderUserId != null) {
        try {
          this.eventBus.publish(new CcSpawnRequestedEvent({
            templateCode: 'PROCUREMENT',
            senderUserId: ccSenderUserId,
            subject: `P2P xarid so'rovi: ${requestNumber} — ${input.title}`,
            body: input.description ?? `${lines.length} qator, jami ${totalAmount} ${input.currency ?? 'UZS'}`,
            priority: 'normal',
            metadata: { procurementRequestId: requestId, requestNumber, totalAmount },
          }));
        } catch (e) {
          this.logger.warn(`[P2P] So'rov ${requestNumber}: CC'ga chiqarish xatosi (ignore) — ${String(e)}`);
        }
      }

      return {
        id: requestId,
        requestNumber,
        status: 'pending_approval',
        totalAmount,
        orgDepartmentId,
        approvalSteps: chain.length,
        approvers: chain.map((c) => c.approverUserId),
      };
    });
  }

  /**
   * Tasdiq qadami (Increment 1.4): navbatdagi (eng past) pending bosqich rahbari approve/reject qiladi.
   * approve → keyingi bosqich pending qoladi (current_approval_level oshadi); oxirgi bo'lsa so'rov 'approved'.
   * reject → so'rov darhol 'rejected'. Faqat o'sha bosqichning belgilangan rahbari qaror qila oladi.
   */
  async decideApproval(
    requestId: number,
    approverUserId: number,
    action: 'approve' | 'reject',
    comments?: string,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const req = dbRows(await rawSql(sql`
        SELECT id, status, current_approval_level FROM procurement_requests WHERE id = ${requestId}
      `))[0];
      if (!req) throw new NotFoundException(`So'rov topilmadi: ${requestId}`);
      if (req['status'] !== 'pending_approval') {
        throw new BadRequestException(`So'rov tasdiq holatida emas (status=${req['status']})`);
      }

      // Navbatdagi pending bosqich (eng past level)
      const step = dbRows(await rawSql(sql`
        SELECT id, level, approver_user_id FROM procurement_approvals
        WHERE request_id = ${requestId} AND status = 'pending'
        ORDER BY level ASC LIMIT 1
      `))[0];
      if (!step) throw new BadRequestException("Pending tasdiq bosqichi yo'q");
      if (Number(step['approver_user_id']) !== approverUserId) {
        throw new ForbiddenException(`Bu bosqichni faqat user ${step['approver_user_id']} tasdiqlaydi`);
      }

      const level = Number(step['level']);
      await rawSql(sql`
        UPDATE procurement_approvals
        SET status = ${action === 'approve' ? 'approved' : 'rejected'}, decided_at = NOW(), comments = ${comments ?? null}
        WHERE id = ${Number(step['id'])}
      `);

      if (action === 'reject') {
        await rawSql(sql`UPDATE procurement_requests SET status = 'rejected', updated_at = NOW() WHERE id = ${requestId}`);
        return { requestId, decision: 'rejected', level, finalized: true, requestStatus: 'rejected' };
      }

      const remaining = Number(dbRows(await rawSql(sql`
        SELECT COUNT(*)::int AS c FROM procurement_approvals WHERE request_id = ${requestId} AND status = 'pending'
      `))[0]?.['c'] ?? 0);

      if (remaining === 0) {
        await rawSql(sql`UPDATE procurement_requests SET status = 'approved', updated_at = NOW() WHERE id = ${requestId}`);
        const advance = await this.createAdvanceIfNeeded(requestId, approverUserId);
        return { requestId, decision: 'approved', level, finalized: true, requestStatus: 'approved', advance };
      }
      await rawSql(sql`
        UPDATE procurement_requests SET current_approval_level = ${level + 1}, updated_at = NOW() WHERE id = ${requestId}
      `);
      return { requestId, decision: 'approved', level, finalized: false, requestStatus: 'pending_approval', remainingSteps: remaining };
    });
  }

  /**
   * Increment 1.5: so'rov to'liq tasdiqlanganda avans/podotchet yaratadi (paymentMode='advance').
   * Mavjud `advance_payments` jadvaliga (duplikat yo'q): employee_id = ichki ta'minotchi, settlement_status
   * = 'unsettled' (ochiq podotchet) — ombor kirimdan keyin (1.6) reconcile qilinadi. Reimburse → keyin.
   */
  private async createAdvanceIfNeeded(requestId: number, createdBy: number): Promise<Record<string, unknown> | null> {
    const r = dbRows(await rawSql(sql`
      SELECT request_number, requester_employee_id, vendor_id, total_amount, currency, payment_mode, title
      FROM procurement_requests WHERE id = ${requestId}
    `))[0];
    if (!r || r['payment_mode'] !== 'advance') return null;
    const ins = dbRows(await rawSql(sql`
      INSERT INTO advance_payments
        (request_number, vendor_id, employee_id, payment_type, amount, currency, purpose, status, settlement_status, request_date, created_by, created_at, updated_at)
      VALUES (${String(r['request_number'])}, ${r['vendor_id'] ?? null}, ${Number(r['requester_employee_id'])},
        'procurement_advance', ${Number(r['total_amount'])}, ${String(r['currency'] ?? 'UZS')},
        ${String(r['title'] ?? '')}, 'pending', 'unsettled', CURRENT_DATE, ${createdBy}, NOW(), NOW())
      RETURNING id, amount, currency, status, settlement_status
    `));
    const adv = ins[0] ?? null;
    if (adv) {
      this.logger.log(`[P2P] So'rov ${requestId} → avans/podotchet #${adv['id']} (${adv['amount']} ${adv['currency']}) ochildi`);
      await this.notifyCashierForDisbursement(requestId, String(r['request_number']), adv);
    }
    return adv;
  }

  /**
   * Increment N0 (Kanban tasdiq → cashier-hub ko'prigi, FAZA N0 SUB-3): so'rov to'liq
   * tasdiqlanib avans/podotchet ochilganda kassir/moliya menejerlariga bildirishnoma
   * yuboriladi — jismoniy pulni finance/cashier-hub.recordMovement orqali ochish uchun
   * (PIN + ochiq smena talab qiladi, shuning uchun bu yerdan avtomatik chaqirib
   * bo'lmaydi — owner #8 xavfsizlik qoidasi). Kassir bildirishnomani ko'rib, Cashier
   * Hub'ni ochib, shu so'rov raqamiga (reference) `advance` harakatini PIN bilan yozadi.
   */
  private async notifyCashierForDisbursement(
    requestId: number,
    requestNumber: string,
    adv: Record<string, unknown>,
  ): Promise<void> {
    try {
      const cashiers = dbRows(await rawSql(sql`
        SELECT id FROM users WHERE role IN ('cashier', 'finance_manager') AND is_active = true
      `));
      for (const c of cashiers) {
        await rawSql(sql`
          INSERT INTO notifications (user_id, type, title, body, is_read, created_at, reference_id, reference_type)
          VALUES (
            ${Number(c['id'])}, 'procurement_advance_ready',
            ${`Podotchet tayyor: ${requestNumber}`},
            ${`Xarid so'rovi ${requestNumber} tasdiqlandi — avans #${adv['id']} (${adv['amount']} ${adv['currency']}). Cashier Hub'da PIN bilan to'lovni yozing.`},
            false, NOW(), ${requestId}, 'procurement_request'
          )
        `);
      }
      if (cashiers.length === 0) {
        this.logger.warn(`[P2P] So'rov ${requestId}: kassir/moliya menejeri topilmadi — bildirishnoma yuborilmadi`);
      }
    } catch (e) {
      this.logger.warn(`[P2P] So'rov ${requestId}: kassirga bildirishnoma xatosi (ignore) — ${String(e)}`);
    }
  }

  /**
   * Increment 2.1 (§7.7): qabul qilingan tovar HAQIQIY tur-omborga PRIXOD bo'ladi.
   * Har qator uchun material kartochka topiladi/yaratiladi (material_cards) va warehouse_stock
   * (warehouse_id, material_id) qoldig'i oshiriladi (UPDATE→INSERT upsert) + material current_stock
   * yangilanadi. Maqsadli ombor: input.warehouseId (aniq integer) YOKI request.target_warehouse_type
   * bo'yicha o'sha turdagi 1-ombor. Ombor topilmasa — prixod o'tkazilmaydi (procurement baribir yopiladi).
   */
  private async enterWarehouseStock(
    requestId: number,
    warehouseIdInput: string | number | undefined,
    receivedBy?: number,
  ): Promise<Record<string, unknown> | null> {
    // 1. Maqsadli ombor (integer id) — aniq berilgan yoki tur bo'yicha
    let warehouseId: number | null = null;
    const parsed = Number(warehouseIdInput);
    if (warehouseIdInput != null && warehouseIdInput !== '' && Number.isFinite(parsed) && parsed > 0) {
      warehouseId = parsed;
    } else {
      const typeRow = dbRows(await rawSql(sql`SELECT target_warehouse_type FROM procurement_requests WHERE id = ${requestId}`))[0];
      const whType = typeRow?.['target_warehouse_type'] ? String(typeRow['target_warehouse_type']) : null;
      if (whType) {
        const wh = dbRows(await rawSql(sql`SELECT id FROM warehouses WHERE type = ${whType} ORDER BY id LIMIT 1`))[0];
        if (wh) warehouseId = Number(wh['id']);
      }
    }
    if (warehouseId == null) {
      this.logger.warn(`[P2P] So'rov ${requestId}: maqsadli ombor aniqlanmadi — prixod o'tkazilmadi`);
      return null;
    }
    const whInfo = dbRows(await rawSql(sql`SELECT id, code, name FROM warehouses WHERE id = ${warehouseId}`))[0];
    if (!whInfo) {
      this.logger.warn(`[P2P] So'rov ${requestId}: ombor #${warehouseId} topilmadi — prixod o'tkazilmadi`);
      return null;
    }

    // 2. Qatorlar bo'yicha prixod
    const items = dbRows(await rawSql(sql`
      SELECT id, material_id, description, quantity, unit FROM procurement_request_items WHERE request_id = ${requestId} ORDER BY id
    `));
    const lines: Record<string, unknown>[] = [];
    for (const it of items) {
      const qty = Number(it['quantity'] ?? 0);
      if (qty <= 0) continue;
      const unit = String(it['unit'] ?? 'dona');
      const description = String(it['description'] ?? '').trim() || `Item ${it['id']}`;

      // 2a. Material kartochka — qatordagi material_id, aks holda nom bo'yicha topish, aks holda yaratish
      let materialId = it['material_id'] != null ? Number(it['material_id']) : null;
      if (materialId == null) {
        const found = dbRows(await rawSql(sql`SELECT id FROM material_cards WHERE xom_ashyo = ${description} LIMIT 1`))[0];
        if (found) {
          materialId = Number(found['id']);
        } else {
          const kod = `AUTO-P${requestId}-I${Number(it['id'])}`;
          const created = dbRows(await rawSql(sql`
            INSERT INTO material_cards (kod, xom_ashyo, unit_of_measure, current_stock, is_active, created_at)
            VALUES (${kod}, ${description}, ${unit}, 0, true, NOW())
            RETURNING id
          `))[0];
          materialId = created?.['id'] != null ? Number(created['id']) : null;
        }
        if (materialId != null) {
          await rawSql(sql`UPDATE procurement_request_items SET material_id = ${materialId} WHERE id = ${Number(it['id'])}`);
        }
      }
      if (materialId == null) continue;

      // 2b. warehouse_stock upsert — mavjud qoldiqni oshir, bo'lmasa yangi qator
      const updated = dbRows(await rawSql(sql`
        UPDATE warehouse_stock
        SET quantity = quantity + ${qty}, available_quantity = available_quantity + ${qty}, last_updated_at = NOW()
        WHERE warehouse_id = ${warehouseId} AND material_id = ${materialId}
        RETURNING id
      `))[0];
      if (!updated) {
        await rawSql(sql`
          INSERT INTO warehouse_stock (warehouse_id, material_id, quantity, reserved_quantity, available_quantity)
          VALUES (${warehouseId}, ${materialId}, ${qty}, 0, ${qty})
        `);
      }

      // 2c. Material umumiy qoldig'i
      await rawSql(sql`UPDATE material_cards SET current_stock = COALESCE(current_stock, 0) + ${qty} WHERE id = ${materialId}`);

      // 2d. Harakat jurnali (material_movements — 'RECEIVE'), chiqim bilan simmetrik
      if (receivedBy != null) {
        await rawSql(sql`
          INSERT INTO material_movements (material_id, material_name, movement_type, quantity, unit, performed_by, reason)
          VALUES (${materialId}, ${description}, 'RECEIVE', ${qty}, ${unit}, ${receivedBy}, ${`Xarid qabul: PR#${requestId}`})
        `);
      }

      lines.push({ materialId, description, quantity: qty, unit });
    }

    this.logger.log(`[P2P] So'rov ${requestId} → ombor ${String(whInfo['code'])} (#${warehouseId}) ga ${lines.length} qator prixod`);
    return { warehouseId, warehouseCode: whInfo['code'], warehouseName: whInfo['name'], lineCount: lines.length, lines };
  }

  /**
   * Increment 1.6 + 2.1: tovar yetib kelganda — chek qabul + so'rov 'received' + podotchet RECONCILE
   * (advance_payments settlement_status='settled') + HAQIQIY ombor PRIXOD (§7.7: warehouse_stock +
   * material_cards). Chek ma'lumoti rules JSONB ga yoziladi.
   * Eslatma: pos-movement EXTERNAL_IN audit-ledger (FIFO/passport/barcode) FAZA 2 da qo'shimcha ulanadi.
   */
  async receiveProcurement(
    requestId: number,
    input: { chekNumber?: string; chekAmount?: number; warehouseId?: string | number; notes?: string },
    receivedBy?: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const req = dbRows(await rawSql(sql`
        SELECT id, request_number, status, total_amount, payment_mode FROM procurement_requests WHERE id = ${requestId}
      `))[0];
      if (!req) throw new NotFoundException(`So'rov topilmadi: ${requestId}`);
      if (req['status'] !== 'approved') {
        throw new BadRequestException(`So'rov 'approved' holatida emas (status=${req['status']})`);
      }
      const chekAmount = input.chekAmount != null ? Number(input.chekAmount) : Number(req['total_amount']);
      const chekInfo = JSON.stringify({
        chekNumber: input.chekNumber ?? null,
        chekAmount,
        receivedBy: receivedBy ?? null,
        warehouseId: input.warehouseId ?? null,
        notes: input.notes ?? null,
      });

      // 1. So'rov → received + chek ma'lumoti (rules JSONB)
      await rawSql(sql`
        UPDATE procurement_requests
        SET status = 'received', updated_at = NOW(), rules = COALESCE(rules, '{}'::jsonb) || ${chekInfo}::jsonb
        WHERE id = ${requestId}
      `);

      // 2. Podotchet RECONCILE — avans 'settled'
      const settled = dbRows(await rawSql(sql`
        UPDATE advance_payments
        SET settlement_status = 'settled', settled_amount = ${chekAmount}, status = 'disbursed', disbursed_at = NOW(), updated_at = NOW()
        WHERE request_number = ${String(req['request_number'])} AND settlement_status = 'unsettled'
        RETURNING id, settled_amount, settlement_status
      `))[0] ?? null;

      // 3. HAQIQIY ombor PRIXOD (§7.7): tovar tegishli tur-omborga kiradi (warehouse_stock + material_cards + jurnal)
      const warehouseEntry = await this.enterWarehouseStock(requestId, input.warehouseId, receivedBy);

      this.logger.log(`[P2P] So'rov ${req['request_number']} qabul qilindi (chek ${chekAmount}); podotchet ${settled ? 'yopildi #' + settled['id'] : "yo'q"}; prixod ${warehouseEntry ? warehouseEntry['lineCount'] + ' qator' : "yo'q"}`);
      return {
        requestId,
        requestNumber: req['request_number'],
        status: 'received',
        chekAmount,
        podotchetSettled: settled,
        warehouseEntry,
      };
    });
  }

  /** So'rovni qatorlari + tasdiq bosqichlari bilan qaytaradi. */
  async getRequest(id: number): Promise<Result<Record<string, unknown> | null, AppError>> {
    return safeCall(async () => {
      const req = dbRows(await rawSql(sql`SELECT * FROM procurement_requests WHERE id = ${id}`))[0] ?? null;
      if (!req) return null;
      const items = dbRows(await rawSql(sql`SELECT * FROM procurement_request_items WHERE request_id = ${id} ORDER BY id`));
      const approvals = dbRows(await rawSql(sql`SELECT * FROM procurement_approvals WHERE request_id = ${id} ORDER BY level`));
      return { ...req, items, approvals };
    });
  }

  /**
   * So'rovlar ro'yxati — status / requester / pendingApprover (navbatdagi tasdiqlovchi) filtri.
   * pendingApprover: shu user ENG PAST pending bosqich tasdiqlovchisi bo'lgan so'rovlar (uning worklist'i).
   */
  async listRequests(filter: {
    status?: string;
    requesterEmployeeId?: number;
    pendingApproverUserId?: number;
  }): Promise<Result<Record<string, unknown>[], AppError>> {
    return safeCall(async () => {
      const status = filter.status ?? null;
      const reqEmp = filter.requesterEmployeeId ?? null;
      const appr = filter.pendingApproverUserId ?? null;
      const rows = await rawSql(sql`
        SELECT pr.id, pr.request_number, pr.title, pr.status, pr.total_amount, pr.currency,
               pr.requester_employee_id, pr.created_at
        FROM procurement_requests pr
        WHERE (${status}::text IS NULL OR pr.status = ${status})
          AND (${reqEmp}::int IS NULL OR pr.requester_employee_id = ${reqEmp})
          AND (${appr}::int IS NULL OR EXISTS (
            SELECT 1 FROM procurement_approvals pa
            WHERE pa.request_id = pr.id AND pa.status = 'pending' AND pa.approver_user_id = ${appr}
              AND pa.level = (SELECT MIN(level) FROM procurement_approvals WHERE request_id = pr.id AND status = 'pending')
          ))
        ORDER BY pr.created_at DESC
        LIMIT 100
      `);
      return dbRows(rows);
    });
  }
}
