export const fmt = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0));

export const SEGMENT_LABELS: Record<string, string> = {
  vip: "VIP", regular: "Doimiy", new: "Yangi", potential: "Potentsial",
};
export const SEGMENT_COLORS: Record<string, string> = {
  vip: "bg-yellow-100 text-yellow-800", regular: "bg-blue-100 text-blue-800",
  new: "bg-green-100 text-green-800", potential: "bg-purple-100 text-purple-800",
};
export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Yangi", working: "Ishlanmoqda", quoted: "Taklif yuborildi",
  negotiating: "Muzokaralar", won: "Yutildi", lost: "Yutqizildi", frozen: "Muzlatildi",
};
export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-700", working: "bg-blue-100 text-blue-700",
  quoted: "bg-indigo-100 text-indigo-700", negotiating: "bg-amber-100 text-amber-700",
  won: "bg-green-100 text-green-700", lost: "bg-red-100 text-red-700",
  frozen: "bg-slate-100 text-slate-700",
};
export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Yangi", advance_pending: "Avans kutilmoqda", advance_paid: "Avans to'landi",
  design: "Dizaynda", technologist: "Texnologda", planned: "Rejada",
  production: "Ishlab chiqarishda", quality_check: "Sifat nazoratida",
  in_warehouse: "Omborga keldi", delivering: "Yetkazilmoqda",
  delivered: "Yetkazildi", closed: "Yopildi", cancelled: "Bekor qilindi",
};
export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-700", advance_pending: "bg-amber-100 text-amber-700",
  advance_paid: "bg-blue-100 text-blue-700", design: "bg-purple-100 text-purple-700",
  technologist: "bg-indigo-100 text-indigo-700", planned: "bg-cyan-100 text-cyan-700",
  production: "bg-orange-100 text-orange-700", quality_check: "bg-yellow-100 text-yellow-700",
  in_warehouse: "bg-teal-100 text-teal-700", delivering: "bg-lime-100 text-lime-700",
  delivered: "bg-green-100 text-green-700", closed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700", returned: "bg-gray-100 text-gray-700",
};
export const SOURCE_LABELS: Record<string, string> = {
  phone: "Telefon", telegram: "Telegram", website: "Sayt", mobile: "Mobil ilova",
  instagram: "Instagram", exhibition: "Ko'rgazma", referral: "Tavsiya", other: "Boshqa",
};
export const QUOT_STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama", sent: "Yuborildi", viewed: "Ko'rildi",
  approved: "Tasdiqlandi", rejected: "Rad etildi", expired: "Muddati o'tdi",
};
export const QUOT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700", sent: "bg-blue-100 text-blue-700",
  viewed: "bg-indigo-100 text-indigo-700", approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700", expired: "bg-amber-100 text-amber-700",
};
