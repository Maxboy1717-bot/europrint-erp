
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module HRDashboardTypes
 * @description Local interfaces, types, and constants used across the HR Dashboard
 * module. No JSX — pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Raw API-shape interfaces (not shared with server schema)
// ---------------------------------------------------------------------------

export interface BirthdayEmployee {
  id: number;
  full_name: string;
  department_name?: string;
  age?: number;
  birth_date?: string;
}

export interface ExpiringContract {
  id: number;
  urgency?: string;
  fullName?: string;
  contractNumber?: string;
  daysLeft: number;
  endDate?: string;
}

export interface DailyStats {
  operatorStats?: { submitted?: number; total?: number };
  submitted?: number;
  absent?: number;
  pending?: number;
  stats?: {
    avg_operator_oee?: number;
    submitted_count?: number;
    auto_absent_count?: number;
    pending_count?: number;
  };
}

export interface GamLeaderboard {
  leaderboard?: Record<string, unknown>[];
}

export interface UpcomingMilestone {
  id: number;
  due_date: string;
  milestone_months?: number;
  employee_name?: string;
}

export interface AdaptationRiskEmployee {
  id: number;
  employee_name?: string;
  employee_id?: number;
  department_name?: string;
  mentor_name?: string;
  adaptation_score?: number;
  progress_percent?: number;
}

export interface AiInterviewSession {
  status: string;
}

// ---------------------------------------------------------------------------
// Derived / computed shapes
// ---------------------------------------------------------------------------

export interface AiPipeline {
  pending: number;
  active: number;
  completed: number;
}

// ---------------------------------------------------------------------------
// Module quick-link descriptor (used in V2 tab)
// ---------------------------------------------------------------------------

export interface ModuleLink {
  title: string;
  desc: string;
  href: string;
  color: string;
  icon: string;
}

export const MODULE_LINKS: ModuleLink[] = [
  { title: tLabel('hr.HRDashboard.hujjatOqimi', "Hujjat Oqimi"),       desc: "Ta'til, avans, buyruq hujjatlari va tasdiqlash zanjiri", href: "/hr/documents",    color: "bg-blue-500",   icon: "📄" },
  { title: "Intizom V2",         desc: "Buzilish katalogi, ogohlantirish va bloklash",            href: "/discipline",      color: "bg-red-500",    icon: "⚖️" },
  { title: "Gamifikatsiya",      desc: "Xodimlar reytingi, badge va ballar tizimi",               href: "/hr/gamification", color: "bg-yellow-500", icon: "🏆" },
  { title: tLabel('hr.HRDashboard.kunlikHisobot', "Kunlik Hisobot"),     desc: "Har kuni xodim hisoboti va HR nazorati",                  href: "/hr/daily-reports",color: "bg-green-500",  icon: "📋" },
  { title: tLabel('hr.HRDashboard.pipRejalar', "PIP Rejalar"),        desc: "Rivojlanish rejasi va progress kuzatuv",                  href: "/hr/pip",          color: "bg-orange-500", icon: "📈" },
  { title: tLabel('hr.HRDashboard.enpsSorov', "eNPS So'rov"),        desc: "Xodimlar sodiqlik indeksi va tahlil",                     href: "/hr/enps",         color: "bg-purple-500", icon: "📊" },
  { title: "Reception",          desc: "Mehmonlar kirish-chiqish nazorati",                       href: "/hr/reception",    color: "bg-teal-500",   icon: "🏢" },
  { title: tLabel('hr.HRDashboard.malakalarMatritsasi', "Malakalar Matritsasi"), desc: "Xodim va lavozim malaka xaritasi",                      href: "/skills-matrix",   color: "bg-indigo-500", icon: "🎯" },
  { title: "AI Intervyu",        desc: "Token orqali kandidat intervyusi",                        href: "/ai-hr/interviews",color: "bg-pink-500",   icon: "🤖" },
];
