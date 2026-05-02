/**
 * TZ-D07: PaginationDto — Canonical Zod pagination schema.
 *
 * Canonical manbaa — bu fayl pagination sxemasining yagona to'g'ri manbaasidir.
 * pagination.dto.ts bu fayldan re-export qiladi (backward compat uchun).
 *
 * z.coerce.number() ishlatiladi — query string ("20") ham, number (20) ham qabul qilinadi.
 *
 * Qoidalar:
 *   limit  ∈ [1, 100]   — default 20, boshqa qiymat → ZodError
 *   offset ∈ [0, ∞)     — default 0
 *   page   ∈ [1, ∞)     — ixtiyoriy; berilsa → offset = (page-1)*limit
 *
 * Xavfsizlik:
 *   - limit nol yoki manfiy raqam → TAQIQLANGAN (ZodError)
 *   - limit MAX_QUERY_LIMIT dan katta → TAQIQLANGAN (ZodError)
 *   - limit va offset integer sifatida kelishi shart
 */
import { z } from 'zod';

export const PaginationSchema = z.object({
  limit: z.coerce
    .number()
    .int({ message: "limit butun son bo'lishi kerak" })
    .min(1, "limit kamida 1 bo'lishi kerak")
    .max(100, "limit 100 dan oshmasligi kerak")
    .default(20),

  offset: z.coerce
    .number()
    .int({ message: "offset butun son bo'lishi kerak" })
    .min(0, "offset 0 dan kichik bo'lmasligi kerak")
    .default(0),

  page: z.coerce
    .number()
    .int({ message: "page butun son bo'lishi kerak" })
    .min(1, "page kamida 1 bo'lishi kerak")
    .optional(),
});

export type PaginationInput = z.input<typeof PaginationSchema>;
export type PaginationOutput = z.output<typeof PaginationSchema>;

/**
 * PaginationQuerySchema — PaginationSchema bilan bir xil (coerce orqali query string ham qo'llab quvvatlanadi).
 * Backward compat uchun saqlanmoqda.
 */
export const PaginationQuerySchema = PaginationSchema;

/**
 * resolveOffset — page berilgan bo'lsa offset ni hisoblaydi.
 */
export function resolveOffset(p: PaginationOutput): number {
  if (p.page !== undefined) {
    return (p.page - 1) * p.limit;
  }
  return p.offset;
}
