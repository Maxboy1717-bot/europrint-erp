/**
 * @module EuroprintControlCenterSections
 * @description Section/panel components for the EuroprintControlCenter page:
 * CompanyStatePanel, ModulesGrid, SapPatternsGrid, NonBypassableGrid.
 */

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Database,
  Lock,
  Activity,
} from "lucide-react";
import { getAuthHeaders, apiRequest } from "@/lib/queryClient";
import {
  CompanyStateCurrent,
  ModuleCard,
  STATE_COLORS,
  fmt,
} from "./EuroprintControlCenterTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// CompanyStatePanel
// ---------------------------------------------------------------------------

export function CompanyStatePanel() {
  const { t } = useTranslation("common");
  const { data, isLoading, isError, refetch } = useQuery<CompanyStateCurrent>({
    queryKey: ["/api/company-state/current"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/company-state/current")) as unknown as Response;
      if (!res.ok) throw new Error("company-state/current failed");
      return res.json() as Promise<CompanyStateCurrent>;
    },
    refetchInterval: 120_000,
  });

  const status = data?.state ?? "normal";
  const colors = STATE_COLORS[status] ?? STATE_COLORS["normal"];
  const profitPct = data ? Math.round((data.kpis.profit / 100_000_000) * 100) : 0;
  const revenuePct = data ? Math.round((data.kpis.revenue / 800_000_000) * 100) : 0;

  if (isError) {
    return (
      <Card className="border-2 border-muted" data-testid="company-state-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {t("kompaniyaHolatiAvtomatikAniqlanish")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <span className="text-sm text-[var(--ep-red)]">
              Kompaniya holati yuklanmadi. Server bilan bog&apos;lanishda xatolik.
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t("qaytaUrinish")}
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
            {t("kompaniyaHolatiAvtomatikAniqlanish")}
          </CardTitle>
          {isLoading ? (
            <Skeleton className="h-7 w-32 rounded-full" />
          ) : (
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold", colors.badge)}>
              {data?.label?.emoji} {data?.label?.uz} / {data?.label?.ru}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([0, 1, 2]).map(i => <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn("rounded-xl p-4 text-center", colors.bg)} data-testid="cs-profit">
              <div className="flex items-center justify-center gap-1 mb-1">
                {profitPct >= 100
                  ? <TrendingUp className="w-3.5 h-3.5 text-[var(--ep-green)]" />
                  : <TrendingDown className="w-3.5 h-3.5 text-[var(--ep-red)]" />}
                <span className="text-xs text-muted-foreground">{fmt(data?.kpis?.profit ?? 0)}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{profitPct}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("haftalikFoyda")}</p>
              <p className="text-[10px] text-muted-foreground">{t("maqsad100Mln")}</p>
            </div>
            <div className={cn("rounded-xl p-4 text-center", colors.bg)} data-testid="cs-revenue">
              <div className="flex items-center justify-center gap-1 mb-1">
                {revenuePct >= 100
                  ? <TrendingUp className="w-3.5 h-3.5 text-[var(--ep-green)]" />
                  : <TrendingDown className="w-3.5 h-3.5 text-[var(--ep-red)]" />}
                <span className="text-xs text-muted-foreground">{fmt(data?.kpis?.revenue ?? 0)}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{revenuePct}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("haftalikDaromad")}</p>
              <p className="text-[10px] text-muted-foreground">{t("maqsad800Mln")}</p>
            </div>
            <div className={cn("rounded-xl p-4 text-center", colors.bg)} data-testid="cs-retention">
              <div className="flex items-center justify-center gap-1 mb-1">
                {(data?.kpis?.retentionPct ?? 100) >= 95
                  ? <TrendingUp className="w-3.5 h-3.5 text-[var(--ep-green)]" />
                  : <TrendingDown className="w-3.5 h-3.5 text-[var(--ep-red)]" />}
                <span className="text-xs text-muted-foreground">{t("xodimlar")}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{(data?.kpis?.retentionPct ?? 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("xodimSaqlash")}</p>
              <p className="text-[10px] text-muted-foreground">{t("maqsad95")}</p>
            </div>
          </div>
        )}
        {data && (
          <p className="text-[10px] text-muted-foreground mt-3">
            Yangilangan: {new Date(data.generatedAt).toLocaleTimeString("uz-UZ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ModulesGrid — 7 core control modules
// ---------------------------------------------------------------------------

interface ModulesGridProps {
  modules: ModuleCard[];
  isLoading: boolean;
}

export function ModulesGrid({ modules, isLoading }: ModulesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {(Array.isArray(modules) ? modules : []).map((module) => (
        <div
          key={module.id}
          className="bg-card rounded-lg p-5 hover:bg-muted/40 transition-colors cursor-pointer"
          data-testid={`module-card-${module.id}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${module.bgColor}`}>
              <module.icon className={`h-5 w-5 ${module.color}`} />
            </div>
            <h3 className="text-sm font-bold text-foreground">{module.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{module.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{module.label}</span>
            <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {isLoading ? "..." : module.count}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SapPatternsGrid — 8 SAP enterprise pattern cards
// ---------------------------------------------------------------------------

interface SapPatternsGridProps {
  modules: ModuleCard[];
  isLoading: boolean;
}

export function SapPatternsGrid({ modules, isLoading }: SapPatternsGridProps) {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">
          SAP Enterprise Patterns (10 Oltin Qoidalar)
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.isArray(modules) ? modules : []).map((module) => (
          <div
            key={module.id}
            className="bg-card rounded-lg p-5 border-2 border-dashed border-surface-container hover:bg-muted/40 transition-colors cursor-pointer"
            data-testid={`sap-card-${module.id}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${module.bgColor}`}>
                <module.icon className={`h-5 w-5 ${module.color}`} />
              </div>
              <h3 className="text-sm font-bold text-foreground">{module.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{module.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{module.label}</span>
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {isLoading ? "..." : module.count}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NonBypassableGrid — 6 non-bypassable rule cards
// ---------------------------------------------------------------------------

interface NonBypassableGridProps {
  modules: ModuleCard[];
  isLoading: boolean;
}

export function NonBypassableGrid({ modules, isLoading }: NonBypassableGridProps) {
  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="h-6 w-6 text-[var(--ep-red)]" />
        <h2 className="text-2xl font-bold text-foreground">
          Qat&apos;iy Biznes Jarayonlar (Non-Bypassable Rules)
        </h2>
        <EPStatusPill tone="danger">
          6 ta qoida
        </EPStatusPill>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(modules) ? modules : []).map((module) => (
          <div
            key={module.id}
            className="bg-card rounded-lg p-5 border-2 border-red-100 hover:bg-muted/40 transition-colors cursor-pointer"
            data-testid={`nbr-card-${module.id}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${module.bgColor}`}>
                <module.icon className={`h-5 w-5 ${module.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{module.title}</h3>
                {module.titleRu && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{module.titleRu}</span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{module.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{module.label}</span>
              <EPStatusPill tone="danger">
                {isLoading ? "..." : module.count}
              </EPStatusPill>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
