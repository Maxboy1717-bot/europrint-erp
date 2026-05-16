/**
 * PosMovementKirimTypes — Schemas, types, constants, and pure helpers
 * for the PosMovementKirim wizard.  No React imports needed here.
 */
import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── API types ────────────────────────────────────────────────────────────────
export interface WarehouseOption {
  id:       string;
  code:     string | null;
  name:     string | null;
  type:     string | null;
  isActive: boolean;
}

export interface MaterialSuggestion {
  id:             number;
  name:           string;
  code?:          string;
  category?:      string | null;
  material_type?: string | null;
}

export type CreatedMovement = { id: number; documentNumber?: string };

// ─── Zod schemas ──────────────────────────────────────────────────────────────
export const headerSchema = z.object({
  toWarehouseId:  z.string().min(1, "Ombor tanlang"),
  supplierName:   z.string().min(2, "Ta'minotchi nomi kiritilishi shart"),
  contractNumber: z.string().min(1, "Shartnoma raqami kiritilishi shart"),
  waybillNumber:  z.string().optional(),
  arrivalDate:    z.string().min(1, "Kelish sanasi kiritilishi shart"),
  currency:       z.enum(["UZS", "USD", "EUR"]),
  notes:          z.string().optional(),
});

export const lineSchema = z.object({
  materialCardId:    z.string().min(1, "Material tanlanishi shart"),
  quantity:          z.string().refine(v => parseFloat(v) > 0, "Miqdor 0 dan katta bo'lishi shart"),
  unitPrice:         z.string().refine(v => parseFloat(v) >= 0, "Narx manfiy bo'lishi mumkin emas"),
  batchNumber:       z.string().optional(),
  expiryDate:        z.string().optional(),
  weightKg:          z.string().optional(),
  certificateNumber: z.string().optional(),
  notes:             z.string().optional(),
});

export type HeaderForm = z.infer<typeof headerSchema>;

export interface LineItem {
  _key:              string;
  materialCardId:    string;
  materialName:      string;
  quantity:          string;
  unitPrice:         string;
  batchNumber:       string;
  expiryDate:        string;
  weightKg:          string;
  certificateNumber: string;
  notes:             string;
}

// ─── Warehouse-type config ────────────────────────────────────────────────────
export interface KirimConfig {
  icon:             string;
  title:            string;
  bannerBg:         string;
  bannerBorder:     string;
  bannerTextColor:  string;
  bannerText:       string;
  supplierLabel:    string;
  supplierRequired: boolean;
  contractLabel:    string;
  contractRequired: boolean;
  showWaybill:      boolean;
  showCurrency:     boolean;
  step2Hint:        string;
}

