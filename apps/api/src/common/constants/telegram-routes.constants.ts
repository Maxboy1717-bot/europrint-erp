/**
 * Telegram chat routing — ENV o'zgaruvchilaridan olinadi.
 * ConfigService orqali ishlatiladi (Qoida 7).
 */
export const TG_ROUTE_KEYS = {
  /** Sotuv menejerlari guruhi — yangi lead, deal */
  SALES_GROUP: 'TG_SALES_GROUP_CHAT_ID',
  /** Direktor — kunlik hisobot, kritik alert */
  DIRECTOR: 'TG_DIRECTOR_CHAT_ID',
  /** Texnolog — checkpoint, BOM, routing */
  TECHNOLOGIST: 'TG_TECHNOLOGIST_CHAT_ID',
  /** Moliya — avans, payment, GL alert */
  FINANCE: 'TG_FINANCE_CHAT_ID',
  /** Ishlab chiqarish boshlig'i — PP, MES */
  PRODUCTION: 'TG_PRODUCTION_CHAT_ID',
  /** Ombor boshlig'i — WMS, low stock */
  WAREHOUSE: 'TG_WAREHOUSE_CHAT_ID',
  /** Sifat nazorati — QC fail, lab test */
  QC: 'TG_QC_CHAT_ID',
  /** HR — ABC, kech kelish, sertifikat */
  HR: 'TG_HR_CHAT_ID',
  /** Texnik xizmat — MRO, sensor anomaliya */
  MRO: 'TG_MRO_CHAT_ID',
} as const;

export type TgRouteKey = (typeof TG_ROUTE_KEYS)[keyof typeof TG_ROUTE_KEYS];
