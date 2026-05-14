/**
 * @module TopNavigation
 * @description React UI component.
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
  Menu,
  GraduationCap,
  MapPin,
  Factory,
  Package,
  DollarSign,
  Camera,
  TrendingUp,
  ShieldCheck,
  KanbanSquare,
  ChevronDown,
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavigationProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
}

// SAP ERP domenlariga asoslangan menyu guruhlari (O'zbekcha)
const menuGroups = {
  sd: {
    title: "Sotish",
    icon: ShoppingCart,
    items: [
      { title: "Dashboard", url: "sd/dashboard", icon: BarChart3 },
      { title: "Mijozlar", url: "sd/customers", icon: Building2 },
      { title: "Leedlar", url: "crm-workspace?entity=leads&view=kanban", icon: Users },
      { title: "CRM Voronka", url: "crm/funnel", icon: TrendingUp },
      { title: "RFM Klasterlar", url: "crm/rfm", icon: BarChart3 },
      { title: "Kohort Tahlil", url: "crm/cohort", icon: Grid3X3 },
      { title: "Taklifnomalar", url: "sd/sales-quotes", icon: FileText },
      { title: "Buyurtmalar", url: "sd/sales-orders", icon: ShoppingCart },
      { title: "To'lovlar", url: "sd/sales-payments", icon: CreditCard },
      { title: "Shartnomalar", url: "sd/contracts", icon: FileCheck },
      { title: "KPI", url: "sd/kpi", icon: Target },
    ]
  },
  pp: {
    title: "Ishlab chiqarish",
    icon: Factory,
    items: [
      { title: "PP Dashboard", url: "pp/dashboard", icon: BarChart3 },
      { title: "Ishlab chiqarish", url: "erp-production", icon: Factory },
      { title: "Buyurtma Yaratish", url: "order-create", icon: Plus },
      { title: "Rejalashtirish", url: "planning", icon: Calendar },
      { title: "BOM Tarkib", url: "erp/pp/bom", icon: Package },
      { title: "Marshrutlar", url: "erp/pp/routing", icon: Network },
      { title: "Quvvat Rejasi", url: "erp/pp/capacity", icon: TrendingUp },
      { title: "Papka Buyurtmalari", url: "papka-orders", icon: FileText },
      { title: "Kunlik Reja", url: "iot/daily-view", icon: Calendar },
      { title: "Material Kitlar", url: "iot/material-kits", icon: Boxes },
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
      { title: "Xo'jalik", url: "warehouse/hub/MRO-MAIN", icon: Wrench },
      { title: "Yordamchi", url: "warehouse/hub/AUX-MAIN", icon: Beaker },
      { title: "Karantin", url: "warehouse/hub/QC-HOLD", icon: ShieldCheck },
      { title: "Chiqindilar", url: "warehouse/hub/SCRAP", icon: Trash2 },
      { title: "Ombor Dashboard", url: "warehouse/dashboard", icon: BarChart3 },
      { title: "Yetkazuvchilar", url: "mm/vendors", icon: Truck },
      { title: "Xarid Buyurtmalari", url: "mm/purchase-orders", icon: ShoppingCart },
      { title: "Logistika", url: "logistics/dashboard", icon: Activity },
      { title: "Transport Parki", url: "logistics", icon: Truck },
    ]
  },
  buxgalteriya: {
    title: "Buxgalteriya",
    icon: ClipboardList,
    items: [
      { title: "Bosh buxgalter", url: "accounting-dashboard", icon: LayoutDashboard },
      { title: "Ish haqi hisobi", url: "accounting/payroll", icon: DollarSign },
      { title: "Ombor hisobi", url: "accounting/materials", icon: Package },
      { title: "Debitorlar", url: "accounting/ar", icon: Users },
      { title: "Kreditorlar", url: "accounting/ap", icon: Truck },
      { title: "GL Hujjatlar", url: "accounting/gl-documents", icon: FileText },
      { title: "Hisoblar rejasi", url: "accounting/chart-of-accounts", icon: BookOpen },
      { title: "Davr yopish", url: "accounting/period-closing", icon: Calendar },
    ]
  },
  moliya: {
    title: "Moliya",
    icon: TrendingUp,
    items: [
      { title: "CFO Dashboard", url: "cfo-dashboard", icon: BarChart3 },
      { title: "Pul oqimi", url: "finance/cashflow", icon: DollarSign },
      { title: "Byudjet rejasi", url: "finance/budgets", icon: Target },
      { title: "Buyurtma tannarxi", url: "finance/order-costing", icon: Calculator },
      { title: "Foyda tahlili", url: "finance/profitability", icon: TrendingUp },
      { title: "Moliyaviy hisobotlar", url: "finance/reports", icon: FileCheck },
      { title: "Eski Dashboard", url: "finance-dashboard", icon: LayoutDashboard },
    ]
  },
  hr: {
    title: "HR",
    icon: Users,
    items: [
      { title: "HR Dashboard", url: "hr-dashboard", icon: BarChart3 },
      { title: "Xodimlar", url: "employees", icon: Users },
      { title: "Adaptatsiya", url: "adaptation", icon: GraduationCap },
      { title: "Tashkiliy Tuzilma", url: "org-structure/hierarchy", icon: Network },
      { title: "Tuzilma Yaratish", url: "org-structure/builder", icon: Settings },
      { title: "7 Funksiya", url: "seven-functions", icon: Crown },
      { title: "RACI Matritsasi", url: "raci-matrix", icon: Grid3X3 },
      { title: "Biznes Salomatligi", url: "business-health", icon: Heart },
      { title: "Smena Jadvali", url: "shift-schedule", icon: Calendar },
      { title: "Intizom", url: "discipline", icon: FileText },
      { title: "HR Xarita", url: "hr-map", icon: MapPin },
      { title: "Anketa", url: "questionnaire", icon: FileQuestion },
      { title: "Anketa Shablonlari", url: "questionnaire-templates", icon: ClipboardCheck },
      { title: "Maqsadlar", url: "goals", icon: Target },
      { title: "AI HR Dashboard", url: "ai-hr/dashboard", icon: BrainCircuit },
      { title: "AI Intervyu", url: "ai-hr/interviews", icon: BrainCircuit },
      { title: "Vorislik Rejalash", url: "hr/succession-planning", icon: Crown },
      { title: "Kunlik Hisobotlar", url: "hr/daily-reports", icon: ClipboardList },
      { title: "Gamifikatsiya", url: "hr/gamification", icon: Trophy },
      { title: "Hujjat Ish Oqimi", url: "hr/documents", icon: FileCheck },
      { title: "Karyera Yo'li", url: "hr/career-path", icon: TrendingUp },
      { title: "PIP Rejalar", url: "hr/pip", icon: Target },
      { title: "eNPS So'rovlar", url: "hr/enps", icon: MessageSquare },
      { title: "Recruiter KPI", url: "hr/recruiter-kpi", icon: BarChart3 },
      { title: "Qabulxona", url: "hr/reception", icon: UserCheck },
      { title: "Offboarding", url: "hr/offboarding", icon: UserX },
    ]
  },
  lms: {
    title: "Ta'lim",
    icon: GraduationCap,
    items: [
      { title: "LMS Dashboard", url: "lms-dashboard", icon: BarChart3 },
      { title: "Kurslar", url: "courses", icon: BookOpen },
      { title: "HR Capital Kurslar", url: "hr-capital/courses", icon: GraduationCap },
      { title: "Testlar", url: "tests", icon: ClipboardList },
      { title: "Imtihonlar", url: "all-exams", icon: FileCheck },
      { title: "AI Imtihonlar", url: "ai-exams", icon: BrainCircuit },
      { title: "Sertifikatlar", url: "certificates", icon: Award },
      { title: "Mentorlik", url: "mentorship", icon: UserCheck },
      { title: "Ko'nikmalar", url: "skills-matrix", icon: Target },
      { title: "Tadbirlar", url: "events-calendar", icon: Calendar },
      { title: "LMS Statistika", url: "analytics", icon: BarChart3 },
    ]
  },
  ai: {
    title: "AI Texnologiya",
    icon: Cpu,
    items: [
      { title: "Bilimlar Bazasi", url: "knowledge-base", icon: BrainCircuit },
      { title: "Forecast Tahlil", url: "ai/forecast", icon: TrendingUp },
      { title: "Kamera Dashboard", url: "camera-dashboard", icon: BarChart3 },
      { title: "Kameralar", url: "cameras", icon: Camera },
      { title: "Xavfsizlik", url: "camera-safety", icon: ShieldCheck },
      { title: "Sifat Nazorati", url: "camera-quality", icon: FileCheck },
      { title: "Xodim Monitoring", url: "camera-employees", icon: Users },
      { title: "Mashina Holati", url: "camera-machines", icon: Factory },
      { title: "Ogohlantirishlar", url: "camera-alerts", icon: MessageSquare },
      { title: "Kamera Hisobotlar", url: "camera-reports", icon: FileText },
      { title: "Issiqlik Xaritasi", url: "camera-heatmap", icon: MapPin },
      { title: "Xodim Reytingi", url: "camera-employee-ratings", icon: Trophy },
      { title: "Kamera Sozlamalari", url: "camera-settings", icon: Settings },
      { title: "Jonli Monitoring", url: "camera-live-monitoring", icon: Camera },
      { title: "Yuz Kuzatuv", url: "camera/monitoring", icon: Camera },
      { title: "Yuz Ro'yxatdan", url: "face-registration", icon: ScanLine },
      { title: "Xodim Kuzatuv", url: "employee-tracking", icon: UserCog },
      { title: "ERP Kameralar", url: "erp-cameras", icon: Camera },
      { title: "Xodim Hisobotlar", url: "erp/cameras/reports", icon: FileText },
      { title: "Harorat Xaritasi", url: "erp/cameras/heatmap", icon: MapPin },
      { title: "IoT Dashboard", url: "iot/dashboard", icon: BarChart3 },
      { title: "Tablet PWA", url: "iot/tablet", icon: Tablet },
      { title: "Dizayn Dashboard", url: "design/dashboard", icon: Palette },
      { title: "AI Generator", url: "design/generator", icon: Sparkles },
      { title: "Dizayn Buyurtmalar", url: "design/orders", icon: Package },
      { title: "Dizayn Kutubxona", url: "design/library", icon: Library },
    ]
  },
  xavfsizlik: {
    title: "Xavfsizlik",
    icon: ShieldCheck,
    items: [
      { title: "Xavfsizlik Paneli", url: "security/dashboard", icon: ShieldCheck },
      { title: "Kirish Jurnali", url: "security", icon: ScanLine },
      { title: "MRO Dashboard", url: "integration/mro", icon: Wrench },
      { title: "Kamera Xavfsizlik", url: "camera-safety", icon: Camera },
    ]
  },
  director: {
    title: "Rahbariyat",
    icon: Crown,
    items: [
      { title: "Direktor Paneli", url: "europrint/director", icon: Crown },
      { title: "Auditor", url: "europrint/auditor", icon: FileCheck },
      { title: "Buxgalter Ko'rinish", url: "europrint/accountant", icon: DollarSign },
      { title: "Super Admin", url: "super-admin", icon: Settings },
      { title: "Tizim Monitoring", url: "system-monitor", icon: Activity },
      { title: "Telegram Bot", url: "telegram-bot", icon: MessageSquare },
      { title: "Integratsiyalar", url: "integrations", icon: Zap },
      { title: "Mijozlar Sayti API", url: "customer-portal", icon: Globe },
      { title: "QC Moduli", url: "qc/dashboard", icon: ClipboardCheck },
    ]
  },
  other: {
    title: "Boshqalar",
    icon: Settings,
    items: [
      { title: "Arizalar", url: "applications", icon: FileText },
      { title: "Sozlamalar", url: "settings", icon: Settings },
    ]
  },
};

// Barcha elementlar (mobile menu uchun)
const allMenuItems = Object.values(menuGroups).flatMap(group => group.items);

// Module-specific colors for SAP domains
const moduleColors: Record<string, { icon: string; bg: string; hover: string; border: string; activeItem: string }> = {
  sd: {
    icon: "text-module-sd",
    bg: "bg-module-sd-light dark:bg-module-sd/10",
    hover: "hover:bg-module-sd-light dark:hover:bg-module-sd/20",
    border: "border-module-sd/30 dark:border-module-sd/30",
    activeItem: "bg-module-sd text-white"
  },
  pp: {
    icon: "text-module-pp",
    bg: "bg-module-pp-light dark:bg-module-pp/10",
    hover: "hover:bg-module-pp-light dark:hover:bg-module-pp/20",
    border: "border-module-pp/30 dark:border-module-pp/30",
    activeItem: "bg-module-pp text-white"
  },
  mm: {
    icon: "text-module-warehouse",
    bg: "bg-module-warehouse-light dark:bg-module-warehouse/10",
    hover: "hover:bg-module-warehouse-light dark:hover:bg-module-warehouse/20",
    border: "border-module-warehouse/30 dark:border-module-warehouse/30",
    activeItem: "bg-module-warehouse text-white"
  },
  buxgalteriya: {
    icon: "text-[var(--ep-blue)] dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    hover: "hover:bg-indigo-100 dark:hover:bg-indigo-500/20",
    border: "border-indigo-200 dark:border-indigo-500/30",
    activeItem: "bg-[var(--ep-blue)] text-white"
  },
  moliya: {
    icon: "text-module-fi",
    bg: "bg-module-fi-light dark:bg-module-fi/10",
    hover: "hover:bg-module-fi-light dark:hover:bg-module-fi/20",
    border: "border-module-fi/30 dark:border-module-fi/30",
    activeItem: "bg-module-fi text-white"
  },
  hr: {
    icon: "text-module-hr",
    bg: "bg-module-hr-light dark:bg-module-hr/10",
    hover: "hover:bg-module-hr-light dark:hover:bg-module-hr/20",
    border: "border-module-hr/30 dark:border-module-hr/30",
    activeItem: "bg-module-hr text-white"
  },
  lms: {
    icon: "text-[var(--ep-purple)] dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    hover: "hover:bg-purple-100 dark:hover:bg-purple-500/20",
    border: "border-purple-300/30 dark:border-purple-500/30",
    activeItem: "bg-[var(--ep-purple)] text-white"
  },
  ai: {
    icon: "text-primary",
    bg: "bg-primary/5 dark:bg-primary/10",
    hover: "hover:bg-primary/10 dark:hover:bg-primary/20",
    border: "border-primary/20 dark:border-primary/30",
    activeItem: "bg-primary text-white"
  },
  other: {
    icon: "text-muted-foreground",
    bg: "bg-muted/50 dark:bg-muted/20",
    hover: "hover:bg-muted dark:hover:bg-muted/40",
    border: "border-border/50",
    activeItem: "bg-muted-foreground text-white"
  },
};

export function TopNavigation({ activePage = "analytics", onNavigate }: TopNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation("navigation");

  return (
    <div className="flex items-center w-full">
      {/* Desktop Navigation Menu - Dropdown Groups */}
      <div className="hidden lg:flex items-center justify-between w-full gap-2">
        {Object.entries(menuGroups).map(([key, group]) => {
          const colors = moduleColors[key] || moduleColors.other;
          return (
            <DropdownMenu key={key}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 gap-2 font-semibold transition-all duration-200 text-base flex-1 justify-center min-w-0 px-3",
                    colors.bg,
                    colors.hover,
                    colors.border
                  )}
                  data-testid={`dropdown-${key}`}
                >
                  <group.icon className={cn("h-4 w-4 shrink-0", colors.icon)} />
                  <span className="truncate">{t(group.title)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full sm:w-[280px] max-h-[70vh] overflow-y-auto">
                <div className={cn("px-3 py-2 mb-1 border-b border-border/50", colors.bg)}>
                  <span className={cn("text-xs font-semibold", colors.icon)}>{t(group.title)}</span>
                </div>
                {(Array.isArray(group.items) ? group.items : []).map((item) => (
                  <DropdownMenuItem key={item.url} asChild>
                    <a
                      href={`/${item.url}`}
                      data-testid={`link-${item.url}`}
                      className={cn(
                        "flex items-center gap-3 cursor-pointer py-2",
                        activePage === item.url && colors.activeItem
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        activePage === item.url ? "text-inherit" : colors.icon
                      )} />
                      <span className="text-sm">{t(item.title)}</span>
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>

      {/* Mobile Menu Button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-mobile-menu">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {Object.entries(menuGroups).map(([key, group]) => {
                  const colors = moduleColors[key] || moduleColors.other;
                  return (
                    <div key={key} className="space-y-2">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md",
                        colors.bg
                      )}>
                        <group.icon className={cn("h-4 w-4", colors.icon)} />
                        <h3 className="text-xs font-semibold uppercase tracking-wider">
                          {t(group.title)}
                        </h3>
                      </div>
                      <div className="space-y-0.5">
                        {(Array.isArray(group.items) ? group.items : []).map((item) => (
                          <a
                            key={item.url}
                            href={`/${item.url}`}
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid={`link-mobile-${item.url}`}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                              activePage === item.url
                                ? colors.activeItem + " shadow-sm"
                                : "text-foreground hover:bg-muted"
                            )}
                          >
                            <item.icon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              activePage === item.url ? "text-inherit" : colors.icon
                            )} />
                            <span>{t(item.title)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