export const KIRIM_CONFIG: Record<string, KirimConfig> = {
  "QC-HOLD": {
    icon: "🔒", title: "Karantin Ombori — Tashqi Kirim",
    bannerBg: "#FEF3C7", bannerBorder: "#F59E0B", bannerTextColor: "#78350F",
    bannerText: "Barcha tashqi ta'minotchilar kirim avval KARANTIN ga tushadi. QC QABUL qilgach Xom Ashyo omboriga o'tadi.",
    supplierLabel: "Ta'minotchi nomi", supplierRequired: true,
    contractLabel: "Shartnoma raqami", contractRequired: true,
    showWaybill: true, showCurrency: true,
    step2Hint: "Karantin uchun har qator uchun sertifikat va partiya raqami kiritilishi tavsiya qilinadi.",
  },
  "RM-MAIN": {
    icon: "📦", title: "Xom Ashyo Ombori — Kirim",
    bannerBg: "rgba(59,130,246,0.08)", bannerBorder: "rgba(59,130,246,0.4)", bannerTextColor: "#1E3A5F",
    bannerText: "Xom ashyo bevosita qabul: har material uchun partiya, og'irlik va sertifikat kiritiladi.",
    supplierLabel: "Xom ashyo yetkazuvchi", supplierRequired: true,
    contractLabel: "Xarid shartnomasi", contractRequired: true,
    showWaybill: true, showCurrency: true,
    step2Hint: "Har qator uchun og'irlik (kg) va sertifikat raqami kiritilishi muhim.",
  },
  "RM-ROLLS": {
    icon: "🧻", title: "Rulon Ombori — Rulon Qabul",
    bannerBg: "rgba(236,72,153,0.08)", bannerBorder: "rgba(236,72,153,0.4)", bannerTextColor: "#831843",
    bannerText: "Rulon materiallar: har rulonning kengligi, og'irligi va partnumber qayd qilinadi.",
    supplierLabel: "Rulon yetkazuvchi", supplierRequired: true,
    contractLabel: "Rulon shartnomasi", contractRequired: true,
    showWaybill: true, showCurrency: true,
    step2Hint: "Partiya raqami = rulon lot number. Og'irlik kg ni ham to'ldiring.",
  },
  "FG-MAIN": {
    icon: "✅", title: tLabel('common.PosMovementKirim.tayyorMahsulotIshlabChiqarishdanQabul', "Tayyor Mahsulot — Ishlab Chiqarishdan Qabul"),
    bannerBg: "rgba(16,185,129,0.08)", bannerBorder: "rgba(16,185,129,0.4)", bannerTextColor: "#064E3B",
    bannerText: "Ishlab chiqarish bo'limidan tayyor mahsulot qabul. Shartnoma va yuk xati shart emas.",
    supplierLabel: "Ishlab chiqarish bo'limi / Smena", supplierRequired: true,
    contractLabel: "Ishlab chiqarish buyurtmasi (ixtiyoriy)", contractRequired: false,
    showWaybill: false, showCurrency: false,
    step2Hint: "Tayyor mahsulot: dona yoki kg bilan qayd qiling.",
  },
  "WIP-MAIN": {
    icon: "⚙️", title: tLabel('common.PosMovementKirim.yarimTayyorLiniyadanQabul', "Yarim Tayyor — Liniyadan Qabul"),
    bannerBg: "rgba(139,92,246,0.08)", bannerBorder: "rgba(139,92,246,0.4)", bannerTextColor: "#4C1D95",
    bannerText: "Ishlab chiqarish liniyasidan yarim tayyor mahsulot ko'chirish.",
    supplierLabel: "Liniya / Bo'lim nomi", supplierRequired: true,
    contractLabel: "Ishlab chiqarish buyurtmasi (ixtiyoriy)", contractRequired: false,
    showWaybill: false, showCurrency: false,
    step2Hint: "Yarim tayyor: qayta ishlash bosqichi va miqdorini ko'rsating.",
  },
  "SCRAP-MAIN": {
    icon: "⚠️", title: "Brak Ombori — Brak Akti",
    bannerBg: "rgba(239,68,68,0.08)", bannerBorder: "rgba(239,68,68,0.4)", bannerTextColor: "#7F1D1D",
    bannerText: "Brakka chiqarilgan yoki yaroqsiz materiallar ro'yxati. Sabab izohda ko'rsatilsin.",
    supplierLabel: "Qayd qiluvchi bo'lim / Mas'ul", supplierRequired: true,
    contractLabel: "Brak akti raqami", contractRequired: true,
    showWaybill: false, showCurrency: false,
    step2Hint: "Har qator uchun brak sababini izohda ko'rsating.",
  },
  "TOOL-MAIN": {
    icon: "🔧", title: "Asbob-Uskuna — Inventar Qabul",
    bannerBg: "rgba(245,158,11,0.08)", bannerBorder: "rgba(245,158,11,0.4)", bannerTextColor: "#78350F",
    bannerText: "Asbob-uskuna qabul: har birlik uchun seriya raqami va kalibrlash sanasi tavsiya qilinadi.",
    supplierLabel: "Asbob yetkazuvchi", supplierRequired: true,
    contractLabel: "Xarid / Tender raqami", contractRequired: true,
    showWaybill: true, showCurrency: true,
    step2Hint: "Sertifikat maydoniga seriya/inventar raqamini kiriting.",
  },
  "MRO-MAIN": {
    icon: "🏠", title: tLabel('common.PosMovementKirim.xojalikOmboriMateriallarKirim', "Xo'jalik Ombori — Materiallar Kirim"),
    bannerBg: "rgba(16,185,129,0.08)", bannerBorder: "rgba(16,185,129,0.4)", bannerTextColor: "#064E3B",
    bannerText: "Xo'jalik va yordamchi materiallar qabul qilish.",
    supplierLabel: "Yetkazuvchi", supplierRequired: true,
    contractLabel: "Shartnoma / Schyot raqami", contractRequired: false,
    showWaybill: true, showCurrency: true,
    step2Hint: "Xo'jalik materiallari: dona yoki litr bilan qayd qiling.",
  },
  "MRO-STORE": {
    icon: "🛠️", title: tLabel('common.PosMovementKirim.mroOmboriTexnikMateriallarKirim', "MRO Ombori — Texnik Materiallar Kirim"),
    bannerBg: "rgba(14,165,233,0.08)", bannerBorder: "rgba(14,165,233,0.4)", bannerTextColor: "#0C4A6E",
    bannerText: "Texnik xizmat va ta'mirlash (MRO) uchun materiallar qabul qilish.",
    supplierLabel: "MRO yetkazuvchi / Ta'mirotchi", supplierRequired: true,
    contractLabel: "Xarid buyurtmasi (PO)", contractRequired: false,
    showWaybill: true, showCurrency: true,
    step2Hint: "MRO: ehtiyot qismlar uchun seriya raqamini sertifikat maydoniga kiriting.",
  },
};

