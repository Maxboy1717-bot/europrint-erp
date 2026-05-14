/**
 * @module EuroprintControlCenter
 * @description Route-level page component. Orchestrates queries, builds module
 * data arrays, and composes all sub-sections into the Nazorat Markazi layout.
 */

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Database,
  CheckCircle,
  FileSearch,
  TrendingUp,
  Settings,
  Users,
  Lock,
  RefreshCw,
  GitBranch,
  FileEdit,
  UserCheck,
  BookOpen,
  Calculator,
  Target,
  Inbox,
  Layout,
  Link2,
  History,
  Calendar,
  Layers,
  Package,
  Coins,
} from "lucide-react";
import type {
  BusinessRule,
  UnitOfMeasure,
  ValidationRule,
  KpiDefinition,
  SapPatternSummary,
  AllRulesSummary,
} from "./EuroprintControlCenterTypes";
import {
  CompanyStatePanel,
  ModulesGrid,
  SapPatternsGrid,
  NonBypassableGrid,
} from "./EuroprintControlCenterSections";
import { ControlCenterTabs } from "./EuroprintControlCenterTabs";
import { EPErrorState, EPPageHeader } from "@/components/ep";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function EuroprintControlCenter() {
  const { data: businessRules = [], isLoading: rulesLoading, isError, refetch } =
    useQuery<BusinessRule[]>({ queryKey: ["/api/europrint-control/business-rules"] });

  const { data: units = [], isLoading: unitsLoading } =
    useQuery<UnitOfMeasure[]>({ queryKey: ["/api/europrint-control/units"] });

  const { data: validationRules = [], isLoading: validationLoading } =
    useQuery<ValidationRule[]>({ queryKey: ["/api/europrint-control/validation-rules"] });

  const { data: kpis = [], isLoading: kpisLoading } =
    useQuery<KpiDefinition[]>({ queryKey: ["/api/europrint-control/kpis"] });

  const { data: auditorData } = useQuery<{ deletedRecords: number; overrides: number; reversals: number }>({
    queryKey: ["/api/europrint-control/auditor-dashboard"],
  });

  const { data: sapPatterns, isLoading: sapLoading } =
    useQuery<SapPatternSummary>({ queryKey: ["/api/europrint-control/sap-patterns-summary"] });

  const { data: allRules, isLoading: allRulesLoading } =
    useQuery<AllRulesSummary>({ queryKey: ["/api/europrint-control/all-rules-summary"] });

  const isLoading = rulesLoading || unitsLoading || validationLoading || kpisLoading || sapLoading;

  // -------------------------------------------------------------------------
  // Core module cards
  // -------------------------------------------------------------------------

  const modules = [
    {
      id: "hard-control", title: "Qattiq Nazorat",
      description: "Manfiy qoldiq va byudjet limitini bloklash",
      icon: Lock, color: "text-[var(--ep-red)]", bgColor: "bg-red-500/10",
      count: (Array.isArray(businessRules) ? businessRules : []).filter(r => r.ruleType === "block").length,
      label: "Bloklash qoidalari",
    },
    {
      id: "ssot", title: "Yagona Manba (SSOT)",
      description: "O'lchov birliklari va mahsulot ma'lumotnomalari",
      icon: Database, color: "text-[var(--ep-blue)]", bgColor: "bg-blue-500/10",
      count: units.length, label: "O'lchov birliklari",
    },
    {
      id: "validator", title: "ERP Tekshiruvchi",
      description: "Mantiqiy xatolarni avtomatik aniqlash",
      icon: CheckCircle, color: "text-[var(--ep-green)]", bgColor: "bg-green-500/10",
      count: validationRules.length, label: "Tekshirish qoidalari",
    },
    {
      id: "auditor", title: "Auditor Rejimi",
      description: "O'chirilganlar va override tarixi",
      icon: FileSearch, color: "text-[var(--ep-purple)]", bgColor: "bg-purple-500/10",
      count: (auditorData?.deletedRecords ?? 0) + (auditorData?.overrides ?? 0),
      label: "Audit yozuvlari",
    },
    {
      id: "kpi", title: "KPI va Ogohlantirishlar",
      description: "Limitdan oshganda blok yoki alert",
      icon: TrendingUp, color: "text-[var(--ep-primary)]", bgColor: "bg-orange-500/10",
      count: kpis.length, label: "KPI ko'rsatkichlari",
    },
    {
      id: "config", title: "Sozlamalar (Config)",
      description: "Qoidalar jadvalda, kod emas",
      icon: Settings, color: "text-[var(--ep-cyan)]", bgColor: "bg-cyan-500/10",
      count: businessRules.length + validationRules.length, label: "Jami qoidalar",
    },
    {
      id: "roles", title: "Rol Asosidagi Ko'rinish",
      description: "Direktor, Buxgalter, Operator menyulari",
      icon: Users, color: "text-[var(--ep-blue)]", bgColor: "bg-indigo-500/10",
      count: 4, label: "Foydalanuvchi rollari",
    },
  ];

  // -------------------------------------------------------------------------
  // SAP pattern cards
  // -------------------------------------------------------------------------

  const sapModules = [
    { id: "doc-lifecycle", title: "Hujjat Hayoti", titleRu: "Жизненный цикл",
      description: "Draft → Submitted → Approved → Posted → Closed → Reversed",
      icon: GitBranch, color: "text-[var(--ep-green)]", bgColor: "bg-emerald-500/10",
      count: sapPatterns?.documentLifecycle?.count ?? 0, label: "Hujjatlar" },
    { id: "change-mgmt", title: "O'zgarish Boshqaruvi", titleRu: "Управление изменениями",
      description: "Narx/formula/limit o'zgarishlarini nazorat qilish",
      icon: FileEdit, color: "text-[var(--ep-yellow)]", bgColor: "bg-amber-500/10",
      count: sapPatterns?.changeRequests?.count ?? 0, label: "So'rovlar" },
    { id: "sod", title: "Vazifalar Ajratish", titleRu: "Разделение обязанностей",
      description: "Creator ≠ Approver ≠ Payer qoidalari",
      icon: UserCheck, color: "text-[var(--ep-red)]", bgColor: "bg-rose-500/10",
      count: sapPatterns?.separationOfDuties?.count ?? 0, label: "SoD qoidalari" },
    { id: "posting-engine", title: "GL Yozuv Mexanizmi", titleRu: "Модуль проводок",
      description: "Barcha GL yozuvlari markaziy joydan",
      icon: Calculator, color: "text-[var(--ep-blue)]", bgColor: "bg-sky-500/10",
      count: sapPatterns?.postingEngine?.count ?? 0, label: "GL yozuvlari" },
    { id: "cost-objects", title: "Xarajat Ob'ektlari", titleRu: "Объекты затрат",
      description: "Loyiha/buyurtma/partiya xarajatlari",
      icon: Target, color: "text-[var(--ep-purple)]", bgColor: "bg-violet-500/10",
      count: sapPatterns?.costObjects?.count ?? 0, label: "Ob'ektlar" },
    { id: "sop", title: "SOP Shablonlari", titleRu: "Шаблоны СОП",
      description: "Majburiy qadamlar va checklistlar",
      icon: BookOpen, color: "text-[var(--ep-cyan)]", bgColor: "bg-teal-500/10",
      count: sapPatterns?.sops?.count ?? 0, label: "Shablonlar" },
    { id: "role-ui", title: "Rol UI Sozlamalari", titleRu: "UI по ролям",
      description: "Har bir rol uchun interfeys sozlamalari",
      icon: Layout, color: "text-pink-500", bgColor: "bg-pink-500/10",
      count: sapPatterns?.roleUiConfigs?.count ?? 0, label: "Konfiguratsiyalar" },
    { id: "exception-inbox", title: "Muammolar Markazi", titleRu: "Исключения",
      description: "Manfiy marja, muddati o'tgan qarzlar",
      icon: Inbox, color: "text-[var(--ep-red)]", bgColor: "bg-red-500/10",
      count: sapPatterns?.exceptionInbox?.count ?? 0, label: "Ochiq muammolar" },
  ];

  // -------------------------------------------------------------------------
  // Non-bypassable rule cards
  // -------------------------------------------------------------------------

  const nonBypassableModules = [
    { id: "process-chains", title: "Majburiy Zanjirlar", titleRu: "Обязательные цепочки",
      description: "Order → Delivery → Invoice → Payment",
      icon: Link2, color: "text-[var(--ep-blue)]", bgColor: "bg-blue-600/10",
      count: allRules?.nonBypassableRules?.processChains?.count ?? 0, label: "Biznes zanjirlari" },
    { id: "audit-trail", title: "Audit Izi", titleRu: "Аудит лог",
      description: "O'chirib bo'lmaydigan, faqat reversal",
      icon: History, color: "text-muted-foreground", bgColor: "bg-slate-600/10",
      count: allRules?.nonBypassableRules?.auditTrail?.count ?? 0, label: "Yozuvlar" },
    { id: "fiscal-periods", title: "Moliya Davrlari", titleRu: "Фискальные периоды",
      description: "Oy/yil yopish, orqaga yozib bo'lmaydi",
      icon: Calendar, color: "text-[var(--ep-green)]", bgColor: "bg-green-600/10",
      count: allRules?.nonBypassableRules?.fiscalPeriods?.count ?? 0, label: "Davrlar" },
    { id: "master-data", title: "Master Ma'lumotlar", titleRu: "Мастер данные",
      description: "SSOT - Yagona haqiqat manbai",
      icon: Layers, color: "text-[var(--ep-purple)]", bgColor: "bg-purple-600/10",
      count: allRules?.nonBypassableRules?.masterData?.count ?? 0, label: "Kanonik ma'lumotlar" },
    { id: "batch-lots", title: "Partiya Kuzatuvi", titleRu: "Отслеживание партий",
      description: "Material va mahsulot partiyalari",
      icon: Package, color: "text-[var(--ep-yellow)]", bgColor: "bg-amber-600/10",
      count: allRules?.nonBypassableRules?.batchLots?.count ?? 0, label: "Partiyalar" },
    { id: "multi-currency", title: "Ko'p Valyuta", titleRu: "Мультивалюта",
      description: "UZS + USD + kurs farqi",
      icon: Coins, color: "text-[var(--ep-yellow)]", bgColor: "bg-yellow-600/10",
      count: allRules?.nonBypassableRules?.multiCurrency?.count ?? 0, label: "Tranzaksiyalar" },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Europrint Nazorat Markazi</b></>}
        title="Europrint Nazorat Markazi"
        subtitle="21 ta modul (14 ta qat&apos;iy qoida) - &quot;Mashina inson o&apos;rniga ishlaydi&quot; falsafasi"
      />
        </div>
        <Button
          variant="outline"
          className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Yangilash
        </Button>
      </div>

      {/* Company state KPI banner */}
      <CompanyStatePanel />

      {/* Core module cards */}
      <ModulesGrid modules={modules} isLoading={isLoading} />

      {/* SAP enterprise pattern cards */}
      <SapPatternsGrid modules={sapModules} isLoading={sapLoading} />

      {/* Non-bypassable rule cards */}
      <NonBypassableGrid modules={nonBypassableModules} isLoading={allRulesLoading} />

      {/* Detail tabs */}
      <ControlCenterTabs
        businessRules={businessRules}
        units={units}
        validationRules={validationRules}
        kpis={kpis}
      />
    </div>
  );
}
