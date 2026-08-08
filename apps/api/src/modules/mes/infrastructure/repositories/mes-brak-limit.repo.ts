/**
 * @module mes-brak-limit.repo
 * @description 3.2-brak-ushlanma-zanjiri (Master-reja §5.3): MES/QC brak → payroll ushlanma zanjiri.
 *
 *   ⭐ C14 (docs/audit/decisions/09-qc.md "Brak ushlanma siyosati") hali 🔵 OCHIQ — aniq
 *   bepul-chegara% va jarima-formula EGASI tomonidan tasdiqlanmagan. Shu sabab bu yerda
 *   HECH QANDAY % yoki summa FABRIKATSIYA QILINMAYDI (Q-40/EGASI-DATA taqiq). Buning o'rniga
 *   mexanizm EGASI-KONFIGURATSIYA-LASH mumkin qilib qurilgan (fail-safe gate pattern —
 *   boshqa modullarda ishlatilgan xuddi shu naqsh, masalan work_centers.norma_m2_per_shift):
 *
 *     1) `work_centers.brak_limit_pct` NULL bo'lsa (hozirgi holat — hech kim to'ldirmagan)
 *        → checkBrakLimit() signal HAM, ushlanma HAM yaratmaydi (funksional emas, faqat
 *        DATA yo'qligi — egasi qiymat kiritganda avtomatik ishga tushadi).
 *     2) `work_centers.brak_limit_pct` to'ldirilgan bo'lsa (kelajakda egasi kiritadi) →
 *        sessiya brak% shu limitdan oshganda: (a) `notifications` ga signal yoziladi
 *        (mes-sos-escalation.repo.ts dagi notifyResponsible() ga o'xshash INSERT naqshi —
 *        `body` NOT NULL bug'i shu yerda TUZATILGAN holda, pastga qarang),
 *        (b) agar HR jarima-siyosati jadvalida ALLAQACHON mos qoida bo'lsa
 *        (`fine_rules.code='TECH_QUALITY_DEFECT'` — "QC tomonidan ko'rsatilgan brak",
 *        fine_amount=200000, egasi tomonidan ALLAQACHON seed qilingan) — shu qoidaga
 *        bog'lab `discipline_records` yozuvi yaratiladi (fine_rule_id FK), FIX summasi
 *        fine_rules.fine_amount'dan olinadi (hech qanday yangi % o'ylab topilmaydi).
 *        Agar mos fine_rule topilmasa — faqat signal yaratiladi, ushlanma yo'q (yana
 *        fail-safe: jarima-siyosati yo'q joyda pul yechilmaydi).
 *
 *   Ushlanma ko'rinishi: discipline_records.fine_amount → sumUnpaidBrakFinesByEmployee()
 *   orqali FinanceExtendedPayrollService.calculate()/aiCalculate() ichida
 *   payroll_calculations.other_deductions'ga qo'shiladi (qabul-mezoni: "ushlanma
 *   payroll_calculations'da ko'rinadi").
 */

import { Injectable, Logger } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { SYSTEM_USER_ID } from '@common/constants/app.constants';

type Row = Record<string, unknown>;

/** Brak-bilan bog'liq HR jarima-siyosati — DB-proof (2026-07-03, `_audit/q.cjs`): `fine_rules`
 *  jadvalida `category='tech'` 3 ta qoidani qamrab oladi (TECH_QUALITY_DEFECT/TECH_MACHINE_BREAK/
 *  TECH_NO_CLEANING) — faqat birinchisi "QC tomonidan ko'rsatilgan brak" (fine_amount=200000,
 *  egasi tomonidan ALLAQACHON seed qilingan, docs/migration/seed). Shu ANIQ kodga bog'lanadi —
 *  category bo'yicha emas (tasodifiy boshqa 'tech' qoidani tanlab qo'ymaslik uchun). Yangi qoida
 *  QO'SHILMAYDI (Q-35) — faqat MAVJUD siyosatga bog'lanadi (fabrikatsiya emas). */
const BRAK_FINE_RULE_CODE = 'TECH_QUALITY_DEFECT';