export const DEFAULT_KIRIM_CONFIG: KirimConfig = {
  icon: "📥", title: tLabel('common.PosMovementKirim.tashqiKirimQolda', "Tashqi Kirim (Qo'lda)"),
  bannerBg: "#FEF3C7", bannerBorder: "#F59E0B", bannerTextColor: "#78350F",
  bannerText: "EXTERNAL_IN — barcha maydonlar qo'lda to'ldiriladi.",
  supplierLabel: "Ta'minotchi nomi", supplierRequired: true,
  contractLabel: "Shartnoma raqami", contractRequired: true,
  showWaybill: true, showCurrency: true,
  step2Hint: "Har qator uchun partiya raqami kiritilishi tavsiya qilinadi.",
};

// ─── Batch prefix map ─────────────────────────────────────────────────────────
const BATCH_PREFIX_MAP: Record<string, string> = {
  RAW_MATERIAL: "RM", FINISHED_GOODS: "FG", WIP: "WIP", SCRAP: "SC",
  TOOLS: "TL", HOUSEHOLD: "HH", MRO: "MRO", QUARANTINE: "QC",
  CONSUMABLE: "CONS", ASSET: "AST", QOGOZ: "PAPER", KARTON: "CART",
  PLASTIK: "PLAST", METAL: "MET", METALLAR: "MET", HIMIYA: "CHEM",
  XIMIKOT: "CHEM", YOQILGI: "FUEL", ELEKTR: "ELEC", ASBOB: "TOOL",
  OFIS: "OFF", OZIQ: "FOOD", TERI: "LTHR", SHISHA: "GLASS",
  BOYO: "PAINT", BUYUM: "ITEM",
};

function batchPrefix(materialType?: string | null, category?: string | null): string {
  const tryKey = (s: string | null | undefined): string | null => {
    if (!s) return null;
    const up = s.toUpperCase();
    if (BATCH_PREFIX_MAP[up]) return BATCH_PREFIX_MAP[up];
    const partial = Object.keys(BATCH_PREFIX_MAP).find(k => up.includes(k));
    return partial ? BATCH_PREFIX_MAP[partial] : null;
  };
  return tryKey(materialType) ?? tryKey(category) ?? "MAT";
}

export function generateBatchNumber(
  materialType?: string | null,
  category?: string | null,
): string {
  const prefix = batchPrefix(materialType, category);
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rnd    = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${date}-${rnd}`;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────
let _keyCounter = 0;

export function mkLine(): LineItem {
  return {
    _key: `kl-${++_keyCounter}`,
    materialCardId: "", materialName: "", quantity: "",
    unitPrice: "", batchNumber: "", expiryDate: "",
    weightKg: "", certificateNumber: "", notes: "",
  };
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmt(n: number, currency = "UZS"): string {
  return n.toLocaleString("uz-UZ") + " " + currency;
}
