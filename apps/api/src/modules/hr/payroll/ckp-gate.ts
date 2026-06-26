/**
 * @module ckp-gate
 * @description ЦКП-gate (Egasi-qaror Q6 — QATTIQ 0). Kun bo'yicha `ckp_fact_values`
 *   yozuvi YO'Q **yoki** deadline o'tib hisobot topshirilmagan → o'sha kun oyligi 0.
 *
 *   Bu A11 vazifasi. Oylik formula (A7, `payroll.service.ts`) shu yerdagi
 *   `applyCkpGate` toza funksiyasini chaqirib, kun-bazasini darvozadan o'tkazadi:
 *
 *       baza × razryad-koeff × ЦКП% × stake   →   applyCkpGate(...) ⇒ 0 yoki to'liq.
 *
 *   FABRIKATSIYA TAQIQ (Q-40): bu fayl SOXTA qiymat yozmaydi — faqat jonli
 *   `ckp_fact_values` o'qiydi va darvoza qoidasini qo'llaydi. ЦКП fakt yo'q kun
 *   uchun (ko'pchilik hozir, jadval bo'sh) darvoza HALOL 0 qaytaradi — bu soxta
 *   emas, vizyon talabi (deadline o'tib hisobot yo'q → kun oyligi yo'q).
 *
 *   Fayl-izolyatsiya (Q-31): bu YANGI fayl; `payroll.service.ts` (A7) ga
 *   tegmaydi — u shu helperni import qiladi. Deadline-hisob `ckp-fact.service.ts`
 *   bilan IZCHIL (bir xil qoida: factDate ertangi-kun 00:00 UTC + deadlineHours).
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result, safeCall } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

/**
 * ЦКП-gate qarori uchun bir kunlik kirish (toza funksiya uchun — DB'siz).
 * @property hasFact      — o'sha kun shu karta uchun `ckp_fact_values` yozuvi bormi.
 * @property deadlineHours — karta `ckp_report_deadline_hours` (NULL → deadline qoidasi yo'q).
 * @property factDate     — ЦКП kuni (ISO 'YYYY-MM-DD').
 * @property submittedAt  — hisobot topshirilgan moment (yo'q bo'lsa null).
 */
export interface CkpGateDayInput {
  hasFact: boolean;
  deadlineHours: number | null;
  factDate: string;
  submittedAt: Date | null;
}

/**
 * Bir kunlik darvoza natijasi.
 * @property open    — kun oyligiga ruxsat (true) yoki to'silgan (false).
 * @property reason  — to'silsa sabab (gate audit/UI uchun).
 * @property factor  — kun-bazaga ko'paytiruvchi (0 = to'silgan, 1 = ochiq).
 * @property deadlineAt — hisoblangan deadline momenti (ISO) yoki null (qoida yo'q).
 */
export interface CkpGateDecision {
  open: boolean;
  reason: 'OK' | 'NO_FACT' | 'DEADLINE_PASSED';
  factor: 0 | 1;
  deadlineAt: string | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * `date`-ustun kalit-stringi (TZ-xavfsiz). node-postgres `date` ustunni LOKAL
 * yarim-tun `Date` qilib qaytaradi (masalan GMT+5 da '2026-06-01' → local 00:00).
 * `.toISOString()` ni ishlatib bo'lmaydi — u UTC ga surib, kunni 1 ga ORQAGA
 * siljitadi ('2026-05-31') → fakt-kun davr-kalitiga mos kelmaydi (gate noto'g'ri
 * NO_FACT beradi). Shuning uchun LOKAL kalendar komponentlaridan tuziladi —
 * bu saqlangan 'YYYY-MM-DD' kalendar sanasini aynan tiklaydi.
 */
function dateKey(v: unknown): string {
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v).split('T')[0];
}

/**
 * QATTIQ-0 darvoza koeffitsienti. Egasi-qaror Q6: deadline o'tib hisobot yo'q →
 * o'sha kun oyligi YO'Q. Bu darvoza ikkilik (0 yoki 1) — qisman to'lov yo'q.
 * Lokal konstanta (fayl-izolyatsiya: `business.constants.ts` ga tegmaymiz).
 */
export const CKP_GATE_BLOCKED_FACTOR = 0 as const;
export const CKP_GATE_OPEN_FACTOR = 1 as const;

