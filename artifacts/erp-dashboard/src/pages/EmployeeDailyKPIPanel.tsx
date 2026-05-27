// @deprecated 2026-05-27
// This component is a duplicate. Do NOT add new features here.
// See: docs/modules/hr-employees.md for canonical location.
/** @module EmployeeDailyKPIPanel @description Route-level page component. Owns state, data queries, mutations, and computed values; delegates rendering to sub-components. */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeDailyKpiSchema, type InsertEmployeeDailyKpi } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BarChart3 } from "lucide-react";
import {
  RADAR_DIMENSIONS,
  DEFAULT_SCORES,
  type KpiApiResponse,
  type TopPerformersApiResponse,
  type EmployeesApiResponse,
  type DeptSummaryApiResponse,
} from "./EmployeeDailyKPIPanelTypes";
import { AvgScoreCard, TotalEvaluationsCard, TopPerformerCard, FairnessIndexCard } from "./EmployeeDailyKPIPanelCards";
import { RadarChartSection, EvaluationsTableSection } from "./EmployeeDailyKPIPanelSections";
import { KpiEvaluationDialog } from "./EmployeeDailyKPIPanelDialog";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function EmployeeDailyKPIPanel() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertEmployeeDailyKpi>({
    resolver: zodResolver(insertEmployeeDailyKpiSchema),
    defaultValues: { userId: "", evaluationDate: selectedDate, departmentId: null, ...DEFAULT_SCORES, notes: "" },
  });

  const watchedScores = form.watch([
    "attendanceScore", "taskCompletionScore", "qualityScore",
    "productivityScore", "teamworkScore", "disciplineScore",
    "bonusPercent", "penaltyPercent",
  ]);

  const overallPreview = useMemo(() => {
    const [attendance, tasks, quality, productivity, teamwork, discipline] = watchedScores;
    const avg = ((attendance ?? 70) + (tasks ?? 70) + (quality ?? 70) + (productivity ?? 70) + (teamwork ?? 70) + (discipline ?? 70)) / 6;
    return Math.round(avg * 100) / 100;
  }, [watchedScores]);

  const netPreview = useMemo(() => {
    const bonus = watchedScores[6] ?? 0;
    const penalty = watchedScores[7] ?? 0;
    return Math.round((overallPreview + bonus - penalty) * 100) / 100;
  }, [overallPreview, watchedScores]);

  const { data: kpiResponse, isLoading: kpiLoading, isError: isKpiError, error, refetch } = useQuery<KpiApiResponse>({
    queryKey: [`/api/employee-kpi?dateFrom=${selectedDate}&dateTo=${selectedDate}`],
  });
  const records = kpiResponse?.records || [];

  const { data: topResponse, isLoading: topLoading, isError: isTopError, error: topError } = useQuery<TopPerformersApiResponse>({
    queryKey: [`/api/employee-kpi/summary/top-performers?dateFrom=${selectedDate}&dateTo=${selectedDate}`],
  });
  const topPerformers = topResponse?.topPerformers || [];

  const { data: employeesResponse } = useQuery<EmployeesApiResponse>({
    queryKey: ["/api/hr/employees"],
  });
  const employees = employeesResponse?.data || [];

  const { data: deptSummaryResponse, isLoading: deptLoading } = useQuery<DeptSummaryApiResponse>({
    queryKey: [`/api/employee-kpi/summary/department?dateFrom=${selectedDate}&dateTo=${selectedDate}`],
  });

  const avgOverall = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = (Array.isArray(records) ? records : []).reduce((acc, r) => acc + (r.overallScore ?? 0), 0);
    return Math.round((sum / records.length) * 100) / 100;
  }, [records]);

  const fairnessIndex = useMemo(() => {
    if (records.length < 2) return 0;
    const scores = (Array.isArray(records) ? records : []).map((r) => r.overallScore ?? 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
    return Math.round(Math.sqrt(variance) * 100) / 100;
  }, [records]);

  const radarData = useMemo(() => {
    const companyAvg = { attendance: 0, tasks: 0, quality: 0, productivity: 0, teamwork: 0, discipline: 0 };
    if (records.length > 0) {
      (Array.isArray(records) ? records : []).forEach((r) => {
        companyAvg.attendance += r.attendanceScore ?? 0;
        companyAvg.tasks += r.taskCompletionScore ?? 0;
        companyAvg.quality += r.qualityScore ?? 0;
        companyAvg.productivity += r.productivityScore ?? 0;
        companyAvg.teamwork += r.teamworkScore ?? 0;
        companyAvg.discipline += r.disciplineScore ?? 0;
      });
      const n = records.length;
      (Object.keys(companyAvg) as (keyof typeof companyAvg)[]).forEach((k) => { companyAvg[k] /= n; });
    }
    const deptAvgs = deptSummaryResponse?.departments?.[0];
    return RADAR_DIMENSIONS.map((d) => ({
      dimension: d.label,
      "Kompaniya o'rtacha": Math.round((companyAvg as Record<string, number>)[d.key] * 10) / 10,
      "Bo'lim o'rtacha": deptAvgs
        ? Math.round((d.key === "attendance" ? deptAvgs.avgAttendance : d.key === "tasks" ? deptAvgs.avgTaskCompletion : d.key === "quality" ? deptAvgs.avgQuality : d.key === "productivity" ? deptAvgs.avgProductivity : d.key === "teamwork" ? deptAvgs.avgTeamwork : deptAvgs.avgDiscipline) * 10) / 10
        : 0,
    }));
  }, [records, deptSummaryResponse]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployeeDailyKpi) => apiRequest("POST", "/api/employee-kpi", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-kpi"] });
      toast({ title: "KPI baholash yaratildi" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Xatolik", description: "KPI baholash yaratilmadi", variant: "destructive" });
    },
  });

  function onSubmit(data: InsertEmployeeDailyKpi) {
    const selectedEmployee = (Array.isArray(employees) ? employees : []).find((e) => e.id === data.userId);
    createMutation.mutate({ ...data, departmentId: selectedEmployee?.departmentId || null });
  }

  if (isKpiError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <div data-testid="employee-daily-kpi-panel">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">
                  {t("kunlikKpiBaholash")}
                </h1>
                <p className="text-white/75 text-sm">{t("adolatliVaShaffofBaholashTizimi")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            data-testid="input-evaluation-date"
          />
          <KpiEvaluationDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            form={form}
            employees={employees}
            selectedDate={selectedDate}
            overallPreview={overallPreview}
            netPreview={netPreview}
            isPending={createMutation.isPending}
            onSubmit={onSubmit}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AvgScoreCard avgOverall={avgOverall} isLoading={kpiLoading} />
          <TotalEvaluationsCard total={records.length} isLoading={kpiLoading} />
          <TopPerformerCard
            topPerformer={topPerformers.length > 0 ? topPerformers[0] : null}
            isLoading={topLoading}
            isError={isTopError}
          />
          <FairnessIndexCard fairnessIndex={fairnessIndex} isLoading={kpiLoading} />
        </div>

        <RadarChartSection
          radarData={radarData}
          isLoading={kpiLoading || deptLoading}
          hasRecords={records.length > 0}
        />

        <EvaluationsTableSection
          records={records}
          isLoading={kpiLoading}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
