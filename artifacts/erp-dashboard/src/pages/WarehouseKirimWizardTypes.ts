/**
 * WarehouseKirimWizardTypes.ts
 * Interfaces, types and constants for WarehouseKirimWizard.
 */

export interface Warehouse { id: number; code: string; name: string; type?: string; }
export interface Material  { id: number; code: string; name: string; unit: string; }

export interface LineItem {
  _key: string;
  materialCardId: number | null;
  materialName: string;
  quantity: number;
  unitPrice: number;
  batchNumber: string;
  expiryDate: string;
  weightKg: number;
  certificateNumber: string;
}

export interface KirimConfig {
  icon: string;
  title: string;
  badgeColor: string;
  bannerClass: string;
  bannerText: string;
  supplierLabel: string;
  supplierRequired: boolean;
  supplierPlaceholder: string;
  contractLabel: string;
  contractRequired: boolean;
  showWaybill: boolean;
  showTin: boolean;
  showCurrency: boolean;
  step2Hint: string;
  step3Hint: string;
  submitLabel: string;
  successNext: "quarantine" | "hub" | "fg" | "wip";
}

export const KIRIM_CONFIG: Record<string, KirimConfig> = {
  "QC-HOLD": {
    icon: "🔒", title: "Karantin Ombori — Tashqi Kirim",
    badgeColor: "bg-amber-500",
    bannerClass: "bg-amber-50 border border-amber-200 text-amber-900",
    bannerText: "Tashqi ta'minotchilardan kelgan barcha tovarlar avval KARANTIN (QC-HOLD) ga tushadi. QC QABUL qilgach avtomatik asosiy omborga o'tadi.",
    supplierLabel: "Ta'minotchi nomi", supplierRequired: true, supplierPlaceholder: "Masalan: Alfa-Tex LLC",
    contractLabel: "Shartnoma raqami", contractRequired: true,
    showWaybill: true, showTin: true, showCurrency: true,
    step2Hint: "Sertifikat va partiya raqami har qator uchun kiritilishi tavsiya qilinadi.",
    step3Hint: "Inventar pasporti: og'irlik va sertifikat raqamini to'ldiring.",
    submitLabel: "🔒 Karantinga yuborish", successNext: "quarantine",
  },
  "RM-MAIN": {
    icon: "📦", title: "Xom Ashyo Ombori — Kirim",
    badgeColor: "bg-blue-600",
    bannerClass: "bg-blue-50 border border-blue-200 text-blue-900",
    bannerText: "Xom ashyo bevosita qabul: har material uchun partiya, og'irlik va sertifikat qayd qilinadi.",
    supplierLabel: "Xom ashyo yetkazuvchi", supplierRequired: true, supplierPlaceholder: "Yetkazuvchi nomi...",
    contractLabel: "Xarid shartnomasi", contractRequired: true,
    showWaybill: true, showTin: true, showCurrency: true,
    step2Hint: "Har qator uchun og'irlik (kg) va sertifikat raqami kiritilishi muhim.",
    step3Hint: "Xom ashyo pasporti: o'lchov, sertifikat va partiya ma'lumotlari.",
    submitLabel: "📦 Xom Ashyoga kirim", successNext: "hub",
  },
  "RM-ROLLS": {
    icon: "🧻", title: "Rulon Ombori — Rulon Qabul",
    badgeColor: "bg-pink-600",
    bannerClass: "bg-pink-50 border border-pink-200 text-pink-900",
    bannerText: "Rulon materiallar: har rulonning kengligi, og'irligi va lot raqami qayd qilinadi.",
    supplierLabel: "Rulon yetkazuvchi", supplierRequired: true, supplierPlaceholder: "Rulon zavodi yoki distribyutor...",
    contractLabel: "Rulon shartnomasi", contractRequired: true,
    showWaybill: true, showTin: false, showCurrency: true,
    step2Hint: "Partiya raqami = rulon lot number. Og'irlik kg majburiy.",
    step3Hint: "Rulon pasporti: kenglik, og'irlik va lot raqami.",
    submitLabel: "🧻 Rulonga kirim", successNext: "hub",
  },
  "FG-MAIN": {
    icon: "✅", title: "Tayyor Mahsulot — Ishlab Chiqarishdan Qabul",
    badgeColor: "bg-emerald-600",
    bannerClass: "bg-emerald-50 border border-emerald-200 text-emerald-900",
    bannerText: "Ishlab chiqarish bo'limidan tayyor mahsulot qabul. Shartnoma va yuk xati shart emas.",
    supplierLabel: "Ishlab chiqarish bo'limi / Smena", supplierRequired: true, supplierPlaceholder: "Masalan: 1-smena, Flexo bo'limi...",
    contractLabel: "Ishlab chiqarish buyurtmasi", contractRequired: false,
    showWaybill: false, showTin: false, showCurrency: false,
    step2Hint: "Tayyor mahsulot: dona, kg yoki m² bilan qayd qiling.",
    step3Hint: "Tayyor mahsulot: sifat nazorat raqami va partiya.",
    submitLabel: "✅ Tayyor Mahsulot kirim", successNext: "fg",
  },
  "WIP-MAIN": {
    icon: "⚙️", title: "Yarim Tayyor — Liniyadan Qabul",
    badgeColor: "bg-violet-600",
    bannerClass: "bg-violet-50 border border-violet-200 text-violet-900",
    bannerText: "Ishlab chiqarish liniyasidan yarim tayyor mahsulot ko'chirish. Qayta ishlash bosqichi qayd qilinadi.",
    supplierLabel: "Liniya / Bo'lim nomi", supplierRequired: true, supplierPlaceholder: "Masalan: Offset liniya 2...",
    contractLabel: "Ishlab chiqarish buyurtmasi", contractRequired: false,
    showWaybill: false, showTin: false, showCurrency: false,
    step2Hint: "Yarim tayyor: qayta ishlash bosqichi va miqdorini ko'rsating.",
    step3Hint: "Yarim tayyor: texnologik karta raqami.",
    submitLabel: "⚙️ WIP Omborga kirim", successNext: "wip",
  },
  "SCRAP-MAIN": {
    icon: "⚠️", title: "Brak Ombori — Brak Akti",
    badgeColor: "bg-red-600",
    bannerClass: "bg-red-50 border border-red-200 text-red-900",
    bannerText: "Brakka chiqarilgan yoki yaroqsiz materiallar ro'yxati. Sabab izoh maydonida ko'rsatilsin.",
    supplierLabel: "Qayd qiluvchi bo'lim / Mas'ul", supplierRequired: true, supplierPlaceholder: "Masalan: QC inspektori...",
    contractLabel: "Brak akti raqami", contractRequired: true,
    showWaybill: false, showTin: false, showCurrency: false,
    step2Hint: "Har qator uchun brak sababi izohga yozilsin.",
    step3Hint: "Brak akti: zararning miqdori va sababi.",
    submitLabel: "⚠️ Brak Aktini saqlash", successNext: "hub",
  },
  "TOOL-MAIN": {
    icon: "🔧", title: "Asbob-Uskuna — Inventar Qabul",
    badgeColor: "bg-amber-600",
    bannerClass: "bg-amber-50 border border-amber-200 text-amber-900",
    bannerText: "Asbob-uskuna qabul: har birlik uchun seriya raqami va kalibrlash sanasi tavsiya qilinadi.",
    supplierLabel: "Asbob yetkazuvchi / Tender g'olibi", supplierRequired: true, supplierPlaceholder: "Yetkazuvchi nomi...",
    contractLabel: "Xarid / Tender raqami", contractRequired: true,
    showWaybill: true, showTin: true, showCurrency: true,
    step2Hint: "Sertifikat maydoniga seriya/inventar raqamini kiriting.",
    step3Hint: "Inventar pasporti: seriya raqami va kalibrlash sanasi.",
    submitLabel: "🔧 Inventarga kirim", successNext: "hub",
  },
  "MRO-MAIN": {
    icon: "🏠", title: "Xo'jalik Ombori — Materiallar Kirim",
    badgeColor: "bg-teal-600",
    bannerClass: "bg-teal-50 border border-teal-200 text-teal-900",
    bannerText: "Xo'jalik va yordamchi materiallar qabul qilish.",
    supplierLabel: "Yetkazuvchi", supplierRequired: true, supplierPlaceholder: "Yetkazuvchi nomi...",
    contractLabel: "Shartnoma / Schyot raqami", contractRequired: false,
    showWaybill: true, showTin: false, showCurrency: true,
    step2Hint: "Xo'jalik materiallari: dona yoki litr bilan qayd qiling.",
    step3Hint: "Ixtiyoriy: sertifikat va lot raqami.",
    submitLabel: "🏠 Xo'jalik Omborga kirim", successNext: "hub",
  },
  "MRO-STORE": {
    icon: "🛠️", title: "MRO Ombori — Texnik Materiallar Kirim",
    badgeColor: "bg-sky-600",
    bannerClass: "bg-sky-50 border border-sky-200 text-sky-900",
    bannerText: "Texnik xizmat va ta'mirlash (MRO) uchun materiallar qabul qilish.",
    supplierLabel: "MRO yetkazuvchi / Ta'mirotchi", supplierRequired: true, supplierPlaceholder: "MRO yetkazuvchi...",
    contractLabel: "Xarid buyurtmasi (PO)", contractRequired: false,
    showWaybill: true, showTin: false, showCurrency: true,
    step2Hint: "Ehtiyot qismlar uchun seriya raqamini sertifikat maydoniga kiriting.",
    step3Hint: "MRO pasporti: zavod seriya raqami va texnik sertifikat.",
    submitLabel: "🛠️ MRO Omborga kirim", successNext: "hub",
  },
};

