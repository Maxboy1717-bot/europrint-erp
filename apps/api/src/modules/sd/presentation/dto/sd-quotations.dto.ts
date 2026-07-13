/**
 * @module sd-quotations.dto
 * @description DTO + Zod schema definition. Zod schema validates request bodies; DTO type is inferred via z.infer.
 */

import { z } from 'zod';

export const SdCreateQuotationSchema = z.object({
  customer_id:    z.coerce.number().int().positive().optional(),
  valid_until:    z.string().optional(),
  discount:       z.coerce.number().min(0).max(100).optional(),
  payment_terms:  z.string().optional(),
  notes:          z.string().optional(),
  items:          z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity:   z.coerce.number().positive(),
    price:      z.coerce.number().positive().optional(),
    // EP-SD-101 (vision 06-sd #101): per-line printing method (offset/flexo). Optional — the
    // AI recommendation from calculate-price fills the gap when the user leaves it unset.
    printing_method: z.enum(['offset', 'flexo']).optional(),
  })).optional(),
}).passthrough();
export type SdCreateQuotationDto = z.infer<typeof SdCreateQuotationSchema>;

export const SdCreateContractSchema = z.object({
  customer_id:   z.coerce.number().int().positive().optional(),
  start_date:    z.string().optional(),
  end_date:      z.string().optional(),
  total_amount:  z.coerce.number().positive().optional(),
  payment_terms: z.string().optional(),
  notes:         z.string().optional(),
}).passthrough();
export type SdCreateContractDto = z.infer<typeof SdCreateContractSchema>;

// EP-SD-037: real price-engine input — carton dims + paper + colours + qty (FE calcForm shape).
// product_id/formula_id kept optional for back-compat. coerce so '300'/300 both parse.
export const SdCalculatePriceSchema = z.object({
  productType:  z.string().max(50).optional(),
  paperType:    z.string().max(50).optional(),
  lengthMm:     z.coerce.number().nonnegative().default(0),
  widthMm:      z.coerce.number().nonnegative().default(0),
  heightMm:     z.coerce.number().nonnegative().default(0),
  thicknessMm:  z.coerce.number().nonnegative().optional(),
  printColors:  z.coerce.number().int().nonnegative().default(0),
  printSides:   z.coerce.number().int().min(1).max(2).default(1),
  quantity:     z.coerce.number().positive().default(1),
  isNewDie:     z.coerce.boolean().optional().default(false),
  kashirovka:   z.coerce.boolean().optional().default(false),
  lamination:   z.coerce.boolean().optional().default(false),
  embossing:    z.coerce.boolean().optional().default(false),
  perforation:  z.coerce.boolean().optional().default(false),
  product_id:   z.union([z.string(), z.number()]).optional(),
  formula_id:   z.union([z.string(), z.number()]).optional(),
  // 06-sd#12 (vision-1000-answers/06-sd.md #12, Q6): rejalashtirilgan avans foizi (0-100).
  // Optional — yubormasa eski hisob-kitob (chegirmasiz) o'zgarishsiz qoladi.
  advancePercent: z.coerce.number().min(0).max(100).optional(),
}).passthrough();
export type SdCalculatePriceDto = z.infer<typeof SdCalculatePriceSchema>;

// EP-SD-118 — vision 06-sd #118: self-adhesive ROLL parameters on a quotation line.
// All optional/nullable; a null explicitly clears the value, undefined keys are ignored
// by the service normaliser. coerce so '76'/76 both parse.
export const SdRollParamsSchema = z.object({
  core_diameter_mm:  z.coerce.number().nonnegative().nullable().optional(),
  gilza_diameter_mm: z.coerce.number().nonnegative().nullable().optional(),
  roll_length_m:     z.coerce.number().nonnegative().nullable().optional(),
}).passthrough();
export type SdRollParamsDto = z.infer<typeof SdRollParamsSchema>;
