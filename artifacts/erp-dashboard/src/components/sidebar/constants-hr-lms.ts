/** @module constants-hr-lms @description Sidebar navigation constants for Human Resources (tz11) and Learning Management System / Training (tz12) modules. */

import {
  Users, BarChart3, Network, MapPin, Calendar, Target, FileText,
  ClipboardList, UserPlus, UserCheck, Mic, Award, TrendingUp, RotateCcw,
  Trophy, DollarSign, HeartPulse, Building2, Cake, ShieldCheck,
  MessageSquare, UserMinus, BrainCircuit, FileQuestion, Crown, Grid3X3,
  Inbox, Megaphone, BookOpen, PlayCircle, GraduationCap, Brain,
  FileCheck, BadgeCheck, BookMarked,
} from "lucide-react";
import { MenuGroup } from "./types";

export const menuGroupsHrLms: Record<string, MenuGroup> = {
  tz11: {
    title: "Xodimlar",
    icon: Users,
    defaultUrl: "hr-dashboard",
    items: [
      // ─── ASOSIY ────────────────────────────────────────────────────────────
      { title: "ASOSIY", url: "", icon: Users, separator: true },
      { title: "HR Dashboard", url: "hr-dashboard", icon: BarChart3 },
      { title: "Xodimlar", url: "employees", icon: Users },
      { title: "Tashkiliy Tuzilma", url: "org-structure/hierarchy", icon: Network },
      { title: "HR Xarita", url: "hr-map", icon: MapPin },

      // ─── ISH JARAYONI ──────────────────────────────────────────────────────
      { title: "ISH JARAYONI", url: "", icon: Calendar, separator: true },
      { title: "Smena Jadvali", url: "shift-schedule", icon: Calendar },
      { title: "Maqsadlar va Milestone", url: "goals", icon: Target },
      { title: "Hujjat Oqimi", url: "hr/documents", icon: FileText },
      { title: "Kunlik Hisobot", url: "hr/daily-reports", icon: ClipboardList },
      { title: "Haftalik Reja", url: "weekly-plan", icon: ClipboardList },

      // ─── REKRUTING VA ONBOARDING ───────────────────────────────────────────
      { title: "REKRUTING & ONBOARDING", url: "", icon: UserPlus, separator: true },
      { title: "Rekruting Voronka", url: "hr/recruiting", icon: UserCheck },
      { title: "AI Intervyu", url: "ai-hr/interviews", icon: Mic },
      { title: "Onboarding & Adaptatsiya", url: "hr/onboarding", icon: UserPlus },
      { title: "Referral Tizimi", url: "hr/referrals", icon: UserPlus },

      // ─── XODIM ULGAYISH ────────────────────────────────────────────────────
      { title: "XODIM ULGAYISH", url: "", icon: TrendingUp, separator: true },
      { title: "Xodim Baholash (360°)", url: "integration/employee-rating", icon: Award },
      { title: "Kasbiy O'sish", url: "hr/career-path", icon: TrendingUp },
      { title: "Succession Planning", url: "hr/succession", icon: RotateCcw },
      { title: "PIP Rejalar", url: "hr/pip", icon: TrendingUp },
      { title: "Gamifikatsiya", url: "hr/gamification", icon: Trophy },

      // ─── KOMPENSATSIYA VA TA'TIL ───────────────────────────────────────────
      { title: "KOMPENSATSIYA", url: "", icon: DollarSign, separator: true },
      { title: "Ta'til va Kasallik", url: "hr/vacation-sick", icon: HeartPulse },
      { title: "Aktivlar", url: "hr/assets", icon: Building2 },
      { title: "Tug'ilgan Kunlar", url: "hr/birthdays", icon: Cake },

      // ─── INTIZOM VA KONFLIKT ───────────────────────────────────────────────
      { title: "INTIZOM", url: "", icon: ShieldCheck, separator: true },
      { title: "Intizom", url: "discipline", icon: FileText },
      { title: "Intizom V2", url: "discipline", icon: FileText },
      { title: "Konflikt Boshqaruvi", url: "hr/conflict", icon: MessageSquare },
      { title: "Offboarding", url: "hr/offboarding", icon: UserMinus },
      { title: "Alumni", url: "hr/alumni", icon: UserPlus },

      // ─── TAHLIL VA AI ──────────────────────────────────────────────────────
      { title: "TAHLIL VA AI", url: "", icon: BrainCircuit, separator: true },
      { title: "AI HR Dashboard", url: "ai-hr/dashboard", icon: BrainCircuit },
      { title: "eNPS So'rov", url: "hr/enps", icon: BarChart3 },
      { title: "Anketa", url: "questionnaire", icon: FileQuestion },
      { title: "Anketa Shablonlar", url: "questionnaire-templates", icon: FileQuestion },
      { title: "7 Funksiya (Adizes)", url: "seven-functions", icon: Crown },
      { title: "RACI Matritsasi", url: "raci-matrix", icon: Grid3X3 },

      // ─── NAZORAT ──────────────────────────────────────────────────────────
      { title: "NAZORAT", url: "", icon: ShieldCheck, separator: true },
      { title: "Sog'liq Nazorati", url: "hr/health-monitoring", icon: HeartPulse },
      { title: "Xavfsizlik", url: "hr/safety", icon: ShieldCheck },
      { title: "Reception", url: "hr/reception", icon: MapPin },
      { title: "Bildirishnomalar", url: "settings/notifications", icon: Inbox },

      // ─── BREND ────────────────────────────────────────────────────────────
      { title: "HR BREND", url: "", icon: Megaphone, separator: true },
      { title: "HR Brend Boshqaruv", url: "hr/brand", icon: Megaphone },
      { title: "Milestone Tracker", url: "hr/milestones", icon: Trophy },
    ],
  },
  tz12: {
    title: "Ta'lim",
    icon: GraduationCap,
    defaultUrl: "lms-dashboard",
    items: [
      { title: "KURSLAR", url: "", icon: BookOpen, separator: true },
      { title: "LMS Dashboard", url: "lms-dashboard", icon: BarChart3 },
      { title: "Kurslar", url: "courses", icon: BookOpen },
      { title: "Darslar", url: "lessons", icon: PlayCircle },
      { title: "HR Capital Kurslar", url: "hr-capital/courses", icon: GraduationCap },
      { title: "HR Capital Testlar", url: "hr-capital/tests", icon: Brain },
      { title: "Kurs Muallifi", url: "lms/course-author", icon: Mic },
      { title: "TESTLAR VA BAHOLASH", url: "", icon: ClipboardList, separator: true },
      { title: "Testlar", url: "tests", icon: ClipboardList },
      { title: "Imtihonlar", url: "all-exams", icon: FileCheck },
      { title: "AI Imtihonlar", url: "ai-exams", icon: BrainCircuit },
      { title: "SERTIFIKAT", url: "", icon: Award, separator: true },
      { title: "Sertifikatlar", url: "certificates", icon: Award },
      { title: "Operator Sertifikatsiyasi", url: "lms/operator-certification", icon: BadgeCheck },
      { title: "Test Boshqaruvi", url: "lms/test-management", icon: ClipboardList },
      { title: "MENTORLIK", url: "", icon: UserCheck, separator: true },
      { title: "Mentorlik", url: "mentorship", icon: UserCheck },
      { title: "GAMIFIKATSIYA", url: "", icon: Trophy, separator: true },
      { title: "Ko'nikmalar", url: "skills-matrix", icon: Target },
      { title: "Leaderboard", url: "lms/leaderboard", icon: Trophy },
      { title: "BILIM BAZASI", url: "", icon: BookMarked, separator: true },
      { title: "Tadbirlar", url: "events-calendar", icon: Calendar },
      { title: "Bilim Bazasi", url: "lms/knowledge-base", icon: BookMarked },
      { title: "Micro-learning", url: "lms/micro-learning", icon: PlayCircle },
      { title: "TAHLIL", url: "", icon: BarChart3, separator: true },
      { title: "HR ↔ LMS", url: "integration/hr-lms", icon: GraduationCap },
      { title: "O'quv Byudjeti", url: "lms/learning-budget", icon: DollarSign },
      { title: "Statistika", url: "analytics", icon: BarChart3 },
    ],
  },
};
