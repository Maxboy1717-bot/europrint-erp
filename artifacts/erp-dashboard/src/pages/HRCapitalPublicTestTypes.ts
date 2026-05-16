/**
 * @module HRCapitalPublicTestTypes
 * @description Types and constants for HRCapitalPublicTest page.
 */

import type React from "react";
import { Brain, FlaskConical, Target, ClipboardList } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export type TestType = "tool_test" | "iq" | "leadership" | "replication";
export type TestStatus = "pending" | "in_progress" | "completed" | "expired";
export type TestState = "loading" | "intro" | "testing" | "submitting" | "results" | "error" | "expired" | "completed";

export interface HrcSession {
  id: string;
  session_token: string;
  test_type: TestType;
  status: TestStatus;
  expires_at: string;
  current_q_idx: number;
  score: number | null;
  syndrome: string | null;
  iq_level: string | null;
  leadership_score: number | null;
  replication_accuracy: number | null;
  results: TestResults | null;
  vacancy_title?: string;
}

export interface HrcQuestion {
  id: number;
  text_uz: string;
  options?: string[];
  indicator?: string;
  weight?: number;
  category?: string;
  content_uz?: string;
  title_uz?: string;
}

export interface TestResults {
  score: number;
  indicators?: Record<string, number>;
  syndrome?: string | null;
  iqLevel?: string | null;
  leadershipScore?: number | null;
  replicationAccuracy?: number | null;
}

export const INDICATORS = [
  { key: "A", label: "Moslashuvchanlik", color: "#6366f1" },
  { key: "B", label: "Hamkorlik", color: "#22c55e" },
  { key: "C", label: "Tartiblilik", color: "#f59e0b" },
  { key: "D", label: "Liderlik", color: "#ef4444" },
  { key: "E", label: "Strategik fikr", color: "#8b5cf6" },
  { key: "F", label: "Em. barqarorlik", color: "#06b6d4" },
  { key: "G", label: "Kommunikatsiya", color: "#f97316" },
  { key: "H", label: tLabel('hr.HRCapitalPublicTest.osishgaTayyorlik', "O'sishga tayyorlik"), color: "#14b8a6" },
  { key: "I", label: "Optimizm", color: "#84cc16" },
  { key: "J", label: "Maqsadlilik", color: "#ec4899" },
];

export const SYNDROME_DESCRIPTIONS: Record<string, string> = {
  "Pedant": "Qattiq tartib tarafdori, o'zgarishlarga qarshilik ko'rsatadi",
  "Rozovye Ochki": "Ortiqcha optimist, xatarlarni ko'rmaydi",
  "Manipulyator": "Boshqalarni boshqarish uchun ta'sir vositalaridan foydalanadi",
  "Neeffektivny": "Past samaradorlik, mas'uliyatdan qochadi",
  "Konservator": "Yangilikka qarshi, eski usullarga yopishib olgan",
  "Prokrastinator": "Ishlarni kechiktiradi, qaror qabul qilishdan qo'rqadi",
  "Emotsional Beqaror": "Stressga nisbatan kuchli ta'sirlanuvchan",
  "Avtoritar": "Boshqalarning fikrini hisobga olmaydi",
  "O'sishdan Qochuvchi": "Tanqid va o'sish imkoniyatlaridan qo'rqadi",
  "Jamoa Qo'g'irchoq'i": "Mustaqil qaror qabul qila olmaydi",
  "Introviert Jamoa": "Jamoa bilan ishlashni afzal ko'radi lekin kommunikatsiyasi zaif",
  "Xaotik Novator": "G'oyalarga to'la lekin tartibsiz, yakunlamaydigan",
};

export type LucideIcon = React.ComponentType<{ className?: string }>;
export interface TestTypeConfig { label: string; icon: LucideIcon; desc: string; color: string }

export function getTestTypeConfig(type: string): TestTypeConfig {
  const configs: Record<string, TestTypeConfig> = {
    tool_test: { label: "TOOL TEST", icon: Brain, desc: "Shaxsiyat profili baholash", color: "text-[var(--ep-purple)] bg-violet-50" },
    iq: { label: "IQ Test", icon: FlaskConical, desc: "Intellektual qobiliyat baholash", color: "text-[var(--ep-blue)] bg-blue-50" },
    leadership: { label: "Liderlik testi", icon: Target, desc: "Muammo manbai topish qobiliyati", color: "text-[var(--ep-primary)] bg-orange-50" },
    replication: { label: "Takrorlash testi", icon: ClipboardList, desc: "Ko'rsatmani aniq bajarish", color: "text-[var(--ep-green)] bg-green-50" },
  };
  return configs[type] ?? configs["tool_test"];
}

export const API_BASE = "/api/hr/hrc-tests/public";