export const DEFAULT_CFG: KirimConfig = {
  icon: "📥", title: "Tashqi Kirim (Qo'lda)",
  badgeColor: "bg-gray-600",
  bannerClass: "bg-amber-50 border border-amber-200 text-amber-900",
  bannerText: "EXTERNAL_IN — barcha maydonlar qo'lda to'ldiriladi.",
  supplierLabel: "Ta'minotchi nomi", supplierRequired: true, supplierPlaceholder: "Masalan: Alfa-Tex LLC",
  contractLabel: "Shartnoma raqami", contractRequired: true,
  showWaybill: true, showTin: true, showCurrency: true,
  step2Hint: "Har qator uchun partiya raqami kiritilishi tavsiya qilinadi.",
  step3Hint: "Inventar pasporti: og'irlik va sertifikat raqamini to'ldiring.",
  submitLabel: "🚀 Karantinga yuborish", successNext: "quarantine",
};

export const STEPS = [
  { n: 1, label: "Asosiy ma'lumotlar" },
  { n: 2, label: "Materiallar" },
  { n: 3, label: "Inventar pasporti" },
  { n: 4, label: "Ko'rib chiqish" },
  { n: 5, label: "Tasdiqlash" },
];

let lineCounter = 0;
export function mkLine(): LineItem {
  return {
    _key: `l-${++lineCounter}`,
    materialCardId: null, materialName: "",
    quantity: 0, unitPrice: 0, batchNumber: "",
    expiryDate: "", weightKg: 0, certificateNumber: "",
  };
}
