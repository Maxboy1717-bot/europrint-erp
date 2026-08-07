/**
 * @module alert-thresholds.reader
 * @description `alert_thresholds` jadvalining umumiy (cross-module) READ yordamchisi.
 *
 * NIMA UCHUN BU FAYL BOR
 *   Audit 2026-08-07: `alert_thresholds` jadvali 2026-08-03 da yaratilgan va **4 ta default qator
 *   bilan to'ldirilgan** (`wms.lot_expiring`=7 kun, `wms.low_stock`=20%, `qc.failed`=5%,
 *   `mro.machine_stopped`=30 daqiqa), har birining tavsifida "CRUD orqali sozlanadi" deb yozilgan.
 *   Ammo `grep -rn "alert_thresholds" apps/api/src artifacts/erp-dashboard/src` **faqat sxema
 *   ta'rifini** qaytardi — service, controller, cron, FE bittasi ham yo'q. Ya'ni egasi qiymatni
 *   o'zgartirsa hech narsa o'zgarmasdi, chunki chegaralar iste'molchi kodda qotib yotardi.
 *
 *   Bu `alert_thresholds` ning juftidir: `notification_routing_rules` KIMGA yuborishni belgilaydi
 *   (allaqachon o'qiladi), bu jadval esa QACHON yuborishni. `alert_type` qiymatlari ikkala
 *   jadvalda ataylab bir xil.
 *
 * TO'RT CHEGARANING HOLATI (2026-08-07)
 *   ✅ `wms.lot_expiring` (7 kun) — ULANDI. `abc-aging-expiry.service.ts getExpiry()` `critical`
 *      statusini shu qiymatdan hisoblaydi; `StockAlertCron` aynan shu statusga tayanadi.
 *   ✅ `wms.low_stock` (20%) — ULANDI, qo'shimcha daraja sifatida. Batafsil sabab
 *      `pos-low-stock.job.ts` da (⚠️ ZIDDIYAT: kod 100% da ogohlantiradi, jadval 20% deydi).
 *   ⛔ `qc.failed` (5%) — ULANMADI, chunki ulash uchun joy YO'Q, ya'ni bu kod-kamchiligi emas:
 *      `qc-dispatch-conclusion.service.ts:_deriveVerdict()` verdikti **ikkilik** —
 *      `totalDefects === 0 ? 'passed' : 'failed'`. Foiz chegarasini kiritish "10 000 dan 1 ta
 *      nuqson butun buyurtmani yiqitadimi?" degan **biznes-savolga javob berish** demakdir, bu esa
 *      egasi qarori (Q-34), agent qarori emas. ⚠️ Bundan tashqari `business_settings` da
 *      `qc.lot_defect_fail_ratio` (0.05 = 5%) allaqachon bor — bir xil raqam ikki jadvalda,
 *      ikkalasi ham "5%". Qaysi biri kanonik ekanini egasi belgilashi kerak; uchinchi yo'l
 *      qo'shish holatni yomonlashtirardi.
 *   ⛔ `mro.machine_stopped` (30 daqiqa) — ULANMADI, chunki solishtiradigan **ma'lumot yo'q**:
 *      `MroMaintenanceStopEvent` faqat `{maintenanceId, machineId}` tashiydi, to'xtash
 *      davomiyligi umuman uzatilmaydi (`machine-stopped.listener.ts` dagi TODO ham shuni tan
 *      oladi). Avval `StopMachineCommand` davomiylikni olib yurishi kerak.
 *
 * QOIDALAR
 *   - Faqat READ (shared-read qoidasi — MODUL_SHARTNOMASI). Boshqaruv admin modulida.
 *   - HECH QACHON throw qilmaydi: qator yo'q / nofaol / DB xatosida fallback qaytaradi, ya'ni
 *     ishlayotgan ogohlantirish yo'llari buzilmaydi (Q-39 regressiyasiz migratsiya).
 *   - Fallback = iste'molchi kodda avval qotib turgan qiymat, shuning uchun jadval o'chsa ham
 *     xatti-harakat o'zgarmaydi.
 */

import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';

/** `alert_thresholds.alert_type` — `notification_routing_rules.event_type` bilan bir xil vocabulary. */
export const ALERT_TYPE = {
  WMS_LOT_EXPIRING: 'wms.lot_expiring',
  WMS_LOW_STOCK: 'wms.low_stock',
  QC_FAILED: 'qc.failed',
  MRO_MACHINE_STOPPED: 'mro.machine_stopped',
} as const;

/**
 * Faol chegara qiymati yoki fallback.
 *
 * ⚠️ Birlik (`unit`) tekshirilmaydi — u faqat CRUD ekranida ko'rsatish uchun. Chaqiruvchi qaysi
 * birlikda kutayotganini bilishi kerak (`wms.lot_expiring` kun, `wms.low_stock` foiz,
 * `qc.failed` foiz, `mro.machine_stopped` daqiqa).
 */
export async function getAlertThreshold(alertType: string, fallback: number): Promise<number> {
  try {
    const r = await runQuery<{ threshold_value: string | null; is_active: boolean }>(
      sql`SELECT threshold_value, is_active
          FROM alert_thresholds
          WHERE alert_type = ${alertType} AND deleted_at IS NULL
          LIMIT 1`,
    );
    const row = r.rows[0];
    if (!row || row.is_active === false || row.threshold_value == null) return fallback;
    const n = Number(row.threshold_value);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}
