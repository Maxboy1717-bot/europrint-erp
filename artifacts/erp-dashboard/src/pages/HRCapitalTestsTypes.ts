/**
 * HRCapitalTestsTypes — Constants and TypeScript types for the HRCapitalTests
 * wizard.  No React/JSX imports needed here.
 */

// ─── Assessment constants ─────────────────────────────────────────────────────

export const INDICATORS = [
  { key: "A", label: "Moslashuvchanlik",       desc: "O'zgarishlarga moslashish qobiliyati", color: "#6366f1" },
  { key: "B", label: "Hamkorlik",              desc: "Jamoa bilan ishlash qobiliyati",       color: "#22c55e" },
  { key: "C", label: "Tartiblilik",            desc: "Rejalashtirish va tashkil etish",       color: "#f59e0b" },
  { key: "D", label: "Liderlik",               desc: "Boshqarish va yo'naltirish",            color: "#ef4444" },
  { key: "E", label: "Strategik fikr",         desc: "Kelajakni ko'ra bilish",                color: "#8b5cf6" },
  { key: "F", label: "Emotsional barqarorlik", desc: "His-tuyg'ularni boshqarish",            color: "#06b6d4" },
  { key: "G", label: "Kommunikatsiya",         desc: "Fikrni ifodalash qobiliyati",           color: "#f97316" },
  { key: "H", label: "O'sishga tayyorlik",     desc: "Yangi bilim va tanqidga ochiqlik",      color: "#14b8a6" },
  { key: "I", label: "Optimizm",               desc: "Ijobiy fikrlash",                       color: "#84cc16" },
  { key: "J", label: "Maqsadlilik",            desc: "Maqsad qo'yish va erishish",            color: "#ec4899" },
] as const;

export const SYNDROME_DESCRIPTIONS: Record<string, { label: string; description: string; color: string }> = {
  "Pedant":               { label: "Pedant",               description: "Qattiq tartib tarafdori, o'zgarishlarga qarshilik ko'rsatadi",       color: "bg-orange-100 text-orange-800 border-orange-300" },
  "Rozovye Ochki":        { label: "Rozovye Ochki",        description: "Ortiqcha optimist, xatarlarni ko'rmaydi",                            color: "bg-pink-100 text-pink-800 border-pink-300" },
  "Manipulyator":         { label: "Manipulyator",         description: "Boshqalarni boshqarish uchun ta'sir vositalaridan foydalanadi",       color: "bg-red-100 text-red-800 border-red-300" },
  "Neeffektivny":         { label: "Neeffektivny",         description: "Past samaradorlik, mas'uliyatdan qochadi",                           color: "bg-gray-100 text-gray-800 border-gray-300" },
  "Konservator":          { label: "Konservator",          description: "Yangilikka qarshi, eski usullarga yopishib olgan",                   color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  "Prokrastinator":       { label: "Prokrastinator",       description: "Ishlarni kechiktiradi, qaror qabul qilishdan qo'rqadi",              color: "bg-blue-100 text-blue-800 border-blue-300" },
  "Emotsional Beqaror":   { label: "Emotsional Beqaror",   description: "Stressga nisbatan kuchli ta'sirlanuvchan",                           color: "bg-purple-100 text-purple-800 border-purple-300" },
  "Avtoritar":            { label: "Avtoritar",            description: "Boshqalarning fikrini hisobga olmaydi",                              color: "bg-rose-100 text-rose-800 border-rose-300" },
  "O'sishdan Qochuvchi":  { label: "O'sishdan Qochuvchi",  description: "Tanqid va o'sish imkoniyatlaridan qo'rqadi",                         color: "bg-slate-100 text-slate-800 border-slate-300" },
  "Jamoa Qo'g'irchoq'i":  { label: "Jamoa Qo'g'irchoq'i",  description: "Mustaqil qaror qabul qila olmaydi",                                 color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  "Introviert Jamoa":     { label: "Introviert Jamoa",     description: "Jamoa bilan ishlashni afzal ko'radi lekin komunikatsiyasi zaif",     color: "bg-teal-100 text-teal-800 border-teal-300" },
  "Xaotik Novator":       { label: "Xaotik Novator",       description: "G'oyalarga to'la lekin tartibsiz, yakunlamaydigan",                  color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
};

export const IQ_LEVELS = [
  { min: 95, max: 100, label: "Daho (135+)",              color: "text-[var(--ep-purple)]" },
  { min: 80, max: 94,  label: "Juda yuqori (120-134)",    color: "text-[var(--ep-blue)]" },
  { min: 65, max: 79,  label: "Yuqori (110-119)",         color: "text-[var(--ep-green)]" },
  { min: 50, max: 64,  label: "O'rtadan yuqori (100-109)", color: "text-[var(--ep-cyan)]" },
  { min: 35, max: 49,  label: "O'rta (90-99)",            color: "text-[var(--ep-yellow)]" },
  { min: 20, max: 34,  label: "O'rtadan past (80-89)",    color: "text-[var(--ep-primary)]" },
  { min: 0,  max: 19,  label: "Past (80 dan past)",       color: "text-[var(--ep-red)]" },
] as const;

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type TestType   = "tool_test" | "iq" | "leadership" | "replication";
export type TestStatus = "pending" | "in_progress" | "completed" | "expired";

export interface HrcSession {
  id: string;
  session_token: string;
  test_type: TestType;
  status: TestStatus;
  expires_at: string;
  created_at: string;
  completed_at?: string;
  score: number | null;
  syndrome: string | null;
  iq_level: string | null;
  indicators?: Record<string, number>;
  leadership_score?: number | null;
  replication_accuracy?: number | null;
  results: Record<string, unknown> | null;
  candidate_name?: string;
  candidate_phone?: string;
  employee_name?: string;
  vacancy_title?: string;
}

export interface HrcQuestion {
  id: number;
  indicator: string;
  text_uz: string;
  text_ru?: string;
  weight: number;
  is_active: boolean;
}

export interface StatRow {
  test_type: string;
  total: string;
  completed: string;
  avg_score: string;
}

export interface Candidate {
  id: number;
  full_name?: string;
  name?: string;
  phone?: string;
}

export interface Employee {
  id: number;
  full_name?: string;
}
