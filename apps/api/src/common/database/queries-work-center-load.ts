/**
 * @module queries-work-center-load
 * @description Ish markazlarining kutayotgan yuki — TOC (Theory of Constraints) hisobi uchun
 *   yagona so'rov manbai.
 *
 * NIMA UCHUN UMUMIY FAYL
 *   Audit 2026-08-07: loyihaning eng ko'p takrorlanuvchi nuqsoni — "bir joyda tuzatilib,
 *   qo'shnilari unutilgan" (3-tomonlama moslashtiruv 4 ta nusxada edi, karantin-eskalatsiya 2 ta).
 *   To'siq (bottleneck) hisobining ikkita iste'molchisi bor — `ProductionAgentService.detectBottleneck()`
 *   (eng yuklangan bitta markaz) va AI modulining `GET /ai/bottleneck/analysis` (to'liq reyting).
 *   Ikkinchisi shu paytgacha `{ bottlenecks: [] }` qattiq qaytarardi. So'rovni ko'chirib yozish
 *   o'sha naqshni yana takrorlash bo'lardi, shuning uchun ikkalasi shu yerdan o'qiydi.
 *
 * NIMA UCHUN `production_order_operations` VA `work_centers`
 *   λ (kelish tezligi) = kutayotgan operatsiyalarning rejalashtirilgan soati
 *   (`production_order_operations.planned_duration`), μ (xizmat tezligi) = markazning kunlik
 *   soati (`work_centers.hours_per_day`). Ikkala ustun ham jonli sxemada mavjud — hech narsa
 *   taxmin qilinmaydi (Q-40). ρ = λ/μ = kunlardagi zaxira; eng kattasi — to'siq.
 *
 *   ⚠️ Ilgari `ProductionAgentService` mavjud bo'lmagan `production_operations` jadvalidan
 *   o'qirdi va xatoni `.catch()` bilan yutgani uchun endpoint jimgina HAR DOIM "to'siq yo'q"
 *   deb yolg'on aytardi (`a65a33ad` da tuzatildi).
 */

import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { WorkCenterLoad } from '../../modules/pp/domain/services/scheduling.types';

/** Kutayotgan deb hisoblanadigan operatsiya statuslari. */
const PENDING_STATUSES = ['pending', 'queued', 'planned'] as const;

/** Markazda `hours_per_day` bo'sh/nol bo'lsa ishlatiladigan ish kuni uzunligi. */
const DEFAULT_HOURS_PER_DAY = 8;

export interface WorkCenterLoadRow extends WorkCenterLoad {
  /** Markaz nomi — hisobotda ID emas, o'qiladigan nom ko'rsatish uchun. */
  workCenterName: string;
  /** Shu markazda kutayotgan operatsiyalar soni (navbat uzunligi). */
  pendingOps: number;
}

/**
 * Faol ish markazlarining joriy yukini qaytaradi. Kutayotgan operatsiyasi yo'q markazlar
 * natijaga kirmaydi (JOIN). So'rov yiqilsa bo'sh massiv qaytadi — chaqiruvchi buni "ma'lumot
 * yo'q" deb talqin qilishi kerak, "to'siq yo'q" deb EMAS.
 */
export async function fetchWorkCenterLoads(): Promise<WorkCenterLoadRow[]> {
  const r = await runQuery<{
    work_center_id: string;
    work_center_name: string | null;
    pending_hours: string;
    hours_per_day: string;
    pending_ops: string;
  }>(sql`
    SELECT wc.id::text                                    AS work_center_id,
           wc.name                                        AS work_center_name,
           COALESCE(SUM(op.planned_duration), 0)::text    AS pending_hours,
           COALESCE(NULLIF(wc.hours_per_day, 0), ${DEFAULT_HOURS_PER_DAY})::text AS hours_per_day,
           COUNT(op.id)::text                             AS pending_ops
    FROM work_centers wc
    JOIN production_order_operations op
      ON op.work_center_id = wc.id
     AND op.status IN (${sql.join(PENDING_STATUSES.map((s) => sql`${s}`), sql`, `)})
    WHERE wc.is_active = true AND wc.deleted_at IS NULL
    GROUP BY wc.id, wc.name, wc.hours_per_day
  `).catch(() => ({ rows: [] as never[] }));

  return r.rows.map((row) => ({
    workCenterId: row.work_center_id,
    workCenterName: row.work_center_name ?? row.work_center_id,
    arrivalRate: Number(row.pending_hours) || 0,
    serviceRate: Number(row.hours_per_day) || DEFAULT_HOURS_PER_DAY,
    pendingOps: Number(row.pending_ops) || 0,
  })) as WorkCenterLoadRow[];
}
