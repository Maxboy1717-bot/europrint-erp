import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Database, 
  CheckCircle, 
  FileSearch, 
  TrendingUp, 
  TrendingDown,
  Settings, 
  Users,
  AlertTriangle,
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
  Activity,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { getAuthHeaders } from "@/lib/queryClient";

interface CompanyStateCurrent {
  status: "osish" | "normal" | "ehtiyot" | "xavf" | "inqiroz";
  label: string;
  label_ru: string;
  emoji: string;
  week_start: string;
  kpis: {
    profit: number;
    revenue: number;
    costs: number;
    retention_pct: number;
    profit_pct: number;
    revenue_pct: number;
  };
  generated_at: string;
}

const STATE_COLORS: Record<string, { bg: string; badge: string; border: string }> = {
  osish:   { bg: "bg-emerald-500/10", badge: "bg-emerald-500 text-white", border: "border-emerald-200" },
  normal:  { bg: "bg-blue-500/10",    badge: "bg-blue-500 text-white",    border: "border-blue-200"    },
  ehtiyot: { bg: "bg-yellow-500/10",  badge: "bg-yellow-500 text-white",  border: "border-yellow-200"  },
  xavf:    { bg: "bg-amber-500/10",   badge: "bg-amber-500 text-white",   border: "border-amber-200"   },
  inqiroz: { bg: "bg-red-500/10",     badge: "bg-red-500 text-white",     border: "border-red-200"     },
  GROWTH:  { bg: "bg-emerald-500/10", badge: "bg-emerald-500 text-white", border: "border-emerald-200" },
  NORMAL:  { bg: "bg-blue-500/10",    badge: "bg-blue-500 text-white",    border: "border-blue-200"    },
  RISK:    { bg: "bg-amber-500/10",   badge: "bg-amber-500 text-white",   border: "border-amber-200"   },
  CRITICAL:{ bg: "bg-red-500/10",     badge: "bg-red-500 text-white",     border: "border-red-200"     },
};

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mln`;
  return n.toLocaleString("uz-UZ");
}

function CompanyStatePanel() {
  const { data, isLoading, isError, refetch } = useQuery<CompanyStateCurrent>({
    queryKey: ["/api/company-state/current"],
    queryFn: async () => {
      const res = await fetch("/api/company-state/current", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("company-state/current failed");
      return res.json() as Promise<CompanyStateCurrent>;
    },
    refetchInterval: 120_000,
  });

  const status = data?.status ?? "normal";
  const colors = STATE_COLORS[status] ?? STATE_COLORS["normal"];

  if (isError) {
    return (
      <Card className="border-2 border-muted" data-testid="company-state-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Kompaniya Holati — Avtomatik Aniqlanish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <span className="text-sm text-red-700">Kompaniya holati yuklanmadi. Server bilan bog'lanishda xatolik.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Qayta urinish
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-2", colors.border)} data-testid="company-state-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Kompaniya Holati — Avtomatik Aniqlanish
          </CardTitle>
          {isLoading ? (
            <Skeleton className="h-7 w-32 rounded-full" />
          ) : (
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold", colors.badge)}>
              {data?.emoji} {data?.label} / {data?.label_ru}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {([0, 1, 2]).map(i => <Skeleton key={`k-${i}`} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className={cn("rounded-xl p-4 text-center", colors.bg)} data-testid="cs-profit">
              <div className="flex items-center justify-center gap-1 mb-1">
                {(data?.kpis?.profit_pct ?? 0) >= 100
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className="text-xs text-on-surface-variant">{fmt(data?.kpis?.profit ?? 0)}</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{data?.kpis?.profit_pct ?? 0}%</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Haftalik Foyda</p>
              <p className="text-[10px] text-on-surface-variant">Maqsad: 100 mln</p>
            </div>
            <div className={cn("rounded-xl p-4 text-center", colors.bg)} data-testid="cs-revenue">
              <div className="flex items-center justify-center gap-1 mb-1">
                {(data?.kpis?.revenue_pct ?? 0) >= 100
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className="text-xs text-on-surface-variant">{fmt(data?.kpis?.revenue ?? 0)}</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{data?.kpis?.revenue_pct ?? 0}%</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Haftalik Daromad</p>
              <p className="text-[10px] text-on-surface-variant">Maqsad: 800 mln</p>
            </div>
            <div className={cn("rounded-xl p-4 text-center", colors.bg)} data-testid="cs-retention">
              <div className="flex items-center justify-center gap-1 mb-1">
                {(data?.kpis?.retention_pct ?? 100) >= 95
                  ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                <span className="text-xs text-on-surface-variant">Xodimlar</span>
              </div>
              <p className="text-xl font-bold text-on-surface">{(data?.kpis?.retention_pct ?? 100).toFixed(1)}%</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Xodim Saqlash</p>
              <p className="text-[10px] text-on-surface-variant">Maqsad: ≥95%</p>
            </div>
          </div>
        )}
        {data && (
          <p className="text-[10px] text-on-surface-variant mt-3">
            Hafta: {data.week_start} · Yangilangan: {new Date(data.generated_at).toLocaleTimeString("uz-UZ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface BusinessRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  ruleType: string;
  category: string;
  isActive: boolean;
  errorMessageUz: string;
}

interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface ValidationRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  severity: string;
  category: string;
}

interface KpiDefinition {
  id: string;
  kpiCode: string;
  kpiName: string;
  category: string;
  targetValue: number;
  unit: string;
  blockOnViolation: boolean;
}

interface SapPatternSummary {
  documentLifecycle: { count: number; name: string; nameRu: string };
  changeRequests: { count: number; name: string; nameRu: string };
  separationOfDuties: { count: number; name: string; nameRu: string };
  exceptionInbox: { count: number; name: string; nameRu: string };
  postingEngine: { count: number; name: string; nameRu: string };
  costObjects: { count: number; name: string; nameRu: string };
  sops: { count: number; name: string; nameRu: string };
  roleUiConfigs: { count: number; name: string; nameRu: string };
}

interface AllRulesSummary {
  sapPatterns: SapPatternSummary;
  nonBypassableRules: {
    processChains: { count: number; name: string; nameRu: string };
    auditTrail: { count: number; name: string; nameRu: string };
    fiscalPeriods: { count: number; name: string; nameRu: string };
    masterData: { count: number; name: string; nameRu: string };
    batchLots: { count: number; name: string; nameRu: string };
    multiCurrency: { count: number; name: string; nameRu: string };
  };
}

export default function EuroprintControlCenter() {
  const { data: businessRules = [], isLoading: rulesLoading, isError, refetch} = useQuery<BusinessRule[]>({
    queryKey: ["/api/europrint-control/business-rules"],
  });

  const { data: units = [], isLoading: unitsLoading } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/europrint-control/units"],
  });

  const { data: validationRules = [], isLoading: validationLoading } = useQuery<ValidationRule[]>({
    queryKey: ["/api/europrint-control/validation-rules"],
  });

  const { data: kpis = [], isLoading: kpisLoading } = useQuery<KpiDefinition[]>({
    queryKey: ["/api/europrint-control/kpis"],
  });

  const { data: auditorData } = useQuery<{ deletedRecords: number; overrides: number; reversals: number }>({
    queryKey: ["/api/europrint-control/auditor-dashboard"],
  });

  const { data: sapPatterns, isLoading: sapLoading } = useQuery<SapPatternSummary>({
    queryKey: ["/api/europrint-control/sap-patterns-summary"],
  });

  const { data: allRules, isLoading: allRulesLoading } = useQuery<AllRulesSummary>({
    queryKey: ["/api/europrint-control/all-rules-summary"],
  });

  const sapModules = [
    {
      id: "doc-lifecycle",
      title: "Hujjat Hayoti",
      titleRu: "Жизненный цикл",
      description: "Draft → Submitted → Approved → Posted → Closed → Reversed",
      icon: GitBranch,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      count: sapPatterns?.documentLifecycle?.count || 0,
      label: "Hujjatlar"
    },
    {
      id: "change-mgmt",
      title: "O'zgarish Boshqaruvi",
      titleRu: "Управление изменениями",
      description: "Narx/formula/limit o'zgarishlarini nazorat qilish",
      icon: FileEdit,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      count: sapPatterns?.changeRequests?.count || 0,
      label: "So'rovlar"
    },
    {
      id: "sod",
      title: "Vazifalar Ajratish",
      titleRu: "Разделение обязанностей",
      description: "Creator ≠ Approver ≠ Payer qoidalari",
      icon: UserCheck,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      count: sapPatterns?.separationOfDuties?.count || 0,
      label: "SoD qoidalari"
    },
    {
      id: "posting-engine",
      title: "GL Yozuv Mexanizmi",
      titleRu: "Модуль проводок",
      description: "Barcha GL yozuvlari markaziy joydan",
      icon: Calculator,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      count: sapPatterns?.postingEngine?.count || 0,
      label: "GL yozuvlari"
    },
    {
      id: "cost-objects",
      title: "Xarajat Ob'ektlari",
      titleRu: "Объекты затрат",
      description: "Loyiha/buyurtma/partiya xarajatlari",
      icon: Target,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      count: sapPatterns?.costObjects?.count || 0,
      label: "Ob'ektlar"
    },
    {
      id: "sop",
      title: "SOP Shablonlari",
      titleRu: "Шаблоны СОП",
      description: "Majburiy qadamlar va checklistlar",
      icon: BookOpen,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      count: sapPatterns?.sops?.count || 0,
      label: "Shablonlar"
    },
    {
      id: "role-ui",
      title: "Rol UI Sozlamalari",
      titleRu: "UI по ролям",
      description: "Har bir rol uchun interfeys sozlamalari",
      icon: Layout,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      count: sapPatterns?.roleUiConfigs?.count || 0,
      label: "Konfiguratsiyalar"
    },
    {
      id: "exception-inbox",
      title: "Muammolar Markazi",
      titleRu: "Исключения",
      description: "Manfiy marja, muddati o'tgan qarzlar",
      icon: Inbox,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      count: sapPatterns?.exceptionInbox?.count || 0,
      label: "Ochiq muammolar"
    }
  ];

  const nonBypassableModules = [
    {
      id: "process-chains",
      title: "Majburiy Zanjirlar",
      titleRu: "Обязательные цепочки",
      description: "Order → Delivery → Invoice → Payment",
      icon: Link2,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      count: allRules?.nonBypassableRules?.processChains?.count || 0,
      label: "Biznes zanjirlari"
    },
    {
      id: "audit-trail",
      title: "Audit Izi",
      titleRu: "Аудит лог",
      description: "O'chirib bo'lmaydigan, faqat reversal",
      icon: History,
      color: "text-on-surface-variant",
      bgColor: "bg-slate-600/10",
      count: allRules?.nonBypassableRules?.auditTrail?.count || 0,
      label: "Yozuvlar"
    },
    {
      id: "fiscal-periods",
      title: "Moliya Davrlari",
      titleRu: "Фискальные периоды",
      description: "Oy/yil yopish, orqaga yozib bo'lmaydi",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
      count: allRules?.nonBypassableRules?.fiscalPeriods?.count || 0,
      label: "Davrlar"
    },
    {
      id: "master-data",
      title: "Master Ma'lumotlar",
      titleRu: "Мастер данные",
      description: "SSOT - Yagona haqiqat manbai",
      icon: Layers,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
      count: allRules?.nonBypassableRules?.masterData?.count || 0,
      label: "Kanonik ma'lumotlar"
    },
    {
      id: "batch-lots",
      title: "Partiya Kuzatuvi",
      titleRu: "Отслеживание партий",
      description: "Material va mahsulot partiyalari",
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-600/10",
      count: allRules?.nonBypassableRules?.batchLots?.count || 0,
      label: "Partiyalar"
    },
    {
      id: "multi-currency",
      title: "Ko'p Valyuta",
      titleRu: "Мультивалюта",
      description: "UZS + USD + kurs farqi",
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-600/10",
      count: allRules?.nonBypassableRules?.multiCurrency?.count || 0,
      label: "Tranzaksiyalar"
    }
  ];

  const modules = [
    {
      id: "hard-control",
      title: "Qattiq Nazorat",
      description: "Manfiy qoldiq va byudjet limitini bloklash",
      icon: Lock,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      count: (Array.isArray(businessRules) ? businessRules : []).filter(r => r.ruleType === "block").length,
      label: "Bloklash qoidalari"
    },
    {
      id: "ssot",
      title: "Yagona Manba (SSOT)",
      description: "O'lchov birliklari va mahsulot ma'lumotnomalari",
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      count: units.length,
      label: "O'lchov birliklari"
    },
    {
      id: "validator",
      title: "ERP Tekshiruvchi",
      description: "Mantiqiy xatolarni avtomatik aniqlash",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      count: validationRules.length,
      label: "Tekshirish qoidalari"
    },
    {
      id: "auditor",
      title: "Auditor Rejimi",
      description: "O'chirilganlar va override tarixi",
      icon: FileSearch,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      count: (auditorData?.deletedRecords || 0) + (auditorData?.overrides || 0),
      label: "Audit yozuvlari"
    },
    {
      id: "kpi",
      title: "KPI va Ogohlantirishlar",
      description: "Limitdan oshganda blok yoki alert",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      count: kpis.length,
      label: "KPI ko'rsatkichlari"
    },
    {
      id: "config",
      title: "Sozlamalar (Config)",
      description: "Qoidalar jadvalda, kod emas",
      icon: Settings,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      count: businessRules.length + validationRules.length,
      label: "Jami qoidalar"
    },
    {
      id: "roles",
      title: "Rol Asosidagi Ko'rinish",
      description: "Direktor, Buxgalter, Operator menyulari",
      icon: Users,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      count: 4,
      label: "Foydalanuvchi rollari"
    }
  ];

  const isLoading = rulesLoading || unitsLoading || validationLoading || kpisLoading || sapLoading;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-8 bg-surface min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Europrint <span className="font-bold text-primary">Nazorat Markazi</span>
          </h1>
          <p className="text-on-surface-variant mt-2">
            21 ta modul (14 ta qat'iy qoida) - "Mashina inson o'rniga ishlaydi" falsafasi
          </p>
        </div>
        <Button variant="outline" className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none gap-2">
          <RefreshCw className="h-4 w-4" />
          Yangilash
        </Button>
      </div>

      <CompanyStatePanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(Array.isArray(modules) ? modules : []).map((module) => (
          <div key={module.id} className="bg-surface-container-lowest rounded-lg p-5 hover:bg-surface-container-low transition-colors cursor-pointer" data-testid={`module-card-${module.id}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${module.bgColor}`}>
                <module.icon className={`h-5 w-5 ${module.color}`} />
              </div>
              <h3 className="text-sm font-bold text-on-surface">{module.title}</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">{module.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{module.label}</span>
              <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {isLoading ? "..." : module.count}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-on-surface">SAP Enterprise Patterns (10 Oltin Qoidalar)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Array.isArray(sapModules) ? sapModules : []).map((module) => (
            <div key={module.id} className="bg-surface-container-lowest rounded-lg p-5 border-2 border-dashed border-surface-container hover:bg-surface-container-low transition-colors cursor-pointer" data-testid={`sap-card-${module.id}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${module.bgColor}`}>
                  <module.icon className={`h-5 w-5 ${module.color}`} />
                </div>
                <h3 className="text-sm font-bold text-on-surface">{module.title}</h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">{module.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{module.label}</span>
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {sapLoading ? "..." : module.count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold text-on-surface">Qat'iy Biznes Jarayonlar (Non-Bypassable Rules)</h2>
          <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold ml-2">6 ta qoida</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(nonBypassableModules) ? nonBypassableModules : []).map((module) => (
            <div key={module.id} className="bg-surface-container-lowest rounded-lg p-5 border-2 border-red-100 hover:bg-surface-container-low transition-colors cursor-pointer" data-testid={`nbr-card-${module.id}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${module.bgColor}`}>
                  <module.icon className={`h-5 w-5 ${module.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{module.title}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">{module.titleRu}</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">{module.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{module.label}</span>
                <Badge className="bg-red-500 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {allRulesLoading ? "..." : module.count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="rules" className="mt-10">
        <TabsList className="bg-surface-container p-1 rounded-xl">
          <TabsTrigger value="rules" className="rounded-lg data-[state=active]:bg-surface-container-lowest" data-testid="tab-rules">Biznes Qoidalar</TabsTrigger>
          <TabsTrigger value="units" className="rounded-lg data-[state=active]:bg-surface-container-lowest" data-testid="tab-units">O'lchov Birliklari</TabsTrigger>
          <TabsTrigger value="validation" className="rounded-lg data-[state=active]:bg-surface-container-lowest" data-testid="tab-validation">Tekshiruvlar</TabsTrigger>
          <TabsTrigger value="kpis" className="rounded-lg data-[state=active]:bg-surface-container-lowest" data-testid="tab-kpis">KPI</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Biznes Qoidalari (Qattiq Nazorat)
            </h3>
            <div className="space-y-3">
              {(Array.isArray(businessRules) ? businessRules : []).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-surface rounded-lg hover:bg-surface-container-low transition-colors" data-testid={`rule-${rule.ruleCode}`}>
                  <div className="flex items-center gap-4">
                    {rule.ruleType === "block" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-bold text-on-surface">{rule.ruleName}</p>
                      <p className="text-sm text-on-surface-variant">{rule.errorMessageUz}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", 
                      rule.ruleType === "block" ? "bg-red-100 text-red-800" : "bg-surface-container text-on-surface"
                    )}>
                      {rule.ruleType === "block" ? "BLOK" : "OGOHLANTIRISH"}
                    </Badge>
                    <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{rule.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <Database className="h-5 w-5" />
              O'lchov Birliklari (SSOT)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {(Array.isArray(units) ? units : []).map((unit) => (
                <div key={unit.id} className="p-4 bg-surface rounded-lg text-center hover:bg-surface-container-low transition-colors" data-testid={`unit-${unit.code}`}>
                  <p className="font-bold text-2xl text-on-surface">{unit.code}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{unit.name}</p>
                  <Badge variant="outline" className="mt-3 rounded-full text-[10px] font-bold uppercase tracking-wider border-surface-container">{unit.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tekshirish Qoidalari (ERP Validator)
            </h3>
            <div className="space-y-3">
              {(Array.isArray(validationRules) ? validationRules : []).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-surface rounded-lg hover:bg-surface-container-low transition-colors" data-testid={`validation-${rule.ruleCode}`}>
                  <div>
                    <p className="font-bold text-on-surface">{rule.ruleName}</p>
                    <p className="text-xs font-mono text-on-surface-variant mt-1">{rule.ruleCode}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      rule.severity === "critical" ? "bg-red-100 text-red-800" : 
                      rule.severity === "high" ? "bg-amber-100 text-amber-800" : 
                      "bg-surface-container text-on-surface"
                    )}>
                      {rule.severity}
                    </Badge>
                    <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{rule.category}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              KPI Ko'rsatkichlari
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Array.isArray(kpis) ? kpis : []).map((kpi) => (
                <div key={kpi.id} className="p-5 bg-surface rounded-lg hover:bg-surface-container-low transition-colors" data-testid={`kpi-${kpi.kpiCode}`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{kpi.kpiName}</p>
                    {kpi.blockOnViolation && (
                      <Lock className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-3xl font-bold text-on-surface tracking-tight">{kpi.targetValue} {kpi.unit}</p>
                  <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold mt-4">{kpi.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
