/**
 * @module constants-groups-b
 * @description Sidebar menu groups tz09–tz13 (Rule 16 split from constants.ts).
 */
import {
  ShoppingCart, BarChart3, Truck, DollarSign, Zap, CreditCard, BadgeCheck, Trophy,
  Globe, Navigation, Car, Map, Fuel, UserCog, Calendar, Crown, BrainCircuit,
  LayoutDashboard, FileText, BookOpen, TrendingUp, Target, FileCheck, Users,
  CheckCircle, Banknote, Package, MonitorDot, Layers, RotateCcw, Calculator,
  ClipboardCheck, FileSpreadsheet, ScrollText, Building2, Network, Briefcase,
  Grid3X3, MapPin, UserCheck, Mic, GraduationCap, FileQuestion, Inbox, HeartPulse,
  Award, UserPlus, UserMinus, ShieldCheck, MessageSquare, ClipboardList, Star,
  Cake, Megaphone, PlayCircle, Brain, BookMarked, Fingerprint, ScanLine, Camera,
  AlertTriangle, HardHat, Flame, Lock, Barcode,
} from "lucide-react";

export const menuGroupsB = {
  tz09: {
    title: "Ta'minot",
    icon: Truck,
    defaultUrl: "mm/dashboard",
    items: [
      { title: "TA'MINOT", url: "", icon: ShoppingCart, separator: true },
      { title: "MM Dashboard", url: "mm/dashboard", icon: BarChart3 },
      { title: "Yetkazuvchilar", url: "mm/vendors", icon: Truck },
      { title: "Xarid Buyurtmalari", url: "mm/purchase-orders", icon: ShoppingCart },
      { title: "PUL NAZORATI", url: "", icon: DollarSign, separator: true },
      { title: "Xarajat Nazorati", url: "integration/expense-management", icon: DollarSign },
      { title: "Chek Bot", url: "mm/check-bot", icon: Zap },
      { title: "Kreditor Qarzlar", url: "mm/creditor-debts", icon: CreditCard },
      { title: "YETKAZUVCHI", url: "", icon: BadgeCheck, separator: true },
      { title: "Yetkazuvchi Baho", url: "integration/vendor-performance", icon: Trophy },
      { title: "Supplier Portal", url: "mm/supplier-portal", icon: Globe },
      { title: "LOGISTIKA", url: "", icon: Navigation, separator: true },
      { title: "Transport Parki", url: "logistics/transport", icon: Car },
      { title: "Marshrut Rejalashtirish", url: "logistics/route-planning", icon: Map },
      { title: "GPS Monitoring", url: "logistics/gps", icon: Navigation },
      { title: "Yoqilg'i Nazorati", url: "logistics/fuel", icon: Fuel },
      { title: "HAYDOVCHI", url: "", icon: UserCog, separator: true },
      { title: "Haydovchi Boshqaruvi", url: "logistics/drivers", icon: UserCog },
      { title: "Mashina Jadvali", url: "logistics/vehicle-schedule", icon: Calendar },
    ],
  },
  tz10: {
    title: "Moliya",
    icon: TrendingUp,
    defaultUrl: "cfo-dashboard",
    items: [
      { title: "GL / IKKI YOQLAMA", url: "", icon: BookOpen, separator: true },
      { title: "CFO", url: "cfo", icon: Crown },
      { title: "CFO Dashboard", url: "cfo-dashboard", icon: BarChart3 },
      { title: "AI Moliya", url: "ai/finance", icon: BrainCircuit },
      { title: "Bosh Buxgalter", url: "finance-dashboard", icon: LayoutDashboard },
      { title: "GL Hujjatlar", url: "accounting/gl-documents", icon: FileText },
      { title: "Hisoblar Rejasi", url: "accounting/chart-of-accounts", icon: BookOpen },
      { title: "Davr Yopish", url: "accounting/period-closing", icon: Calendar },
      { title: "HISOBOTLAR", url: "", icon: FileText, separator: true },
      { title: "Pul Oqimi", url: "finance/cashflow", icon: TrendingUp },
      { title: "Byudjet", url: "finance/budgets", icon: Target },
      { title: "Foyda Tahlili", url: "finance/profitability", icon: BarChart3 },
      { title: "Hisobotlar", url: "finance/reports", icon: FileCheck },
      { title: "DEBITOR / KREDITOR", url: "", icon: Users, separator: true },
      { title: "Debitorlar", url: "accounting/ar", icon: Users },
      { title: "Kreditorlar", url: "accounting/ap", icon: Truck },
      { title: "Moliya Tasdiqlash", url: "finance/approval", icon: CheckCircle },
      { title: "AVANS VA KASSA", url: "", icon: Banknote, separator: true },
      { title: "Kassa", url: "accounting/cash-register", icon: DollarSign },
      { title: "Kirim/Chiqim", url: "accounting/income-expense", icon: TrendingUp },
      { title: "POS TIZIMI", url: "", icon: ShoppingCart, separator: true },
      { title: "POS Monitor", url: "pos-monitor", icon: MonitorDot },
      // 2026-05-21 kanon: 9 ta eski /pos/* sahifa (Kassa, Inventar, Zaxira, Harakatlar,
      // So'rovlar, Barkod, Inventarizatsiya, Ombor, Sinxronizatsiya) olib tashlandi —
      // hammasi POS Monitor (/pos-monitor) ilovasini dublikat qilardi. Kassa → Finance.
      // "Ish Haqi" HR moduliga (tz11) ko'chirildi — "Maosh" deb yagona joyda
      { title: "TANNARX", url: "", icon: Calculator, separator: true },
      { title: "Buyurtma Tannarxi", url: "finance/order-costing", icon: Calculator },
      { title: "Ombor Hisobi", url: "accounting/materials", icon: Package },
      { title: "Inventarizatsiya", url: "accounting/inventory-valuation", icon: ClipboardCheck },
      { title: "Asosiy Vositalar", url: "accounting/asset-management", icon: Building2 },
      { title: "Xarajat Markazlari", url: "fi/cost-centers", icon: Building2 },
      { title: "Transfer Pricing", url: "fi/transfer-pricing", icon: RotateCcw },
      { title: "SOLIQLAR", url: "", icon: FileSpreadsheet, separator: true },
      { title: "Ichki Soliqlar", url: "fi/tax-management", icon: FileSpreadsheet },
      { title: "Soliq Kalendari", url: "fi/tax-calendar", icon: Calendar },
      { title: "CFO BOSHQARUV", url: "", icon: Crown, separator: true },
      { title: "Audit Log", url: "fi/audit-log", icon: ScrollText },
      { title: "Moliyaviy Risk AI", url: "fi/risk-ai", icon: BrainCircuit },
    ],
  },
  tz11: {
    title: "Xodimlar",
    icon: Users,
    defaultUrl: "hr-dashboard",
    items: [
      // ─── TASHKILOT ──────────────────────────────────────────────────────────
      { title: "TASHKILOT", url: "", icon: Network, separator: true },
      { title: "HR Boshqaruv paneli", url: "hr-dashboard", icon: BarChart3 },
      { title: "Org Tuzilma", url: "org-structure/hierarchy", icon: Network },
      { title: "HR Xarita", url: "hr-map", icon: MapPin },
      { title: "AI HR Boshqaruv paneli", url: "ai-hr/dashboard", icon: BrainCircuit },

      // ─── XODIMLAR ──────────────────────────────────────────────────────────
      { title: "XODIMLAR", url: "", icon: Users, separator: true },
      { title: "Xodimlar", url: "employees", icon: Users },

      // ─── REKRUTING ─────────────────────────────────────────────────────────
      { title: "REKRUTING", url: "", icon: UserCheck, separator: true },
      { title: "Ishga qabul voronkasi", url: "hr/recruiting", icon: UserCheck },
      { title: "AI Intervyu", url: "ai-hr/interviews", icon: Mic },
      { title: "Tavsiya Tizimi", url: "hr/referrals", icon: UserPlus },

      // ─── ISH JARAYONI ──────────────────────────────────────────────────────
      { title: "ISH JARAYONI", url: "", icon: Calendar, separator: true },
      { title: "Smena Jadvali", url: "shift-schedule", icon: Calendar },
      { title: "Maqsadlar (OKR)", url: "okr", icon: Target },
      { title: "Kunlik Hisobot", url: "hr/daily-reports", icon: ClipboardList },
      { title: "Aktivlar", url: "assets", icon: Building2 },
      { title: "Bildirishnomalar", url: "notifications", icon: Inbox },

      // ─── KOMPENSATSIYA ─────────────────────────────────────────────────────
      { title: "KOMPENSATSIYA", url: "", icon: DollarSign, separator: true },
      { title: "Maosh", url: "accounting/payroll-automation", icon: DollarSign },
      { title: "Ta'til va Kasallik", url: "hr/vacation-sick", icon: HeartPulse },

      // ─── BAHOLASH VA O'SISH ────────────────────────────────────────────────
      { title: "BAHOLASH VA O'SISH", url: "", icon: Award, separator: true },
      { title: "Xodim Baholash", url: "integration/employee-rating", icon: Award },
      { title: "Ko'nikmalar Matritsasi", url: "skills-matrix", icon: Target },
      { title: "Mentorlik", url: "mentorship", icon: UserCheck },
      { title: "Kasbiy O'sish", url: "hr/career-path", icon: TrendingUp },
      { title: "Succession Planning", url: "hr/succession", icon: RotateCcw },

      // ─── ONBOARDING / OFFBOARDING ──────────────────────────────────────────
      { title: "ONBOARDING / OFFBOARDING", url: "", icon: UserPlus, separator: true },
      { title: "Ishga kiritish (Onboarding)", url: "hr/onboarding", icon: UserPlus },
      { title: "Ishdan bo'shatish", url: "hr/offboarding", icon: UserMinus },

      // ─── NAZORAT VA XAVFSIZLIK ─────────────────────────────────────────────
      { title: "NAZORAT VA XAVFSIZLIK", url: "", icon: ShieldCheck, separator: true },
      { title: "Xavfsizlik", url: "hr/safety", icon: ShieldCheck },
      { title: "Sog'liq Nazorati", url: "hr/health-monitoring", icon: HeartPulse },

      // ─── HR BREND ──────────────────────────────────────────────────────────
      { title: "HR BREND", url: "", icon: Megaphone, separator: true },
      { title: "HR Brend Boshqaruv", url: "hr/brand", icon: Megaphone },
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
      // Mentorlik va Ko'nikmalar matritsasi HR moduliga ko'chirildi (tz11)
      { title: "GAMIFIKATSIYA", url: "", icon: Trophy, separator: true },
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
  tz13: {
    title: "Xavfsizlik",
    icon: Lock,
    defaultUrl: "camera-safety",
    items: [
      { title: "KIRISH NAZORATI", url: "", icon: Fingerprint, separator: true },
      { title: "Xavfsizlik Holati", url: "camera-safety", icon: ShieldCheck },
      { title: "Yuz Tanish Kuzatuv", url: "camera/monitoring", icon: ScanLine },
      { title: "Yuz Ro'yxatdan O'tish", url: "face-registration", icon: UserCog },
      { title: "Davomat", url: "security/attendance", icon: UserCheck },
      { title: "Zona Ruxsatlari", url: "security/zone-access", icon: Lock },
      { title: "KAMERA", url: "", icon: Camera, separator: true },
      { title: "Jonli Monitoring", url: "camera-live-monitoring", icon: Camera },
      // "Kameralar" canon yo'l: tz15 (IoT va Kamera) modulida
      { title: "Hodisalar", url: "camera-alerts", icon: AlertTriangle },
      { title: "HODISALAR VA XAVF", url: "", icon: HardHat, separator: true },
      { title: "PPE Nazorati", url: "security/ppe", icon: HardHat },
      { title: "Xavfli Material", url: "security/hazmat", icon: AlertTriangle },
      { title: "Evakuatsiya Rejasi", url: "security/evacuation", icon: Flame },
      { title: "REYTING", url: "", icon: Star, separator: true },
      { title: "Tashrif Nazorati", url: "security/visitors", icon: UserCheck },
      { title: "Xavfsizlik Reytingi", url: "security/rating", icon: Star },
    ],
  },
};
