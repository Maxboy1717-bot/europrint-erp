/**
 * @module TopNavigationData
 * @description Navigation menu data constants extracted from TopNavigation.tsx (Rule 16).
 * Icon imports and menuGroups kept here; component and colors remain in TopNavigation.tsx.
 * i18next — strings wrapped with tLabel for runtime translation.
 */

import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  FileText,
  BrainCircuit,
  FileQuestion,
  Award,
  Building2,
  Briefcase,
  MessageSquare,
  FileCheck,
  Trophy,
  Target,
  Calendar,
  UserCheck,
  Network,
  GraduationCap,
  MapPin,
  Factory,
  Package,
  DollarSign,
  Camera,
  TrendingUp,
  ShieldCheck,
  KanbanSquare,
  Palette,
  Sparkles,
  Library,
  Truck,
  ShoppingCart,
  CreditCard,
  Tablet,
  Calculator,
  Cpu,
  Plus,
  ScanLine,
  Crown,
  Grid3X3,
  Heart,
  UserCog,
  Activity,
  Boxes,
  ClipboardCheck,
  PackagePlus,
  Lock,
  Link2,
  Barcode,
  ScrollText,
  Wrench,
  Beaker,
  Trash2,
  Zap,
  Globe,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tLabel } from "@/lib/i18n/tLabel";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

