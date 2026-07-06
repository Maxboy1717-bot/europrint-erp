/**
 * @module procurement-request.service
 * @description P2P xarid so'rovi yaratish (Increment 1.3). So'rov header + qatorlar yoziladi va
 *   org-sxema bo'yicha tasdiq zanjiri (ProcurementApprovalChainService) `procurement_approvals`
 *   ga pending bosqichlar sifatida biriktiriladi. Returns Result<T>; never throws raw Errors.
 */
import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EventBus } from '@nestjs/cqrs';
import { rawSql, db } from '@shared/db';
import { sql, and, eq } from 'drizzle-orm';
// KO'PRIK (podotchet yagona dunyo): kassir-hub `employee_debt` jadvali (fi-cashier-hub.ts).
// MODUL-CHEGARA: CashierPodotchetService IMPORT QILINMAYDI (finance-modul servisi, PIN+ochiq
// smena talab qiladi) — Drizzle jadval bilan to'g'ridan yozamiz (docs/MODUL_SHARTNOMASI shared-table).
import { employeeDebt } from '@workspace/db';
import { TashkentTimeService } from '@common/time';
import { dbRows } from '../../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
import { ProcurementApprovalChainService } from './procurement-approval-chain.service';
import { PosMovementService } from './pos-movement.service';
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
    // Karantin-yo'l: qabul EXTERNAL_IN pos_movement orqali (bir modul ichida — tsiklik bog' yo'q:
    // PosMovementService procurement servislariga bog'lanmaydi).
    private readonly posMovement: PosMovementService,
    private readonly i18n: I18nService,
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
      if (!input.title?.trim()) throw new BadRequestException(await this.i18n.t('errors.titleRequired'));
      if (!input.items?.length) throw new BadRequestException(await this.i18n.t('validation.atLeastOneItemRequired'));
      if (!input.requesterEmployeeId) throw new BadRequestException(await this.i18n.t('validation.requesterEmployeeIdRequired'));

      // 1. So'rov beruvchining org-bo'limi — tasdiq zanjiri uchun MAJBURIY.
      //    employee_org_departments (is_primary birinchi) dan avtomatik to'ldiriladi;
      //    NULL qolsa zanjir bo'sh bo'lib so'rov ABADIY pending qolardi (vizyon buzilishi) —
      //    shuning uchun topilmasa aniq Err qaytariladi.
      const deptR = await this.approvalChain.findEmployeeDepartment(input.requesterEmployeeId);
      if (!deptR.ok) throw new InternalServerErrorException(deptR.error.message);
      const orgDepartmentId = deptR.data;
      if (orgDepartmentId == null) {
        throw new BadRequestException(
          await this.i18n.t('errors.employeeNotAssignedToOrgDepartment', { args: { id: input.requesterEmployeeId } }),
        );
      }

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

      // 3+4. Raqam (PR-YYYY-NNNNN) + Header — C8.3 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06):
      // number generation is now advisory-locked (same pg_advisory_xact_lock pattern as
      // CcDocumentNumberService — the reference the audit points to as "does this right") and
      // the header INSERT retries with a fresh number on a residual unique-violation. Note:
      // procurement_requests.request_number ALREADY has a live UNIQUE constraint
      // (procurement_requests_request_number_key, verified live) — contrary to the audit's "no
      // UNIQUE" claim — so the pre-fix behavior was a crash on collision, not a silent duplicate;
      // this closes the "legitimate concurrent request fails instead of getting the next number" gap.
      const { requestId, requestNumber } = await this.insertRequestHeaderWithRetry(input, orgDepartmentId, totalAmount, createdBy);

      // 5. Qatorlar
      for (const l of lines) {
        await rawSql(sql`
          INSERT INTO procurement_request_items (request_id, material_id, description, quantity, unit, estimated_price, line_total)
          VALUES (${requestId}, ${l.materialId ?? null}, ${l.description}, ${l.quantity}, ${l.unit}, ${l.estimatedPrice}, ${l.lineTotal})
        `);
      }

      // 6. Org-sxema tasdiq zanjiri → procurement_approvals (pending).
      //    orgDepartmentId endi doim mavjud (yuqorida gate) — zanjir bo'shligi faqat
      //    head_user_id to'ldirilmagan bo'limlar holati (EGASI-DATA, warn qoladi).
      let chain: { approverUserId: number; orgDepartmentId: number; level: number | null; depth: number }[] = [];
      const chainR = await this.approvalChain.resolveChainFromDepartment(orgDepartmentId, input.requesterUserId);
      if (chainR.ok) chain = chainR.data;
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
   * C8.3: keyingi PR raqami — pg_advisory_xact_lock bilan yil bo'yicha kilitlanadi
   * (CcDocumentNumberService.nextSequence bilan bir xil naqsh). Ikkita bir vaqtdagi
   * so'rov endi navbatda kutadi, bir xil COUNT(*) o'qib bir xil raqamni hisoblamaydi.
   */
  private async generateRequestNumber(): Promise<string> {
    const year = _time.now().getFullYear();
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(abs(hashtext('procurement_request:' || ${year}::text)))`);
      const r = await tx.execute(sql`
        SELECT COUNT(*)::int AS c FROM procurement_requests WHERE EXTRACT(YEAR FROM created_at) = ${year}
      `);
      const count = Number((r.rows as { c: number }[] | undefined)?.[0]?.c ?? 0);
      return `PR-${year}-${String(count + 1).padStart(5, '0')}`;
    });
  }

  /**
   * C8.3: header INSERT — lock 'q Postgres tranzaksiya bilan tugaydi (raqam hisoblanishi bilan
   * haqiqiy INSERT orasida qisqa oyna qoladi), shuning uchun qoldiq 23505 to'qnashuvida (jonli
   * UNIQUE cheklovi procurement_requests_request_number_key ushlaydi) yangi raqam bilan qayta
   * urinadi — hech qachon jim duplikat yozmaydi, hech qachon cheksiz aylanmaydi.
   */
  private async insertRequestHeaderWithRetry(
    input: CreateProcurementRequestInput,
    orgDepartmentId: number,
    totalAmount: number,
    createdBy?: number,
  ): Promise<{ requestId: number; requestNumber: string }> {
    const MAX_NUMBER_RETRIES = 3;
    let requestNumber = await this.generateRequestNumber();
    for (let attempt = 1; attempt <= MAX_NUMBER_RETRIES; attempt++) {
      try {
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
        return { requestId: Number(dbRows(reqR)[0]?.['id']), requestNumber };
      } catch (e) {
        const pgCode = (e as { code?: string } | null)?.code;
        if (pgCode !== '23505' || attempt === MAX_NUMBER_RETRIES) throw e;
        this.logger.warn(`[P2P] PR raqami to'qnashuvi (${requestNumber}), qayta urinish ${attempt}/${MAX_NUMBER_RETRIES}`);
        requestNumber = await this.generateRequestNumber();
      }
    }
    throw new InternalServerErrorException("PR raqami ajratib bo'lmadi");
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
      if (!req) throw new NotFoundException(await this.i18n.t('errors.requestNotFound', { args: { id: requestId } }));
      if (req['status'] !== 'pending_approval') {
        throw new BadRequestException(await this.i18n.t('errors.requestNotInApprovalStatus', { args: { status: req['status'] } }));
      }

      // Navbatdagi pending bosqich (eng past level)
      const step = dbRows(await rawSql(sql`
        SELECT id, level, approver_user_id FROM procurement_approvals
        WHERE request_id = ${requestId} AND status = 'pending'
        ORDER BY level ASC LIMIT 1
      `))[0];
      if (!step) throw new BadRequestException(await this.i18n.t('errors.noPendingApprovalStep'));
      if (Number(step['approver_user_id']) !== approverUserId) {
        throw new ForbiddenException(await this.i18n.t('errors.onlyDesignatedApproverCanDecide', { args: { userId: step['approver_user_id'] } }));
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
   *
   * KO'PRIK (parallel podotchet dunyolar birlashuvi): avans bilan birga kassir-hub `employee_debt`
   * jadvaliga OPEN qator ochiladi (reference = so'rov raqami, UNIQUE→idempotent). Shu bilan xodim
   * profil qarzi ("har so'm hisobli") P2P avansini ham ko'radi; receiveProcurement settle bo'lganda
   * shu qator CLEARED bo'ladi. Eslatma: kassir hub'da issueAdvance bilan alohida bersa, u o'z
   * `ADV-<ref>` qatorini ochadi va uni advance-report tasdiq yo'li yopadi (bu ko'prikka to'siq emas).
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
    if (!adv) return null;

    const employeeDebtId = await this.openEmployeeDebtBridge(
      String(r['request_number']),
      Number(r['requester_employee_id']),
      Number(r['total_amount']),
      String(r['title'] ?? ''),
    );

    this.logger.log(`[P2P] So'rov ${requestId} → avans/podotchet #${adv['id']} (${adv['amount']} ${adv['currency']}) ochildi; employee_debt ${employeeDebtId != null ? '#' + employeeDebtId : "yo'q"}`);
    await this.notifyCashierForDisbursement(requestId, String(r['request_number']), adv);
    return { ...adv, employeeDebtId };
  }

  /**
   * KO'PRIK: employee_debt (kassir-hub, fi-cashier-hub.ts) ga OPEN qarz qatori.
   * reference = so'rov raqami (UNIQUE) → onConflictDoNothing = retry double-debt ochmaydi.
   * employee_debt_amount_chk (amount > 0) — 0 summali so'rovda qarz ochilmaydi (warn).
   * Ko'prik xatosi asosiy approve oqimini yiqitmaydi (advance_payments kanonik yozuv qoldi) —
   * lekin warn log + null bilan KO'RINADIGAN qilinadi.
   *
   * (3.4 HAR-SO'M-HISOBLI tsikl, 2026-07-03): bu — "xodim moddiy-buyum uchun pul oldi → ombor
   * kirim qilinganda qarz avto-CLEARED" ASOSIY YO'L. Yopilish nuqtasi pastda receiveProcurement()
   * §4 (employeeDebtClearedId) — reference=so'rov-raqami orqali deterministik moslashadi. KAS-1
   * to'g'ridan-to'g'ri issueAdvance() (`ADV-<ref>`) qarzlari BU KO'PRIKKA kirmaydi — ular
   * pos_movements bilan hech qachon bog'lanmaydi (sabab: cashier-podotchet.service.ts modul
   * izohida yozilgan — deterministik kalit yo'q, taxmin bilan yopish Q-40 xavfi).
   */
  private async openEmployeeDebtBridge(
    requestNumber: string,
    employeeId: number,
    amount: number,
    title: string,
  ): Promise<number | null> {
    if (!(amount > 0)) {
      this.logger.warn(`[P2P] ${requestNumber}: summa ${amount} ≤ 0 — employee_debt ochilmadi (amount_chk)`);
      return null;
    }
    try {
      const rows = await db
        .insert(employeeDebt)
        .values({
          employeeId,
          amount,
          reason: `P2P xarid avansi: ${requestNumber}${title ? ' — ' + title : ''}`,
          status: 'open',
          reference: requestNumber,
        })
        .onConflictDoNothing({ target: employeeDebt.reference })
        .returning({ id: employeeDebt.id });
      return rows[0]?.id ?? null;
    } catch (e) {
      this.logger.warn(`[P2P] ${requestNumber}: employee_debt ochish xatosi — ${String(e)}`);
      return null;
    }
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
   * KARANTIN-YO'L (vizyon, OMBOR-TERMINAL spec: "har tashqi kirim avval KARANTIN, QC gate BLOK"):
   * qabul EXTERNAL_IN pos_movement yaratadi (PosMovementService) — 'pos.movement.data.created'
   * handler'i (pos.events.ts) uni AVTO-KARANTIN qiladi: QC-HOLD omborga status='karantin',
   * barkod + QC bildirishnoma. HAQIQIY tur-ombor qoldig'i faqat QC tasdig'idan keyin, movement
   * lifecycle'i orqali yoziladi. ESKI to'g'ridan warehouse_stock/current_stock/material_movements
   * prixodi OLIB TASHLANDI (Q-46: vizyonga zid kod to'liq o'chirildi, chala emas).
   *
   * Material kartochka topish/yaratish SAQLANDI (movement qatorlari materialCardId talab qiladi) —
   * lekin qoldiq bu yerda OSHIRILMAYDI (yangi kartochka current_stock=0).
   * idempotencyKey = P2P-RCV-<requestId> → retry ikkinchi harakat ochmaydi.
   */
  private async createQuarantineInboundMovement(
    requestId: number,
    requestNumber: string,
    targetWarehouseType: string | null,
    warehouseIdInput: string | number | undefined,
    createdById: number,
  ): Promise<Record<string, unknown>> {
    // 1. Maqsadli ombor (QC dan keyingi manzil) — aniq berilgan yoki tur bo'yicha.
    //    Vizyon: karantin-yo'lsiz qabul YO'Q — ombor aniqlanmasa aniq Err (eski "warn+skip" o'rniga).
    let warehouseId: number | null = null;
    const parsed = Number(warehouseIdInput);
    if (warehouseIdInput != null && warehouseIdInput !== '' && Number.isFinite(parsed) && parsed > 0) {
      warehouseId = parsed;
    } else if (targetWarehouseType) {
      const wh = dbRows(await rawSql(sql`SELECT id FROM warehouses WHERE type = ${targetWarehouseType} ORDER BY id LIMIT 1`))[0];
      if (wh) warehouseId = Number(wh['id']);
    }
    if (warehouseId == null) {
      throw new BadRequestException(
        await this.i18n.t('errors.requestTargetWarehouseNotResolved', { args: { requestNumber } }),
      );
    }
    const whInfo = dbRows(await rawSql(sql`SELECT id, code, name FROM warehouses WHERE id = ${warehouseId}`))[0];
    if (!whInfo) throw new NotFoundException(await this.i18n.t('errors.requestWarehouseNotFound', { args: { requestNumber, warehouseId } }));

    // 2. Qatorlar → material kartochka (movement satrlari uchun; qoldiq yozilMAYdi)
    const items = dbRows(await rawSql(sql`
      SELECT id, material_id, description, quantity, unit, estimated_price
      FROM procurement_request_items WHERE request_id = ${requestId} ORDER BY id
    `));
    const lines: { materialCardId: number; quantity: number; unitPrice: number; notes: string; barcode: string }[] = [];
    for (const it of items) {
      const qty = Number(it['quantity'] ?? 0);
      if (qty <= 0) continue;
      const unit = String(it['unit'] ?? 'dona');
      const description = String(it['description'] ?? '').trim() || `Item ${it['id']}`;

      // 2a. Material kartochka — qatordagi material_id, aks holda nom bo'yicha topish, aks holda yaratish
      let materialId = it['material_id'] != null ? Number(it['material_id']) : null;
      let materialKod: string | null = null;
      if (materialId == null) {
        const found = dbRows(await rawSql(sql`SELECT id, kod FROM material_cards WHERE xom_ashyo = ${description} LIMIT 1`))[0];
        if (found) {
          materialId = Number(found['id']);
          materialKod = found['kod'] != null ? String(found['kod']) : null;
        } else {
          const kod = `AUTO-P${requestId}-I${Number(it['id'])}`;
          // current_stock=0 — qoldiq QC-gate'dan keyin movement lifecycle orqali yoziladi
          const created = dbRows(await rawSql(sql`
            INSERT INTO material_cards (kod, xom_ashyo, unit_of_measure, current_stock, is_active, created_at)
            VALUES (${kod}, ${description}, ${unit}, 0, true, NOW())
            RETURNING id
          `))[0];
          materialId = created?.['id'] != null ? Number(created['id']) : null;
          materialKod = kod;
        }
        if (materialId != null) {
          await rawSql(sql`UPDATE procurement_request_items SET material_id = ${materialId} WHERE id = ${Number(it['id'])}`);
        }
      }
      if (materialId == null) continue;

      // 2b. Qator barkodi (G1-1 barkod server-gate: EXTERNAL_IN qatorida barkod MAJBURIY —
      //     pos-movement.service.ts barkodsiz qatorni rad etadi). P2P dasturiy qabulda skan yo'q —
      //     qator barkodi = material kartochka KODI (identifikatsiya manbasi); AutoBarcodeService
      //     harakat yaratilgach har qator uchun CODE128 yorliq baribir generatsiya qiladi.
      if (materialKod == null) {
        const kodRow = dbRows(await rawSql(sql`SELECT kod FROM material_cards WHERE id = ${materialId}`))[0];
        materialKod = kodRow?.['kod'] != null ? String(kodRow['kod']) : null;
      }
      const barcode = (materialKod ?? '').trim() || `P2P-${requestId}-M${materialId}`;

      lines.push({
        materialCardId: materialId,
        quantity: qty,
        unitPrice: Number(it['estimated_price'] ?? 0),
        notes: description,
        barcode: barcode.slice(0, 100),
      });
    }
    if (lines.length === 0) {
      throw new BadRequestException(await this.i18n.t('errors.requestNoValidReceiptLines', { args: { requestNumber } }));
    }

    // 3. EXTERNAL_IN pos_movement — created-event avto-karantin + barkod + QC bildirishnoma qiladi.
    const mvR = await this.posMovement.createMovement({
      movementTypeCode: 'EXTERNAL_IN',
      toWarehouseId: String(warehouseId),
      lines,
      notes: `P2P xarid qabul: ${requestNumber} (PR#${requestId})`,
      idempotencyKey: `P2P-RCV-${requestId}`,
    }, createdById);
    if (!mvR.ok) throw new InternalServerErrorException(await this.i18n.t('errors.quarantineInboundMovementCreationFailed', { args: { message: mvR.error.message } }));
    const mv = mvR.data;

    this.logger.log(`[P2P] So'rov ${requestNumber} → EXTERNAL_IN ${mv.movementNumber} (#${mv.id}, ${lines.length} qator) — avto-karantin/QC-gate yo'li`);
    return {
      movementId: mv.id,
      movementNumber: mv.movementNumber,
      quarantine: true,
      targetWarehouseId: warehouseId,
      warehouseCode: whInfo['code'],
      warehouseName: whInfo['name'],
      lineCount: lines.length,
      lines,
    };
  }

  /**
   * Increment 1.6 (KARANTIN-YO'LGA QAYTA YOZILDI): tovar yetib kelganda —
   *   1) EXTERNAL_IN pos_movement (avto-karantin: QC-HOLD, barkod, QC bildirishnoma) — vizyon:
   *      "har tashqi kirim avval KARANTIN, QC gate BLOK". To'g'ridan warehouse_stock prixod YO'Q.
   *   2) chek qabul + so'rov 'received' (chek ma'lumoti rules JSONB);
   *   3) podotchet RECONCILE — advance_payments 'settled' + kassir-hub employee_debt CLEARED (ko'prik).
   * Harakat AVVAL yaratiladi (idempotent kalit bilan) — xato bo'lsa settle/status o'zgarmaydi.
   */
  async receiveProcurement(
    requestId: number,
    input: { chekNumber?: string; chekAmount?: number; warehouseId?: string | number; notes?: string },
    receivedBy?: number,
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return safeCall(async () => {
      const req = dbRows(await rawSql(sql`
        SELECT id, request_number, status, total_amount, payment_mode, target_warehouse_type,
               requester_user_id, created_by
        FROM procurement_requests WHERE id = ${requestId}
      `))[0];
      if (!req) throw new NotFoundException(await this.i18n.t('errors.requestNotFound', { args: { id: requestId } }));
      if (req['status'] !== 'approved') {
        throw new BadRequestException(await this.i18n.t('errors.requestNotApprovedStatus', { args: { status: req['status'] } }));
      }

      // 0. Harakat yaratuvchi — controller'lar doim user.id yuboradi; fallback so'rov egasidan
      const creatorId =
        receivedBy ??
        (req['created_by'] != null ? Number(req['created_by']) : null) ??
        (req['requester_user_id'] != null ? Number(req['requester_user_id']) : null);
      if (creatorId == null) {
        throw new BadRequestException(await this.i18n.t('errors.requestReceiverUserNotResolved', { args: { requestNumber: req['request_number'] } }));
      }

      // 1. KARANTIN-YO'L: EXTERNAL_IN pos_movement (avto-karantin QC-HOLD + QC gate).
      //    Xato bo'lsa shu yerda to'xtaydi — status/settle tegilmaydi (retry xavfsiz).
      const quarantineMovement = await this.createQuarantineInboundMovement(
        requestId,
        String(req['request_number']),
        req['target_warehouse_type'] ? String(req['target_warehouse_type']) : null,
        input.warehouseId,
        creatorId,
      );

      const chekAmount = input.chekAmount != null ? Number(input.chekAmount) : Number(req['total_amount']);
      const chekInfo = JSON.stringify({
        chekNumber: input.chekNumber ?? null,
        chekAmount,
        receivedBy: creatorId,
        warehouseId: input.warehouseId ?? null,
        notes: input.notes ?? null,
        quarantineMovementId: quarantineMovement['movementId'],
      });

      // 2. So'rov → received + chek ma'lumoti (rules JSONB)
      await rawSql(sql`
        UPDATE procurement_requests
        SET status = 'received', updated_at = NOW(), rules = COALESCE(rules, '{}'::jsonb) || ${chekInfo}::jsonb
        WHERE id = ${requestId}
      `);

      // 3. Podotchet RECONCILE — avans 'settled'
      const settled = dbRows(await rawSql(sql`
        UPDATE advance_payments
        SET settlement_status = 'settled', settled_amount = ${chekAmount}, status = 'disbursed', disbursed_at = NOW(), updated_at = NOW()
        WHERE request_number = ${String(req['request_number'])} AND settlement_status = 'unsettled'
        RETURNING id, settled_amount, settlement_status
      `))[0] ?? null;

      // 4. KO'PRIK: mos employee_debt (reference = so'rov raqami) CLEARED — kassir-hub
      //    podotchet dunyosi bilan sinxron. Faqat OPEN qator yopiladi (double-clear himoya).
      //    Ko'prik xatosi qabulni yiqitmaydi (settle kanonik bo'lib qoldi) — warn + null.
      let employeeDebtClearedId: number | null = null;
      try {
        const clearedRows = await db
          .update(employeeDebt)
          .set({ status: 'cleared', clearedAt: new Date() })
          .where(and(eq(employeeDebt.reference, String(req['request_number'])), eq(employeeDebt.status, 'open')))
          .returning({ id: employeeDebt.id });
        employeeDebtClearedId = clearedRows[0]?.id ?? null;
      } catch (e) {
        this.logger.warn(`[P2P] So'rov ${req['request_number']}: employee_debt yopish xatosi — ${String(e)}`);
      }

      this.logger.log(
        `[P2P] So'rov ${req['request_number']} qabul qilindi (chek ${chekAmount}); ` +
        `karantin-kirim ${quarantineMovement['movementNumber']}; ` +
        `podotchet ${settled ? 'yopildi #' + settled['id'] : "yo'q"}; ` +
        `employee_debt ${employeeDebtClearedId != null ? 'CLEARED #' + employeeDebtClearedId : "yo'q"}`,
      );
      return {
        requestId,
        requestNumber: req['request_number'],
        status: 'received',
        chekAmount,
        podotchetSettled: settled,
        employeeDebtClearedId,
        // Q-39: eski javob kaliti saqlanadi — endi karantin-harakat xulosasini ko'rsatadi
        warehouseEntry: quarantineMovement,
        quarantineMovement,
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
