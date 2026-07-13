/**
 * @module CapacityPlanning
 * @description Route-level orchestrator for Capacity Planning. Owns all
 * React-Query data fetching, mutation handlers, form instances, and dialog
 * state. Delegates rendering to CapacityPlanningSections, CapacityPlanningTabs,
 * CapacityPlanningDialogs, and CapacityPlanningCalendarDialog.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Calendar, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  capacityFormSchema,
  calendarFormSchema,
  type CapacityFormValues,
  type CalendarFormValues,
  type WorkCenter,
  type LoadAnalysis,
  type CapacityListItem,
  type ShiftCalendar,
  type ChartRow,
} from "./CapacityPlanningTypes";
import { DateRangeCard, AnalysisTabContent } from "./CapacityPlanningSections";
import { CapacityDataTab, ShiftCalendarTab } from "./CapacityPlanningTabs";
import { CapacityDialog } from "./CapacityPlanningDialogs";
import { CalendarDialog } from "./CapacityPlanningCalendarDialog";
import { EPErrorState, EPPageHeader } from "@/components/ep";

// Shared className for every TabsTrigger in this page
const TAB_CLS =
  "rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all";

export default function CapacityPlanning() {
  const { t } = useTranslation("production");
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [showCapacityDialog, setShowCapacityDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );

  const capacityForm = useForm<CapacityFormValues>({
    resolver: zodResolver(capacityFormSchema),
    defaultValues: {
      workCenterId: "",
      date: new Date().toISOString().split("T")[0],
      availableHours: 8,
      efficiency: 100,
      utilizationTarget: 85,
    },
  });

  const calendarForm = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: {
      workCenterId: "",
      shiftName: "",
      startTime: "08:00",
      endTime: "17:00",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  });

  // Queries
  const { data: workCenters = [], isError, error: workCentersError, refetch: refetchWorkCenters } =
    useQuery<WorkCenter[]>({
      queryKey: ["/api/pp/work-centers"],
      enabled: !!isAuthenticated,
      select: (raw: unknown): WorkCenter[] => {
        const items = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
        return items.map((item) => ({
          id: String(item.id ?? ""),
          code: String(item.code ?? ""),
          name: String(item.name ?? ""),
        }));
      },
    });

  const { data: capacityList = [] } = useQuery<CapacityListItem[]>({
    queryKey: ["/api/erp/work-center-capacity"],
    enabled: !!isAuthenticated,
  });

  const { data: calendars = [] } = useQuery<ShiftCalendar[]>({
    queryKey: ["/api/erp/shift-calendars"],
    enabled: !!isAuthenticated,
  });

  const { data: loadAnalysis = null, isLoading: loadAnalysisLoading } =
    useQuery<LoadAnalysis | null>({
      queryKey: ["/api/erp/capacity/load-analysis", dateFrom, dateTo],
      queryFn: async () => {
        const params = new URLSearchParams({ startDate: dateFrom, endDate: dateTo });
        return await apiRequest('GET', `/api/erp/capacity/load-analysis?${params}`);
      },
      enabled: !!isAuthenticated,
    });

  // Mutations
  const createCapacityMutation = useMutation({
    mutationFn: (data: CapacityFormValues) =>
      apiRequest("POST", "/api/erp/work-center-capacity", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/work-center-capacity"] });
      // NOTE: the load-analysis query key is ["/api/erp/capacity/load-analysis", dateFrom, dateTo]
      // — invalidating the bare "/api/erp/capacity" prefix never matched it (different string,
      // not a parent key), so Yuklama Tahlili silently kept its stale cache after every create.
      queryClient.invalidateQueries({ queryKey: ["/api/erp/capacity/load-analysis"] });
      setShowCapacityDialog(false);
      capacityForm.reset();
      toast({ title: t("capacityAdded") });
    },
    onError: () =>
      toast({ variant: "destructive", title: tCommon("error"), description: t("capacityError") }),
  });

  const createCalendarMutation = useMutation({
    mutationFn: (data: CalendarFormValues) =>
      apiRequest("POST", "/api/erp/shift-calendars", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/shift-calendars"] });
      setShowCalendarDialog(false);
      calendarForm.reset();
      toast({ title: t("calendarCreated") });
    },
    onError: () =>
      toast({ variant: "destructive", title: tCommon("error"), description: t("calendarError") }),
  });

  // Derived data
  const bottlenecks = loadAnalysis?.workCenters?.filter((wc) => wc.isBottleneck) ?? [];
  const overloaded = loadAnalysis?.workCenters?.filter((wc) => wc.status === "overloaded") ?? [];
  const chartData: ChartRow[] =
    loadAnalysis?.workCenters?.map((wc) => ({
      name: wc.workCenterName?.substring(0, 15) || "Unknown",
      available: wc.availableHours,
      loaded: wc.loadedHours,
      utilization: wc.loadPercentage,
    })) ?? [];

  const safeWorkCenters = Array.isArray(workCenters) ? workCenters : [];

  if (workCentersError) {
    return <div className="space-y-6"><EPErrorState onRetry={refetchWorkCenters} /></div>;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("quvvatlarniRejalashtirish")}</b></>}
        title={t("quvvatlarniRejalashtirish")}
        subtitle={t("capacityPlanningDesc")}
      />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
            onClick={() => setShowCalendarDialog(true)}
            data-testid="button-create-calendar"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t("shiftCalendar")}
          </Button>
          <Button
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            onClick={() => setShowCapacityDialog(true)}
            data-testid="button-create-capacity"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addCapacity")}
          </Button>
        </div>
      </div>

      <DateRangeCard dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} t={t} />

      <Tabs defaultValue="analysis" className="w-full space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-xl inline-flex">
          <TabsTrigger value="analysis" className={TAB_CLS} data-testid="tab-analysis">{t("loadAnalysisTab")}</TabsTrigger>
          <TabsTrigger value="capacity" className={TAB_CLS} data-testid="tab-capacity">{t("capacityData")}</TabsTrigger>
          <TabsTrigger value="calendar" className={TAB_CLS} data-testid="tab-calendar">{t("shiftCalendar")}</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 mt-0">
          <AnalysisTabContent
            isLoading={loadAnalysisLoading}
            loadAnalysis={loadAnalysis}
            bottlenecks={bottlenecks}
            overloaded={overloaded}
            chartData={chartData}
            onAddCapacity={() => setShowCapacityDialog(true)}
            t={t}
            tCommon={tCommon}
          />
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <CapacityDataTab
            capacityList={capacityList}
            onAddCapacity={() => setShowCapacityDialog(true)}
            t={t}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <ShiftCalendarTab
            calendars={calendars}
            workCenters={safeWorkCenters}
            onCreateCalendar={() => setShowCalendarDialog(true)}
            t={t}
          />
        </TabsContent>
      </Tabs>

      <CapacityDialog
        open={showCapacityDialog}
        onOpenChange={setShowCapacityDialog}
        form={capacityForm}
        workCenters={safeWorkCenters}
        isPending={createCapacityMutation.isPending}
        onSubmit={(data) => createCapacityMutation.mutate(data)}
        t={t}
        tCommon={tCommon}
      />

      <CalendarDialog
        open={showCalendarDialog}
        onOpenChange={setShowCalendarDialog}
        form={calendarForm}
        workCenters={safeWorkCenters}
        isPending={createCalendarMutation.isPending}
        onSubmit={(data) => createCalendarMutation.mutate(data)}
        t={t}
        tCommon={tCommon}
      />
    </div>
  );
}
