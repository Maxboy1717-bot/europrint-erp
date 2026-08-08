/**
 * @module wms-in-transit
 * @description Import xom-ashyo YO'LDA kuzatuvi (in-transit) FE client + tiplari.
 *   BE 1-to'lqin endpointlari (Controller: wms/in-transit, wms/suppliers).
 *   apiRequest('METHOD', url, body) imzosi (F3). ADDITIVE (Q-46) — faqat yangi
 *   in-transit oqimi; mavjud WMS client (wms.ts) ga tegmaydi.
 * @layer Frontend utility (data layer)
 */

import { apiRequest } from "@/lib/queryClient";

/** Jo'natma holatlari (BE state-machine: shipped → customs → arrived / cancelled). */
export type InTransitStatus = "shipped" | "customs" | "arrived" | "cancelled";

/** Import jo'natmasi satri (wms_in_transit_shipments). snake_case = DB ustun. */
export interface InTransitShipment {
  id: number;
  shipment_number: string;
  supplier_id?: number | null;
  supplier_name?: string | null;
  purchase_order_id?: number | null;
  warehouse_id?: number | null;
  status: InTransitStatus | string;
  origin_country?: string | null;
  eta?: string | null;
  shipped_date?: string | null;
  customs_date?: string | null;
  arrived_date?: string | null;
  currency?: string | null;
  declared_value?: string | number | null;
  incoterm?: string | null;
  invoice_number?: string | null;
  customs_doc_url?: string | null;
  goods_receipt_id?: number | null;
  notes?: string | null;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Import hujjati (wms_import_documents). */
export interface ImportDocument {
  id: number;
  shipment_id: number;
  doc_type: "GTD" | "invoice" | "cert" | "packing_list" | "other" | string;
  doc_number?: string | null;
  file_url?: string | null;
  issued_date?: string | null;
  notes?: string | null;
  uploaded_by?: number | null;
  created_at?: string | null;
}

/** Ta'minotchi ishonchlilik reytingi satri (FE panel — ADDITIVE READ). */
export interface SupplierRatingRow {
  vendorId: number;
  vendorName: string | null;
  rating: number | null;
  ratingLowFlag: boolean;
  ratingUpdatedAt: string | null;
}

/** BE ro'yxat envelopesi: { items, total }. */
export interface ListEnvelope<T> {
  items: T[];
  total: number;
}

/** Yangi jo'natma yaratish payload (Zod-mos, BE WmsCreateInTransitSchema). */
export interface CreateInTransitPayload {
  shipment_number: string;
  supplier_id?: number;
  supplier_name?: string;
  purchase_order_id?: number;
  warehouse_id?: number;
  origin_country?: string;
  eta?: string;
  shipped_date?: string;
  currency?: string;
  declared_value?: number;
  incoterm?: string;
  invoice_number?: string;
  notes?: string;
}

/** Hujjat biriktirish payload (BE WmsAddImportDocumentSchema). */
export interface AddDocumentPayload {
  doc_type: "GTD" | "invoice" | "cert" | "packing_list" | "other";
  doc_number?: string;
  file_url?: string;
  issued_date?: string;
  notes?: string;
}

export const wmsInTransitApi = {
  /** Jo'natmalar ro'yxati (ixtiyoriy status filtri). */
  listShipments: (status?: string) =>
    apiRequest(
      "GET",
      status ? `/api/wms/in-transit/shipments?status=${encodeURIComponent(status)}` : "/api/wms/in-transit/shipments",
    ) as Promise<ListEnvelope<InTransitShipment>>,

  /** Yangi import jo'natmasi (status='shipped'). */
  createShipment: (payload: CreateInTransitPayload) =>
    apiRequest("POST", "/api/wms/in-transit/shipments", payload as unknown as Record<string, unknown>),

  /** shipped → customs (bojxonaga yetdi). */
  markCustoms: (id: number, date?: string) =>
    apiRequest("POST", `/api/wms/in-transit/shipments/${id}/customs`, date ? { date } : {}),

  /** customs → arrived (keldi; karantin kirim ochiladi). */
  markArrived: (id: number, date?: string) =>
    apiRequest("POST", `/api/wms/in-transit/shipments/${id}/arrived`, date ? { date } : {}),

  /** Jo'natmani bekor qilish. */
  cancel: (id: number) =>
    apiRequest("POST", `/api/wms/in-transit/shipments/${id}/cancel`, {}),

  /** Jo'natma hujjatlari (GTD/invoys/sertifikat). */
  listDocuments: (id: number) =>
    apiRequest("GET", `/api/wms/in-transit/shipments/${id}/documents`) as Promise<ListEnvelope<ImportDocument>>,

  /** Jo'natmaga hujjat biriktirish. */
  addDocument: (id: number, payload: AddDocumentPayload) =>
    apiRequest("POST", `/api/wms/in-transit/shipments/${id}/documents`, payload as unknown as Record<string, unknown>),

  /** Ta'minotchilar ishonchlilik reytingi ro'yxati (panel). */
  listSupplierRatings: (lowOnly = false) =>
    apiRequest("GET", `/api/wms/suppliers/rating?lowOnly=${lowOnly ? "true" : "false"}`) as Promise<
      SupplierRatingRow[]
    >,
};