// SAP ERP domenlariga asoslangan menyu guruhlari (O'zbekcha)
export const menuGroups: Record<string, NavGroup> = {
  sd: {
    title: "Sotish",
    icon: ShoppingCart,
    items: [
      { title: "Dashboard", url: "sd/dashboard", icon: BarChart3 },
      { title: tLabel("navigation.topSdMijozlar", "Mijozlar"), url: "sd/customers", icon: Building2 },
      { title: tLabel("navigation.topSdLeedlar", "Leedlar"), url: "crm-workspace?entity=leads&view=kanban", icon: Users },
      { title: "CRM Voronka", url: "crm/funnel", icon: TrendingUp },
      { title: tLabel("navigation.topSdRfmKlasterlar", "RFM Klasterlar"), url: "crm/rfm", icon: BarChart3 },
      { title: tLabel("navigation.topSdKohortTahlil", "Kohort Tahlil"), url: "crm/cohort", icon: Grid3X3 },
      { title: tLabel("navigation.topSdTaklifnomalar", "Taklifnomalar"), url: "sd/sales-quotes", icon: FileText },
      { title: tLabel("navigation.topSdBuyurtmalar", "Buyurtmalar"), url: "sd/sales-orders", icon: ShoppingCart },
      { title: tLabel("navigation.topSdTolovlar", "To'lovlar"), url: "sd/sales-payments", icon: CreditCard },
      { title: tLabel("navigation.topSdShartnomalar", "Shartnomalar"), url: "sd/contracts", icon: FileCheck },
      { title: "KPI", url: "sd/kpi", icon: Target },
    ]
  },
  pp: {
    title: tLabel("navigation.topPpModule", "Ishlab chiqarish"),
    icon: Factory,
    items: [
      { title: "PP Dashboard", url: "pp/dashboard", icon: BarChart3 },
      { title: tLabel("navigation.topPpIshlabChiqarish", "Ishlab chiqarish"), url: "erp-production", icon: Factory },
      { title: tLabel("navigation.topPpBuyurtmaYaratish", "Buyurtma Yaratish"), url: "order-create", icon: Plus },
      { title: tLabel("navigation.topPpRejalashtirish", "Rejalashtirish"), url: "planning", icon: Calendar },
      { title: "BOM Tarkib", url: "erp/pp/bom", icon: Package },
      { title: tLabel("navigation.topPpMarshrutlar", "Marshrutlar"), url: "erp/pp/routing", icon: Network },
      { title: "Quvvat Rejasi", url: "erp/pp/capacity", icon: TrendingUp },
      { title: "Papka Buyurtmalari", url: "papka-orders", icon: FileText },
      { title: "Kunlik Reja", url: "iot/daily-view", icon: Calendar },
      { title: tLabel("navigation.topPpMaterialKitlar", "Material Kitlar"), url: "iot/material-kits", icon: Boxes },
      { title: "IoT Jonli", url: "iot/live", icon: Activity },
      { title: "Imposition Hisob", url: "print/imposition", icon: Calculator },
      { title: "Siyoh Qoplama", url: "print/ink-coverage", icon: Palette },
    ]
  },
  mm: {
    title: "Ombor",
    icon: Package,
    items: [
      { title: "Xom ashyo", url: "warehouse/hub/RM-MAIN", icon: Package },
      { title: "Rulon", url: "warehouse/hub/RM-ROLLS", icon: ScrollText },
      { title: "Tayyor mahsulot", url: "warehouse/hub/FG-MAIN", icon: Boxes },
      { title: tLabel("navigation.topMmXojalik", "Xo'jalik"), url: "warehouse/hub/MRO-MAIN", icon: Wrench },
      { title: "Yordamchi", url: "warehouse/hub/AUX-MAIN", icon: Beaker },
      { title: "Karantin", url: "warehouse/hub/QC-HOLD", icon: ShieldCheck },
      { title: tLabel("navigation.topMmChiqindilar", "Chiqindilar"), url: "warehouse/hub/SCRAP", icon: Trash2 },
      { title: "Ombor Dashboard", url: "warehouse/dashboard", icon: BarChart3 },
      { title: tLabel("navigation.topMmYetkazuvchilar", "Yetkazuvchilar"), url: "mm/vendors", icon: Truck },
      { title: "Xarid Buyurtmalari", url: "mm/purchase-orders", icon: ShoppingCart },
      { title: "Logistika", url: "logistics/dashboard", icon: Activity },
      { title: "Transport Parki", url: "logistics", icon: Truck },
    ]
  },
  buxgalteriya: {
    title: tLabel("navigation.topBuxgalteriyaModule", "Buxgalteriya"),
    icon: ClipboardList,
    items: [
      { title: "Bosh buxgalter", url: "accounting-dashboard", icon: LayoutDashboard },
      { title: "Ish haqi hisobi", url: "accounting/payroll", icon: DollarSign },
      { title: "Ombor hisobi", url: "accounting/materials", icon: Package },
      { title: tLabel("navigation.topBuxgalteriyaDebitorlar", "Debitorlar"), url: "accounting/ar", icon: Users },
      { title: tLabel("navigation.topBuxgalteriyaKreditorlar", "Kreditorlar"), url: "accounting/ap", icon: Truck },
      { title: tLabel("navigation.topBuxgalteriyaGlHujjatlar", "GL Hujjatlar"), url: "accounting/gl-documents", icon: FileText },
      { title: tLabel("navigation.topBuxgalteriyaHisoblarRejasi", "Hisoblar rejasi"), url: "accounting/chart-of-accounts", icon: BookOpen },
      { title: tLabel("navigation.topBuxgalteriyaDavrYopish", "Davr yopish"), url: "accounting/period-closing", icon: Calendar },
    ]
  },
  moliya: {
    title: "Moliya",
    icon: TrendingUp,
    items: [
      { title: "CFO Dashboard", url: "cfo-dashboard", icon: BarChart3 },
      { title: "Pul oqimi", url: "finance/cashflow", icon: DollarSign },
      { title: "Byudjet rejasi", url: "finance/budgets", icon: Target },
      { title: tLabel("navigation.topMoliyaBuyurtmaTannarxi", "Buyurtma tannarxi"), url: "finance/order-costing", icon: Calculator },
      { title: tLabel("navigation.topMoliyaFoydaTahlili", "Foyda tahlili"), url: "finance/profitability", icon: TrendingUp },
      { title: tLabel("navigation.topMoliyaMoliyaviyHisobotlar", "Moliyaviy hisobotlar"), url: "finance/reports", icon: FileCheck },
      { title: "Eski Dashboard", url: "finance-dashboard", icon: LayoutDashboard },
    ]
  },
  hr: {
    title: "HR",
    icon: Users,
    items: [
      { title: "HR Dashboard", url: "hr-dashboard", icon: BarChart3 },
      { title: tLabel("navigation.topHrXodimlar", "Xodimlar"), url: "employees", icon: Users },
      { title: "Adaptatsiya", url: "adaptation", icon: GraduationCap },
      { title: "Tashkiliy Tuzilma", url: "org-structure/hierarchy", icon: Network },
      { title: tLabel("navigation.topHrTuzilmaYaratish", "Tuzilma Yaratish"), url: "org-structure/builder", icon: Settings },
      { title: "7 Funksiya", url: "seven-functions", icon: Crown },
      { title: "RACI Matritsasi", url: "raci-matrix", icon: Grid3X3 },
      { title: "Biznes Salomatligi", url: "business-health", icon: Heart },
      { title: tLabel("navigation.topHrSmenaJadvali", "Smena Jadvali"), url: "shift-schedule", icon: Calendar },
      { title: "Intizom", url: "discipline", icon: FileText },
      { title: "HR Xarita", url: "hr-map", icon: MapPin },
      { title: "Anketa", url: "questionnaire", icon: FileQuestion },
      { title: "Anketa Shablonlari", url: "questionnaire-templates", icon: ClipboardCheck },
      { title: tLabel("navigation.topHrMaqsadlar", "Maqsadlar"), url: "goals", icon: Target },
      { title: "AI HR Dashboard", url: "ai-hr/dashboard", icon: BrainCircuit },
      { title: "AI Intervyu", url: "ai-hr/interviews", icon: BrainCircuit },
      { title: "Vorislik Rejalash", url: "hr/succession-planning", icon: Crown },
      { title: tLabel("navigation.topHrKunlikHisobotlar", "Kunlik Hisobotlar"), url: "hr/daily-reports", icon: ClipboardList },
      { title: "Gamifikatsiya", url: "hr/gamification", icon: Trophy },
      { title: tLabel("navigation.topHrHujjatIshOqimi", "Hujjat Ish Oqimi"), url: "hr/documents", icon: FileCheck },
      { title: tLabel("navigation.topHrKaryeraYoli", "Karyera Yo'li"), url: "hr/career-path", icon: TrendingUp },
      { title: tLabel("navigation.topHrPipRejalar", "PIP Rejalar"), url: "hr/pip", icon: Target },
      { title: tLabel("navigation.topHrEnpsSorovlar", "eNPS So'rovlar"), url: "hr/enps", icon: MessageSquare },
      { title: "Recruiter KPI", url: "hr/recruiter-kpi", icon: BarChart3 },
      { title: "Qabulxona", url: "hr/reception", icon: UserCheck },
      { title: "Offboarding", url: "hr/offboarding", icon: UserX },
    ]
  },
  lms: {
    title: tLabel("navigation.topLmsModule", "Ta'lim"),
    icon: GraduationCap,
    items: [
      { title: "LMS Dashboard", url: "lms-dashboard", icon: BarChart3 },
      { title: tLabel("navigation.topLmsKurslar", "Kurslar"), url: "courses", icon: BookOpen },
      { title: tLabel("navigation.topLmsHrCapitalKurslar", "HR Capital Kurslar"), url: "hr-capital/courses", icon: GraduationCap },
      { title: tLabel("navigation.topLmsTestlar", "Testlar"), url: "tests", icon: ClipboardList },
      { title: tLabel("navigation.topLmsImtihonlar", "Imtihonlar"), url: "all-exams", icon: FileCheck },
      { title: tLabel("navigation.topLmsAiImtihonlar", "AI Imtihonlar"), url: "ai-exams", icon: BrainCircuit },
      { title: tLabel("navigation.topLmsSertifikatlar", "Sertifikatlar"), url: "certificates", icon: Award },
      { title: "Mentorlik", url: "mentorship", icon: UserCheck },
      { title: tLabel("navigation.topLmsKonikmalar", "Ko'nikmalar"), url: "skills-matrix", icon: Target },
      { title: tLabel("navigation.topLmsTadbirlar", "Tadbirlar"), url: "events-calendar", icon: Calendar },
      { title: tLabel("navigation.topLmsLmsStatistika", "LMS Statistika"), url: "analytics", icon: BarChart3 },
    ]
  },
  ai: {
    title: "AI Texnologiya",
    icon: Cpu,
    items: [
      { title: tLabel("navigation.topAiBilimlarBazasi", "Bilimlar Bazasi"), url: "knowledge-base", icon: BrainCircuit },
      { title: "Forecast Tahlil", url: "ai/forecast", icon: TrendingUp },
      { title: "Kamera Dashboard", url: "camera-dashboard", icon: BarChart3 },
      { title: tLabel("navigation.topAiKameralar", "Kameralar"), url: "cameras", icon: Camera },
      { title: tLabel("navigation.topAiXavfsizlik", "Xavfsizlik"), url: "camera-safety", icon: ShieldCheck },
      { title: "Sifat Nazorati", url: "camera-quality", icon: FileCheck },
      { title: tLabel("navigation.topAiXodimMonitoring", "Xodim Monitoring"), url: "camera-employees", icon: Users },
      { title: "Mashina Holati", url: "camera-machines", icon: Factory },
      { title: tLabel("navigation.topAiOgohlantirishlar", "Ogohlantirishlar"), url: "camera-alerts", icon: MessageSquare },
      { title: tLabel("navigation.topAiKameraHisobotlar", "Kamera Hisobotlar"), url: "camera-reports", icon: FileText },
      { title: "Issiqlik Xaritasi", url: "camera-heatmap", icon: MapPin },
      { title: tLabel("navigation.topAiXodimReytingi", "Xodim Reytingi"), url: "camera-employee-ratings", icon: Trophy },
      { title: "Kamera Sozlamalari", url: "camera-settings", icon: Settings },
      { title: "Jonli Monitoring", url: "camera-live-monitoring", icon: Camera },
      { title: "Yuz Kuzatuv", url: "camera/monitoring", icon: Camera },
      { title: tLabel("navigation.topAiYuzRoyxatdan", "Yuz Ro'yxatdan"), url: "face-registration", icon: ScanLine },
      { title: tLabel("navigation.topAiXodimKuzatuv", "Xodim Kuzatuv"), url: "employee-tracking", icon: UserCog },
      { title: tLabel("navigation.topAiErpKameralar", "ERP Kameralar"), url: "erp-cameras", icon: Camera },
      { title: tLabel("navigation.topAiXodimHisobotlar", "Xodim Hisobotlar"), url: "erp/cameras/reports", icon: FileText },
      { title: "Harorat Xaritasi", url: "erp/cameras/heatmap", icon: MapPin },
      { title: "IoT Dashboard", url: "iot/dashboard", icon: BarChart3 },
      { title: "Tablet PWA", url: "iot/tablet", icon: Tablet },
      { title: "Dizayn Dashboard", url: "design/dashboard", icon: Palette },
      { title: "AI Generator", url: "design/generator", icon: Sparkles },
      { title: tLabel("navigation.topAiDizaynBuyurtmalar", "Dizayn Buyurtmalar"), url: "design/orders", icon: Package },
      { title: "Dizayn Kutubxona", url: "design/library", icon: Library },
    ]
  },
  xavfsizlik: {
    title: tLabel("navigation.topXavfsizlikModule", "Xavfsizlik"),
    icon: ShieldCheck,
    items: [
      { title: tLabel("navigation.topXavfsizlikXavfsizlikPaneli", "Xavfsizlik Paneli"), url: "security/dashboard", icon: ShieldCheck },
      { title: "Kirish Jurnali", url: "security", icon: ScanLine },
      { title: "MRO Dashboard", url: "integration/mro", icon: Wrench },
      { title: tLabel("navigation.topXavfsizlikKameraXavfsizlik", "Kamera Xavfsizlik"), url: "camera-safety", icon: Camera },
    ]
  },
  director: {
    title: "Rahbariyat",
    icon: Crown,
    items: [
      { title: tLabel("navigation.topDirectorDirektorPaneli", "Direktor Paneli"), url: "europrint/director", icon: Crown },
      { title: "Auditor", url: "europrint/auditor", icon: FileCheck },
      { title: tLabel("navigation.topDirectorBuxgalterKorinish", "Buxgalter Ko'rinish"), url: "europrint/accountant", icon: DollarSign },
      { title: "Super Admin", url: "super-admin", icon: Settings },
      { title: "Tizim Monitoring", url: "system-monitor", icon: Activity },
      { title: "Telegram Bot", url: "telegram-bot", icon: MessageSquare },
      { title: tLabel("navigation.topDirectorIntegratsiyalar", "Integratsiyalar"), url: "integrations", icon: Zap },
      { title: tLabel("navigation.topDirectorMijozlarSaytiApi", "Mijozlar Sayti API"), url: "customer-portal", icon: Globe },
      { title: "QC Moduli", url: "qc/dashboard", icon: ClipboardCheck },
    ]
  },
  other: {
    title: tLabel("navigation.topOtherModule", "Boshqalar"),
    icon: Settings,
    items: [
      { title: tLabel("navigation.topOtherArizalar", "Arizalar"), url: "applications", icon: FileText },
      { title: tLabel("navigation.topOtherSozlamalar", "Sozlamalar"), url: "settings", icon: Settings },
    ]
  },
};

// Barcha elementlar (mobile menu uchun)
export const allMenuItems = Object.values(menuGroups).flatMap(group => group.items);