/**
 * Bir kun uchun deadline momentini hisoblaydi — `ckp-fact.service.ts` bilan IZCHIL.
 * deadline = (factDate ertangi kun 00:00 UTC) + deadlineHours soat.
 * @returns ISO string, yoki null (deadlineHours yo'q/noto'g'ri/sana noto'g'ri → qoida yo'q).
 */
export function computeCkpDeadline(deadlineHours: number | null, factDate: string): string | null {
  const h = deadlineHours == null ? null : Number(deadlineHours);
  if (h == null || !Number.isFinite(h) || h <= 0) return null;
  const dayStart = new Date(`${factDate}T00:00:00.000Z`);
  if (Number.isNaN(dayStart.getTime())) return null;
  const deadline = new Date(dayStart.getTime() + MS_PER_DAY + h * MS_PER_HOUR);
  return deadline.toISOString();
}

/**
 * TOZA DARVOZA FUNKSIYASI (DB'siz, deterministik) — A7 oylik formula chaqiradi.
 *
 * Qoida (Q6 QATTIQ-0):
 *   1. Kun bo'yicha ЦКП fakt YO'Q (`hasFact=false`)               → BLOCKED (0).
 *   2. Fakt bor, deadline qoidasi bor, hisobot deadline'dan KEYIN  → BLOCKED (0).
 *   3. Fakt bor, hisobot deadline ICHIDA (yoki qoida yo'q)         → OPEN (1).
 *
 * `submittedAt` null bo'lsa-yu deadline qoidasi bo'lsa → topshirilmagan deb hisoblanadi
 * (deadline o'tgan = BLOCKED, agar `now` deadline'dan o'tgan bo'lsa). Bu yerda `submittedAt`
 * yo'qligi "hali topshirilmagan" → darvoza yopiq (fakt status'i 'submitted' bo'lsa
 * `submittedAt` to'ldiriladi; bo'sh bo'lsa fakt haqiqatan topshirilmagan).
 */
export function applyCkpGate(dayInput: CkpGateDayInput): CkpGateDecision {
  if (!dayInput.hasFact) {
    return { open: false, reason: 'NO_FACT', factor: CKP_GATE_BLOCKED_FACTOR, deadlineAt: null };
  }
  const deadlineAt = computeCkpDeadline(dayInput.deadlineHours, dayInput.factDate);
  // Deadline qoidasi yo'q (NULL soat) → fakt bor bo'lsa kun ochiq.
  if (deadlineAt == null) {
    return { open: true, reason: 'OK', factor: CKP_GATE_OPEN_FACTOR, deadlineAt: null };
  }
  // Deadline qoidasi bor, lekin topshirilmagan (submittedAt yo'q) → yopiq.
  if (dayInput.submittedAt == null) {
    return { open: false, reason: 'DEADLINE_PASSED', factor: CKP_GATE_BLOCKED_FACTOR, deadlineAt };
  }
  const passed = dayInput.submittedAt.getTime() > new Date(deadlineAt).getTime();
  return passed
    ? { open: false, reason: 'DEADLINE_PASSED', factor: CKP_GATE_BLOCKED_FACTOR, deadlineAt }
    : { open: true, reason: 'OK', factor: CKP_GATE_OPEN_FACTOR, deadlineAt };
}

/**
 * Kun-bazani darvozadan o'tkazadi (oylik formula uchun qulay yordamchi).
 * @param dayBaseAmount — o'sha kun uchun hisoblangan summa (baza × razryad × ЦКП% × stake).
 * @returns darvoza ochiq bo'lsa o'zgarmagan summa, yopiq bo'lsa 0.
 */
export function gateDayAmount(dayBaseAmount: number, dayInput: CkpGateDayInput): number {
  const amount = Number.isFinite(dayBaseAmount) ? dayBaseAmount : 0;
  const decision = applyCkpGate(dayInput);
  return amount * decision.factor;
}

/**
 * ЦКП-gate SERVISI — jonli `ckp_fact_values` o'qib, karta+kun bo'yicha darvozani aniqlaydi.
 * `payroll.service.ts` (A7) bunga kun-darvoza qarorini so'raydi; oylik kun-bazani gateAmount bilan ko'paytiradi.
 *
 * FABRIKATSIYA YO'Q: faqat real jadval o'qiydi (parametrlangan SQL). Fakt yo'q → halol 0.
 */
