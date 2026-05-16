/** @module ProductivityInterviewDialogTypes @description TypeScript interfaces, types, constants, and default values for the Productivity Interview Dialog. No JSX. */

import { Briefcase, Target, Star, CheckSquare } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Motivatsiya darajalari (Material №46 Bo'lim 2) ──────────────────────────
export const MOTIVATION_LEVELS = [
  {
    level: 4,
    label: "Burch",
    description: "Mas'uliyat va majburiyat asosida ishlaydi. Jamiyat va kompaniya oldidagi burch tuyg'usi.",
    color: "border-blue-500/60 bg-blue-500/10 text-blue-300",
    icon: "🏛",
  },
  {
    level: 3,
    label: "E'tiqod",
    description: "Ishiga ishonadi, missiyaga mos harakat qiladi. Ichki qadriyatlar va g'oyaviy motivatsiya.",
    color: "border-indigo-500/60 bg-indigo-500/10 text-indigo-300",
    icon: "💎",
  },
  {
    level: 2,
    label: "Manfaat",
    description: "Natija va mukofot uchun ishlaydi. O'sish imkoniyatlari, karyera va professional rivojlanish.",
    color: "border-amber-500/60 bg-amber-500/10 text-amber-300",
    icon: "📈",
  },
  {
    level: 1,
    label: "Pul",
    description: "Asosan moddiy manfaat uchun ishlaydi. Ish haqining muhimligi birinchi o'rinda.",
    color: "border-orange-500/60 bg-orange-500/10 text-orange-300",
    icon: "💰",
  },
];

// ─── TOOL TEST natijalari (A-J) ───────────────────────────────────────────────
export const TOOL_TRAITS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export const STEPS = [
  { id: "section1", icon: Briefcase, title: "1. Ish tajribasi" },
  { id: "section2", icon: Target,    title: "2. Motivatsiya" },
  { id: "section3", icon: Star,      title: "3. Kompetensiya" },
  { id: "summary",  icon: CheckSquare, title: tLabel('common.ProductivityInterviewDialog.yakuniyXulosa', "Yakuniy xulosa") },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface WorkplaceEntry {
  id: string;
  company: string;
  position: string;
  duration: string;
  hard_task: string;
  how_solved: string;
  initiative: string;
  lesson: string;
}

export interface MotivationData {
  q1_work_meaning: string;
  q2_ideal_env: string;
  q3_achievement: string;
  q4_future_goal: string;
  flow_direction: "inflow" | "outflow" | "";
  motivation_level: number;
}

export interface CompetencyData {
  q1_problem: string;
  q2_team: string;
  q3_growth: string;
  practical_task: string;
}

export interface SummaryData {
  productivity_score: number;
  motivation_score: number;
  competency_score: number;
  productivity_note: string;
  motivation_note: string;
  competency_note: string;
  tool_test_passed: Record<string, boolean>;
  final_decision: "qabul" | "kutish" | "rad" | "hech_qachon" | "";
  final_notes: string;
}

export interface ProductivityInterviewDialogProps {
  candidateId: number;
  candidateName: string;
  funnelId?: number;
  open: boolean;
  onClose: () => void;
}

// ─── Factory and defaults ─────────────────────────────────────────────────────

export function makeWorkplace(): WorkplaceEntry {
  return {
    id: crypto.randomUUID(),
    company: "", position: "", duration: "",
    hard_task: "", how_solved: "", initiative: "", lesson: "",
  };
}

export const DEFAULT_MOTIVATION: MotivationData = {
  q1_work_meaning: "", q2_ideal_env: "", q3_achievement: "", q4_future_goal: "",
  flow_direction: "", motivation_level: 0,
};

export const DEFAULT_COMPETENCY: CompetencyData = {
  q1_problem: "", q2_team: "", q3_growth: "", practical_task: "",
};

export const DEFAULT_SUMMARY: SummaryData = {
  productivity_score: 5, motivation_score: 5, competency_score: 5,
  productivity_note: "", motivation_note: "", competency_note: "",
  tool_test_passed: Object.fromEntries(TOOL_TRAITS.map(k => [k, false])),
  final_decision: "", final_notes: "",
};
