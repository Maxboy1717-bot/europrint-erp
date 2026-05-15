/**
 * @module AiAutomationPage
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Play, Activity, Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { EPErrorState, EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface AutomationStatus {
  todayAiOperations?: number;
  pendingLeadScores?: number;
  pendingCandidateScreenings?: number;
  runningJobs?: string[];
  automationCoverage?: Record<string, string>;
}

const MODULE_LABELS: Record<string, string> = {
  hrRecruitment: "HR Ishga qabul",
  crmLeads:      "CRM Lidlar",
  finance:       "Moliya",
  wms:           "Ombor (WMS)",
  marketing:     "Marketing",
  director:      "Direktor paneli",
};

const COVERAGE_COLOR = (pct: number) => {
  if (pct >= 80) return "text-[var(--ep-green)]";
  if (pct >= 60) return "text-[var(--ep-yellow)]";
  return "text-destructive";
};

export default function AiAutomationPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery<AutomationStatus>({
    queryKey: ["/api/ai/automation/status"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/ai/automation/status");
    },
    refetchInterval: 30_000,
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ai/automation/run-all-pending");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/automation/status"] });
      toast({ title: "AI ishlar ishga tushirildi", description: "Barcha pending joblar navbatga qo'yildi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "AI ishlarni ishga tushirishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const runningJobs    = data?.runningJobs ?? [];
  const coverage       = data?.automationCoverage ?? {};
  const hasRunningJobs = runningJobs.length > 0;

  return (
    <ModulePage
      module="ai"
      title={t("aiAvtomatizatsiya")}
      icon={<Bot className="h-5 w-5" />}
      actions={
        <Button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending || hasRunningJobs}
          data-testid="button-run-all-pending"
        >
          {runMutation.isPending || hasRunningJobs
            ? <EPLoader className="mr-2" />
            : <Play    className="h-4 w-4 mr-2" />}
          {hasRunningJobs ? "Ishlamoqda..." : "Barcha ishlarni ishga tushirish"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-[var(--ep-blue)]" />
                </div>
                <div>
                  {isLoading
                    ? <Skeleton className="h-7 w-12 mb-1 rounded-lg" />
                    : <p className="text-2xl font-bold">{data?.todayAiOperations ?? 0}</p>}
                  <p className="text-xs text-muted-foreground">{t("bugungiAiOperatsiyalar")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[var(--ep-yellow)]" />
                </div>
                <div>
                  {isLoading
                    ? <Skeleton className="h-7 w-12 mb-1 rounded-lg" />
                    : <p className="text-2xl font-bold">{data?.pendingLeadScores ?? 0}</p>}
                  <p className="text-xs text-muted-foreground">{t("bahosizLidlar")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[var(--ep-red)]" />
                </div>
                <div>
                  {isLoading
                    ? <Skeleton className="h-7 w-12 mb-1 rounded-lg" />
                    : <p className="text-2xl font-bold">{data?.pendingCandidateScreenings ?? 0}</p>}
                  <p className="text-xs text-muted-foreground">{t("tekshirilmaganNomzodlar")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Running jobs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("joriyAiIshlar")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {([1, 2]).map(i => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                </div>
              ) : runningJobs.length === 0 ? (
                <div className="flex items-center gap-3 py-4 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                  <span className="text-sm">{t("hozirHechQandayAiIsh")}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {runningJobs.map(job => (
                    <div key={job} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <EPLoader className="shrink-0" />
                      <span className="text-sm font-medium">{job}</span>
                      <EPStatusPill tone="neutral" className="ml-auto text-xs">{t("ishlamoqda")}</EPStatusPill>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coverage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI qamrov darajasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {([1, 2, 3, 4]).map(i => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-32 rounded-lg" />
                      <Skeleton className="h-2 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : Object.keys(coverage).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t("malumotYoq")}</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(coverage).map(([key, pctStr]) => {
                    const pct = parseInt(pctStr, 10);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{MODULE_LABELS[key] ?? key}</span>
                          <span className={`text-sm font-semibold ${COVERAGE_COLOR(pct)}`}>{pctStr}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModulePage>
  );
}