export interface BrakLimitCheckResult {
  /** Limit tekshirilganmi (false = work_centers.brak_limit_pct NULL — egasi-data yo'q, gate yopiq). */
  checked: boolean;
  limitPct: number | null;
  actualBrakPct: number | null;
  exceeded: boolean;
  notificationCreated: boolean;
  disciplineRecordId: number | null;
  fineRuleUsed: string | null;
}

@Injectable()
export class MesBrakLimitRepository {
  private readonly logger = new Logger(MesBrakLimitRepository.name);

  /**
   * Sessiyaning ishlab chiqarish-kartasi (work_center) brak-chegarasini o'qiydi.
   * Zanjir: production_sessions.equipment_id → equipment.id → equipment.work_center_id
   * → work_centers.brak_limit_pct (xuddi mes-sos-escalation.repo.ts dagi
   * work_centers.org_department_id zanjiri kabi — mavjud JOIN naqshi).
   */
  private async getWorkCenterBrakLimit(sessionId: number): Promise<{ workCenterId: number | null; limitPct: number | null } | null> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT wc.id AS work_center_id, wc.brak_limit_pct
        FROM production_sessions ps
        LEFT JOIN equipment eq ON eq.id = ps.equipment_id
        LEFT JOIN work_centers wc ON wc.id = eq.work_center_id
        WHERE ps.id = ${sessionId}
      `);
      const r = rows.rows[0] as Row | undefined;
      if (!r) return null;
      return {
        workCenterId: r.work_center_id != null ? Number(r.work_center_id) : null,
        limitPct: r.brak_limit_pct != null ? Number(r.brak_limit_pct) : null,
      };
    } catch (err) {
      this.logger.error(`getWorkCenterBrakLimit: ${(err as Error).message}`);
      return null;
    }
  }

  /** Sessiyaning joriy brak%'ini hisoblaydi: defect_quantity / GREATEST(actual_quantity, target_quantity). */
  private async getSessionBrakPct(sessionId: number): Promise<{ pct: number | null; workerId: number | null } | null> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT
          worker_id,
          COALESCE(defect_quantity, 0) AS defect_quantity,
          GREATEST(COALESCE(actual_quantity, 0), COALESCE(target_quantity, 0)) AS denom
        FROM production_sessions
        WHERE id = ${sessionId}
      `);
      const r = rows.rows[0] as Row | undefined;
      if (!r) return null;
      const denom = Number(r.denom ?? 0);
      const defectQty = Number(r.defect_quantity ?? 0);
      const workerId = r.worker_id != null ? Number(r.worker_id) : null;
      if (denom <= 0) return { pct: null, workerId }; // hali ishlab chiqarish miqdori yo'q — % hisoblab bo'lmaydi
      return { pct: Math.round((defectQty / denom) * 10000) / 100, workerId };
    } catch (err) {
      this.logger.error(`getSessionBrakPct: ${(err as Error).message}`);
      return null;
    }
  }

  /** worker_id (users.id) dan employees.id ni topadi (discipline_records.employee_id shu jadvalga ishora qiladi). */
  private async resolveEmployeeId(userId: number): Promise<number | null> {
    try {
      const rows = await runQuery<Row>(sql`SELECT id FROM employees WHERE user_id = ${userId} LIMIT 1`);
      const r = rows.rows[0] as Row | undefined;
      return r?.id != null ? Number(r.id) : null;
    } catch (err) {
      this.logger.error(`resolveEmployeeId: ${(err as Error).message}`);
      return null;
    }
  }

  /** Mavjud (egasi tomonidan allaqachon seed qilingan) brak-bog'liq HR jarima-qoidasini topadi. Yangisi YARATILMAYDI. */
  private async findExistingBrakFineRule(): Promise<{ id: number; code: string; fineAmount: number } | null> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT id, code, fine_amount
        FROM fine_rules
        WHERE code = ${BRAK_FINE_RULE_CODE} AND is_active = true
        LIMIT 1
      `);
      const r = rows.rows[0] as Row | undefined;
      if (!r) return null;
      return { id: Number(r.id), code: String(r.code), fineAmount: Number(r.fine_amount ?? 0) };
    } catch (err) {
      this.logger.error(`findExistingBrakFineRule: ${(err as Error).message}`);
      return null;
    }
  }

  /** Javobgar zanjiri: work_centers.org_department_id → org_departments.head_user_id (mavjud bo'lsa). NULL bo'lsa umumiy signal (user-siz). */
  private async resolveResponsibleUserId(workCenterId: number | null): Promise<number | null> {
    if (!workCenterId) return null;
    try {
      const rows = await runQuery<Row>(sql`
        SELECT d.head_user_id
        FROM work_centers wc
        JOIN org_departments d ON d.id = wc.org_department_id
        WHERE wc.id = ${workCenterId}
      `);
      const r = rows.rows[0] as Row | undefined;
      return r?.head_user_id != null ? Number(r.head_user_id) : null;
    } catch (err) {
      this.logger.error(`resolveResponsibleUserId: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * INSERT naqshi mes-sos-escalation.repo.ts notifyResponsible()ga o'xshaydi, lekin bitta farq
   * bilan: DB-proof (rolled-back tx, 2026-07-03) `notifications.body` NOT NULL ekanini va sos-
   * escalation naqshida bu ustun YOZILMAGANINI aniqladi (o'sha kod hozircha 0 marta muvaffaqiyatli
   * ishlagan — jonli jadvalda `type='mes_sos_escalation'` bo'yicha 0 qator). Bu yerda o'sha xato
   * TAKRORLANMAYDI — `body` ham to'ldiriladi (fayl faqat OZ ish doiramda, sos-escalation fayli
   * tegilmaydi — Q-31).
   */
  private async createSignal(userId: number | null, sessionId: number, brakPct: number, limitPct: number): Promise<boolean> {
    if (!userId) return false;
    try {
      const message = `Sessiya #${sessionId}: brak ${brakPct}% (limit ${limitPct}%)`;
      await runQuery(sql`
        INSERT INTO notifications (user_id, type, title, body, message, reference_id, reference_type, created_at)
        VALUES (
          ${userId}, 'mes_brak_limit_exceeded',
          'Brak limiti oshdi', ${message}, ${message},
          ${sessionId}, 'production_session', NOW()
        )
      `);
      return true;
    } catch (err) {
      this.logger.error(`createSignal: ${(err as Error).message}`);
      return false;
    }
  }

  /** Mavjud fine_rule'ga bog'langan discipline_records yozuvi — HR ning o'z jarima oqimi buni keyin ko'radi/tasdiqlaydi. */
  private async createDisciplineRecord(
    employeeId: number,
    sessionId: number,
    brakPct: number,
    limitPct: number,
    fineRule: { id: number; code: string; fineAmount: number },
  ): Promise<number | null> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO discipline_records
          (employee_id, violation_type, discipline_type, severity, violation_date, issued_date,
           description, reason, given_by, fine_amount, fine_rule_id, catalog_code, status)
        VALUES (
          ${employeeId}, 'quality_defect', 'tech', 'major', CURRENT_DATE, CURRENT_DATE,
          ${'Brak limiti oshdi: sessiya #' + sessionId + ', brak ' + brakPct + '% (limit ' + limitPct + '%)'},
          ${'MES avtomatik: brak_limit_pct oshgan (work_centers konfiguratsiyasi)'},
          ${SYSTEM_USER_ID}, ${fineRule.fineAmount}, ${fineRule.id}, ${fineRule.code}, 'open'
        )
        RETURNING id
      `);
      const r = rows.rows[0] as Row | undefined;
      return r?.id != null ? Number(r.id) : null;
    } catch (err) {
      this.logger.error(`createDisciplineRecord: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Asosiy darvoza: sessiya uchun brak% ni limit bilan solishtiradi. Limit NULL bo'lsa
   * (egasi-data hali yo'q) — HECH NARSA qilinmaydi (checked=false). Bir xil sessiya uchun
   * bir necha marta chaqirilsa ham xavfsiz — har safar joriy % qayta hisoblanadi va, agar
   * shu sessiya uchun ALLAQACHON ochiq brak-discipline yozuvi bo'lsa, takror yaratilmaydi.
   */
  async checkBrakLimit(sessionId: number): Promise<BrakLimitCheckResult> {
    const notChecked: BrakLimitCheckResult = {
      checked: false, limitPct: null, actualBrakPct: null, exceeded: false,
      notificationCreated: false, disciplineRecordId: null, fineRuleUsed: null,
    };

    const wc = await this.getWorkCenterBrakLimit(sessionId);
    if (!wc || wc.limitPct == null) return notChecked; // fail-safe: egasi-data yo'q → gate yopiq

    const brak = await this.getSessionBrakPct(sessionId);
    if (!brak || brak.pct == null) {
      return { ...notChecked, checked: true, limitPct: wc.limitPct };
    }

    const exceeded = brak.pct > wc.limitPct;
    if (!exceeded) {
      return { ...notChecked, checked: true, limitPct: wc.limitPct, actualBrakPct: brak.pct, exceeded: false };
    }

    // Idempotency guard: shu sessiya uchun avval yaratilgan ochiq brak-discipline bormi?
    const already = await runQuery<Row>(sql`
      SELECT id FROM discipline_records
      WHERE catalog_code IS NOT NULL
        AND reason ILIKE ${'%sessiya #' + sessionId + ',%'}
        AND status = 'open'
      LIMIT 1
    `).catch(() => ({ rows: [] as Row[] }));
    const existingId = (already.rows[0] as Row | undefined)?.id;

    const responsibleUserId = await this.resolveResponsibleUserId(wc.workCenterId);
    const notificationCreated = await this.createSignal(responsibleUserId, sessionId, brak.pct, wc.limitPct);

    if (existingId != null) {
      return {
        checked: true, limitPct: wc.limitPct, actualBrakPct: brak.pct, exceeded: true,
        notificationCreated, disciplineRecordId: Number(existingId), fineRuleUsed: null,
      };
    }

    // HR jarima-siyosati (fine_rules) allaqachon mavjudmi? Bo'lmasa ushlanma yaratilmaydi (faqat signal).
    const fineRule = await this.findExistingBrakFineRule();
    let disciplineRecordId: number | null = null;
    if (fineRule && brak.workerId != null) {
      const employeeId = await this.resolveEmployeeId(brak.workerId);
      if (employeeId != null) {
        disciplineRecordId = await this.createDisciplineRecord(employeeId, sessionId, brak.pct, wc.limitPct, fineRule);
      }
    }

    return {
      checked: true,
      limitPct: wc.limitPct,
      actualBrakPct: brak.pct,
      exceeded: true,
      notificationCreated,
      disciplineRecordId,
      fineRuleUsed: fineRule?.code ?? null,
    };
  }

  /**
   * Berilgan xodim uchun HAL QILINMAGAN ('open') brak-sabab discipline_records fine_amount
   * yig'indisi — FinanceExtendedPayrollService payroll_calculations.other_deductions'ga shu
   * summani qo'shadi (qabul-mezoni: "ushlanma payroll_calculations'da ko'rinadi"). Naqsh
   * bonus.repository.ts#sumApprovedByEmployeeAndPeriod bilan bir xil (COALESCE(SUM(...),0)).
   *
   * ⚠️ `userId` — bu `payroll_calculations.employee_id` bilan bir xil manba (`users.id`,
   * lib/db/src/schema/fi-payroll-calc.ts:105 → `references(() => users.id)`), lekin
   * `discipline_records.employee_id` `employees.id`ga ishora qiladi (Q-29 verify: ikki
   * jadval boshqa-boshqa kalit ishlatadi — shu sabab bu yerda `employees.user_id` orqali
   * ko'prik so'raladi, chaqiruvchi ikki xil ID'ni aralashtirmaydi).
   */
  async sumUnpaidBrakFinesByEmployee(userId: number): Promise<number> {
    try {
      const result = await runQuery<{ total: string | null }>(sql`
        SELECT COALESCE(SUM(dr.fine_amount), 0)::numeric AS total
        FROM discipline_records dr
        JOIN employees e ON e.id = dr.employee_id
        WHERE e.user_id = ${userId}
          AND dr.status = 'open'
          AND dr.catalog_code IS NOT NULL
          AND dr.discipline_type = 'tech'
      `);
      const total = result.rows[0]?.total;
      const n = total == null ? 0 : Number(total);
      return Number.isFinite(n) ? n : 0;
    } catch (err) {
      this.logger.error(`sumUnpaidBrakFinesByEmployee: ${(err as Error).message}`);
      return 0;
    }
  }
}
