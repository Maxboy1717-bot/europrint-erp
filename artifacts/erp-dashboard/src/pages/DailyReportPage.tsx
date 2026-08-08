/**
 * @module DailyReportPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type {
  DailyReport,
  DailyReportEmployee,
  DeptItem,
  DailyReportStats,
  DeptReports,
  ReportFormState,
  ReportType,
} from "./DailyReportPageTypes";
import { INITIAL_FORM } from "./DailyReportPageTypes";
import { StatsBar, SubmitForm, HistoryList } from "./DailyReportPageSections";
import { DeptFilterBar, DeptReportColumns, AllReportsList } from "./DailyReportPageDialogs";
import { useTranslation } from '@/lib/i18n';

export default function DailyReportPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState<ReportFormState>(INITIAL_FORM);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("all");
  const [overrideId, setOverrideId] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const hour = now.getHours();
  const deadlinePassed = hour >= 20;
  // P1.24.1: no fallback to 1 — disable query if employee identity is missing
  const empId = user?.employeeId ?? null;

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: myReports, isLoading } = useQuery<DailyReport[]>({
    queryKey: ["/api/hr-v2/daily-reports/employee", empId],
    queryFn: () => apiRequest("GET", `/api/hr-v2/daily-reports/employee?employeeId=${empId!}&limit=14`),
    enabled: empId !== null && empId > 0,
  });

  const { data: stats } = useQuery<DailyReportStats>({
    queryKey: ["/api/hr-v2/daily-reports/stats", today],
    queryFn: () => apiRequest("GET", `/api/hr-v2/daily-reports/stats?date=${today}`),
    refetchInterval: 60000,
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/org-departments"],
    queryFn: () => apiRequest("GET", "/api/org-departments"),
  });

  const { data: deptReports } = useQuery<DeptReports>({
    queryKey: ["/api/hr-v2/daily-reports/department", selectedDept, today],
    queryFn: () => apiRequest("GET", `/api/hr-v2/daily-reports/department/${selectedDept}?date=${today}`),
    enabled: !!selectedDept,
  });

  const { data: allReports, isLoading: isLoadingAllReports } = useQuery<DailyReportEmployee[]>({
    queryKey: ["/api/hr-v2/daily-reports", reportType, today],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/hr-v2/daily-reports/by-date?date=${today}&type=${reportType}&limit=100`);
      return Array.isArray(r) ? r : [];
    },
    enabled: !selectedDept,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const submit = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<Record<string, unknown>>("POST", "/api/hr-v2/daily-reports", data),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) {
        toast({ title: "Xato", description: String(data.error), variant: "destructive" });
        return;
      }
      toast({ title: "Hisobot yuborildi", description: "+5 ball qo'shildi!" });
      setForm(INITIAL_FORM);
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/employee"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/stats"] });
    },
    onError: (e: Error) => toast({ title: "Xato", description: e.message, variant: "destructive" }),
  });

  const hrOverride = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) =>
      apiRequest("PATCH", `/api/hr-v2/daily-reports/${id}/override`, data),
    onSuccess: () => {
      toast({ title: "Hisobot yangilandi (HR override)" });
      setOverrideId(null);
      setOverrideReason("");
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/department"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/stats"] });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const deptList = (
    Array.isArray(departments)
      ? departments
      : ((departments as Record<string, unknown>)?.departments || [])
  ) as DeptItem[];

  const submittedList = ((deptReports as Record<string, unknown>)?.submitted || []) as DailyReportEmployee[];
  const missingList = ((deptReports as Record<string, unknown>)?.missing || []) as DailyReportEmployee[];

  const todayReport = (Array.isArray(myReports) ? myReports : []).find(
    (r) => r.report_date?.startsWith(today)
  );

  const handleFormChange = (key: keyof ReportFormState, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleOverride = (id: number) => {
    // hr_user_id removed: it was hardcoded to a fake constant (1) regardless of who was
    // actually logged in. The backend now derives the real HR actor from the JWT session
    // (@CurrentUser()) and rejects the request outright if that identity is missing —
    // no client-supplied or fallback id is trusted for this field.
    // `status: "absent"` removed: 'absent' is not a valid daily-report status (violates
    // hr_daily_reports_status_chk — only draft/submitted/approved/rejected are allowed).
    // Absence is represented by `is_auto_absent`, which the backend already reads.
    hrOverride.mutate({ id, is_auto_absent: true, reason: overrideReason });
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> {t("kunlikHisobot")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("uz-UZ", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
          {" · "}
          {deadlinePassed ? (
            <span className="text-red-400">{t("muddatiOTdi2000")}</span>
          ) : (
            <span className="text-green-400">
              Soat 17:00—20:00 orasida topshiring ({20 - hour} soat qoldi)
            </span>
          )}
        </p>
      </div>

      <StatsBar stats={stats} />

      <Tabs defaultValue="submit">
        <TabsList className="bg-muted border-border">
          <TabsTrigger value="submit" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
            {t("hisobotYozish")}
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
            {t("tarixim")}
          </TabsTrigger>
          <TabsTrigger value="admin" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
            {t("hrKorinish")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="mt-4">
          <SubmitForm
            todayReport={todayReport}
            form={form}
            deadlinePassed={deadlinePassed}
            hour={hour}
            isPending={submit.isPending}
            empId={empId ?? 0}
            today={today}
            onChange={handleFormChange}
            onSubmit={() => { if (empId) submit.mutate({ ...form, employee_id: empId, report_date: today }); }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryList
            reports={Array.isArray(myReports) ? myReports : []}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <div className="space-y-4">
            <DeptFilterBar
              selectedDept={selectedDept}
              reportType={reportType}
              deptList={deptList}
              today={today}
              onDeptChange={setSelectedDept}
              onTypeChange={setReportType}
            />

            {selectedDept && deptReports && (
              <DeptReportColumns
                submittedList={submittedList}
                missingList={missingList}
                overrideId={overrideId}
                overrideReason={overrideReason}
                isOverridePending={hrOverride.isPending}
                onSetOverrideId={setOverrideId}
                onSetOverrideReason={setOverrideReason}
                onOverride={handleOverride}
              />
            )}

            {!selectedDept && (
              <AllReportsList
                allReports={Array.isArray(allReports) ? allReports : []}
                isLoading={isLoadingAllReports}
                reportType={reportType}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