@Injectable()
export class CkpGateService {
  /**
   * Karta + kun bo'yicha darvoza qarori (jonli DB).
   * `ckp_fact_values` dan o'sha karta+sana yozuvini o'qiydi; karta `ckp_report_deadline_hours`
   * `org_departments` dan olinadi. Hech narsa topilmasa → BLOCKED (0).
   */
  async evaluateDay(cardId: number, factDate: string): Promise<Result<CkpGateDecision>> {
    return safeCall(async () => {
      const res = await runQuery<Row>(sql`
        SELECT f.id            AS fact_id,
               f.submitted_at  AS submitted_at,
               f.status        AS status,
               d.ckp_report_deadline_hours AS deadline_hours
        FROM org_departments d
        LEFT JOIN ckp_fact_values f
          ON f.card_id = d.id AND f.fact_date = ${factDate}::date
        WHERE d.id = ${cardId}
        LIMIT 1
      `);
      const row = res.rows[0] ?? null;
      // Karta umuman yo'q ham, fakt ham yo'q → fakt yo'q deb darvoza yopiladi.
      const hasFact = !!(row && row['fact_id'] != null);
      const deadlineHours =
        row && row['deadline_hours'] != null ? Number(row['deadline_hours']) : null;
      const submittedRaw = row ? row['submitted_at'] : null;
      const submittedAt =
        submittedRaw == null
          ? null
          : submittedRaw instanceof Date
            ? submittedRaw
            : new Date(String(submittedRaw));
      return applyCkpGate({
        hasFact,
        deadlineHours,
        factDate,
        submittedAt: submittedAt && !Number.isNaN(submittedAt.getTime()) ? submittedAt : null,
      });
    }, 'DB_ERROR');
  }

  /**
   * Karta uchun davr (oraliq) bo'yicha har kun darvoza qarori — oylik proratsiya uchun.
   * `from..to` (ISO) oralig'idagi HAR kun uchun qaror qaytaradi (fakt yo'q kunlar BLOCKED).
   * @returns kun→qaror massivi (sana ortib boradi).
   */
  async evaluatePeriod(
    cardId: number,
    from: string,
    to: string,
  ): Promise<Result<Array<{ factDate: string; decision: CkpGateDecision }>>> {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.getTime() > end.getTime()) {
      return Err({ code: 'INVALID_DATE_RANGE', message: `Noto'g'ri oraliq: ${from}..${to}` });
    }
    // Davr fakt-yozuvlarini bitta so'rovda olib, kun bo'yicha map qilamiz (N+1 yo'q).
    const factsR = await safeCall(async () => {
      const res = await runQuery<Row>(sql`
        SELECT f.fact_date AS fact_date, f.submitted_at AS submitted_at,
               d.ckp_report_deadline_hours AS deadline_hours
        FROM org_departments d
        LEFT JOIN ckp_fact_values f
          ON f.card_id = d.id AND f.fact_date BETWEEN ${from}::date AND ${to}::date
        WHERE d.id = ${cardId}
      `);
      return res.rows as Row[];
    }, 'DB_ERROR');
    if (!factsR.ok) return Err(factsR.error);

    // deadlineHours — kartaning yagona ustuni; birinchi qatordan olamiz (LEFT JOIN bo'lsa ham keladi).
    const deadlineHours =
      factsR.data[0] && factsR.data[0]['deadline_hours'] != null
        ? Number(factsR.data[0]['deadline_hours'])
        : null;
    const factByDate = new Map<string, Date | null>();
    for (const r of factsR.data) {
      const fd = r['fact_date'];
      if (fd == null) continue;
      const key = dateKey(fd);
      const subRaw = r['submitted_at'];
      const sub =
        subRaw == null ? null : subRaw instanceof Date ? subRaw : new Date(String(subRaw));
      factByDate.set(key, sub && !Number.isNaN(sub.getTime()) ? sub : null);
    }

    const out: Array<{ factDate: string; decision: CkpGateDecision }> = [];
    for (let t = start.getTime(); t <= end.getTime(); t += MS_PER_DAY) {
      const factDate = new Date(t).toISOString().split('T')[0];
      const hasFact = factByDate.has(factDate);
      const submittedAt = hasFact ? (factByDate.get(factDate) ?? null) : null;
      out.push({
        factDate,
        decision: applyCkpGate({ hasFact, deadlineHours, factDate, submittedAt }),
      });
    }
    return Ok(out);
  }
}
