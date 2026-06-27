/**
 * @module wms-in-transit.dto
 * @description Import xom-ashyo YO'LDA kuzatuvi uchun Zod schema + DTO. Request
 *   body'lar shu schemalar bilan validatsiya qilinadi (class-validator EMAS).
 *   snake_case maydonlar DB ustunlariga to'g'ridan mos keladi.
 */

import { z } from 'zod';

/** Yangi import jo'natmasi (status avtomatik 'shipped'). */
export const WmsCreateInTransitSchema = z.object({
  shipment_number:   z.string().min(1).max(64),
  supplier_id:       z.number().int().positive().optional(),
  supplier_name:     z.string().max(255).optional(),
  purchase_order_id: z.number().int().positive().optional(),
  warehouse_id:      z.number().int().positive().optional(),
  origin_country:    z.string().max(80).optional(),
  eta:               z.string().optional(),
  shipped_date:      z.string().optional(),
  currency:          z.string().max(10).optional(),
  declared_value:    z.number().nonnegative().optional(),
  incoterm:          z.string().max(16).optional(),
  customs_doc_url:   z.string().max(2048).optional(),
  invoice_number:    z.string().max(120).optional(),
  notes:             z.string().optional(),
});
export type WmsCreateInTransitDto = z.infer<typeof WmsCreateInTransitSchema>;

/** Holat o'tishi (customs/arrived) — ixtiyoriy sana bilan. */
export const WmsInTransitTransitionSchema = z.object({
  date:  z.string().optional(),
  notes: z.string().optional(),
});
export type WmsInTransitTransitionDto = z.infer<typeof WmsInTransitTransitionSchema>;

/** Import hujjati biriktirish (GTD/invoys/sertifikat). */
export const WmsAddImportDocumentSchema = z.object({
  doc_type:    z.enum(['GTD', 'invoice', 'cert', 'packing_list', 'other']),
  doc_number:  z.string().max(120).optional(),
  file_url:    z.string().max(2048).optional(),
  issued_date: z.string().optional(),
  notes:       z.string().optional(),
});
export type WmsAddImportDocumentDto = z.infer<typeof WmsAddImportDocumentSchema>;
