/**
 * @module wms-rulon-cards
 * @description Drizzle ORM schema — RULON QOG'OZ KARTA (paper-roll card).
 *
 * WMS core / oltin-ip: "Rulon qog'oz ombori" (paper-roll warehouse) — har bir
 * jismoniy rulon uchun bitta karta. Bu jadval rulonning identifikatsiyasini,
 * fizik o'lchovlarini (kenglik/diametr/gramaj), og'irligini (boshlang'ich/joriy),
 * AI tomonidan avto-hisoblangan taxminiy uzunligini, va holatini saqlaydi.
 *
 * VIZYON manbasi:
 *   docs/audit/MUSLIMBEK-PROMT-08-WMS-2026-06-08.md §PHASE 3 — rulon karta maydonlari:
 *     "noyob ID + QR label + kenglik (mm) + diametr + gramaj g/m² + boshlang'ich
 *      og'irlik (kg) + joriy qoldiq (kg) + taxminiy uzunlik (m, auto-calc =
 *      weight/(gramaj×kenglik)) + tur (kraft/test-liner/fluting/white/makulatura)
 *      + yetkazib beruvchi + sertifikat + kelgan sana + namlik% + saqlash zonasi"
 *   Roll status: To'liq / Ochilgan / Qoldiq (FIFO: ochilgan rulonlar birinchi).
 *
 * Matematik miya (taxminiy uzunlik / qoldiq og'irlik) ALOHIDA xizmatda:
 *   apps/api/src/modules/wms/domain/services/wms-roll-calc.service.ts (WmsRollCalcService)
 *   Bu jadval faqat MA'LUMOTNI saqlaydi — formula takrorlanmaydi.
 *
 * Kanonik balans jadvali = `warehouse_stock` (H-rail). Bu jadval rulonning
 * IDENTITETI uchun (karta = bitta jismoniy rulon), balans emas — ikkalasi birga
 * ishlaydi (rulon karta = batafsil pasport, warehouse_stock = umumiy balans).
 */

import { sql } from "drizzle-orm";
import {
  serial,
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  index,
  check,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { warehouses } from "./wms-schema";

/**
 * Rulon turi — qog'oz sanoati taksonomiyasi.
 * Manba: MUSLIMBEK-PROMT-08 §PHASE 3 — tur (kraft/test-liner/fluting/white/makulatura).
 */
export const RULON_TYPES = [
  "kraft",
  "test_liner",
  "fluting",
  "white",
  "makulatura",
] as const;

/**
 * Rulon holati — FIFO uchun: ochilgan rulonlar birinchi ishlatiladi.
 * Manba: MUSLIMBEK-PROMT-08 §PHASE 3 — To'liq / Ochilgan / Qoldiq.
 *   full     = To'liq (hali ochilmagan, butun rulon)
 *   opened   = Ochilgan (ishlatishni boshlangan, qisman qoldiq)
 *   remnant  = Qoldiq (deyarli tugagan, obrezka/ikkilamchi sifat)
 */
export const RULON_STATUSES = ["full", "opened", "remnant"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// rulon_cards — har bir jismoniy rulon uchun bitta karta (pasport)
// ─────────────────────────────────────────────────────────────────────────────
export const rulonCards = pgTable(
  "rulon_cards",
  {
    id: serial("id").primaryKey(),

    // Noyob biznes-ID + QR label (qabulda avto-bosiladi — POS Q19).
    rollCode: varchar("roll_code", { length: 64 }).notNull().unique(), // noyob ID, masalan RULON-2026-00001
    qrLabel: varchar("qr_label", { length: 128 }), // QR/barkod label payload (ZPL/EPL/PDF generatsiya uchun)

    // Fizik o'lchovlar.
    widthMm: integer("width_mm").notNull(), // kenglik, mm
    diameterMm: integer("diameter_mm"), // diametr, mm (ixtiyoriy — har doim o'lchanmaydi)
    grammageGsm: integer("grammage_gsm").notNull(), // gramaj, g/m² (dropdown 80..300, real 40..600)

    // Og'irlik (kg) — boshlang'ich va joriy qoldiq.
    initialWeightKg: numeric("initial_weight_kg", { precision: 12, scale: 3 }).notNull(),
    currentWeightKg: numeric("current_weight_kg", { precision: 12, scale: 3 }).notNull(),

    // AI avto-hisob: taxminiy uzunlik (m) = weight × 1e6 / (gramaj × kenglik).
    // WmsRollCalcService.estimatedLengthM orqali hisoblanadi (bu yerda saqlanadi).
    estimatedLengthM: numeric("estimated_length_m", { precision: 14, scale: 3 }),

    // Taksonomiya / kelib chiqishi.
    rollType: varchar("roll_type", { length: 30 }).notNull(), // RULON_TYPES
    supplier: text("supplier"), // yetkazib beruvchi
    certificate: text("certificate"), // sertifikat raqami/havolasi
    receivedDate: timestamp("received_date").defaultNow(), // kelgan sana

    // Sifat / saqlash.
    humidityPct: numeric("humidity_pct", { precision: 5, scale: 2 }), // namlik %
    storageZone: varchar("storage_zone", { length: 40 }), // saqlash zonasi (A-12-3-2 strukturali manzil)

    // Ombor bog'lanishi (warehouses.id = varchar PK).
    warehouseId: varchar("warehouse_id", { length: 50 }).references(() => warehouses.id, {
      onDelete: "set null",
    }),

    // Holat (FIFO).
    status: varchar("status", { length: 20 }).notNull().default("full"), // RULON_STATUSES

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_rulon_cards_status").on(t.status),
    index("idx_rulon_cards_roll_type").on(t.rollType),
    index("idx_rulon_cards_warehouse_id").on(t.warehouseId),
    index("idx_rulon_cards_grammage").on(t.grammageGsm),
    check("rulon_cards_type_chk", sql`${t.rollType} IN ('kraft','test_liner','fluting','white','makulatura')`),
    check("rulon_cards_status_chk", sql`${t.status} IN ('full','opened','remnant')`),
    check("rulon_cards_width_chk", sql`${t.widthMm} > 0`),
    check("rulon_cards_grammage_chk", sql`${t.grammageGsm} > 0`),
  ],
);

export const insertRulonCardSchema = createInsertSchema(rulonCards, {
  rollCode: z.string().min(1, "Rulon kodi talab qilinadi").max(64),
  rollType: z.enum(RULON_TYPES),
  status: z.enum(RULON_STATUSES),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type RulonCard = typeof rulonCards.$inferSelect;
export type InsertRulonCard = typeof rulonCards.$inferInsert;
export type RulonType = (typeof RULON_TYPES)[number];
export type RulonStatus = (typeof RULON_STATUSES)[number];
