/**
 * @module ShiftSchedule
 * @description React page component. Route-level UI.
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Calendar, Users, Sun, Moon, Sunrise, RefreshCw, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

import {
  ShiftType, Employee, Department, ShiftScheduleEntry, ShiftSwapRequest,
  PAGE_SIZE, getWeekDates, fmt,
} from "./ShiftScheduleTypes";
import { AssignShiftDialog, SwapRequestDialog, DeleteEntryConfirm } from "./ShiftScheduleDialogs";
import { GridTab, SwapsTab } from "./ShiftScheduleSections";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

export default function ShiftSchedule() {
  const { t } = useTranslation("common");
  const { t: tCommon } = useTranslation("common");
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<"grid" | "swaps">("grid");

  const [assignDialog, setAssignDialog] = useState<{ open: boolean; date: string; userId: string } | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftType>("MORNING");
  const [swapDialog, setSwapDialog] = useState<{ open: boolean; userId: string; date: string } | null>(null);
  const [swapToUserId, setSwapToUserId] = useState("");
  const [swapReason, setSwapReason] = useState("");
  const [deleteEntryId, setDeleteEntryId] = useState<number | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const weekStart = fmt(weekDates[0]);
  const todayStr = fmt(new Date());

  const isHR = ["admin", "super_admin", "hr_manager", "manager", "director"].includes(authUser?.role ?? "");

  const { data: rawEmployees = [], isLoading: empLoading, isError, error: empError, refetch: refetchEmps } = useQuery<Employee[]>({
    queryKey: ["/api/users"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const employees: Employee[] = useMemo(() =>
    (Array.isArray(rawEmployees) ? rawEmployees : []).map(e => ({
      id: e.id,
      fullName: e.fullName ?? "",
      departmentId: e.departmentId ?? "",
      departmentName: e.departmentName ?? "",
      status: e.status ?? "active",
      shift: e.shift ?? "",
    })),
    [rawEmployees]
  );

  const scheduleKey = useMemo(
    () => ["/api/hr-v2/shifts/schedule", weekStart, selectedDeptId],
    [weekStart, selectedDeptId]
  );

  const { data: schedulesRaw, isLoading: schedLoading, refetch: refetchSchedules } = useQuery<unknown>({
    queryKey: scheduleKey,
    queryFn: () => {
      const params = new URLSearchParams({ week_start: weekStart });
      if (selectedDeptId !== "all") params.set("department_id", selectedDeptId);
      return apiRequest("GET", `/api/hr-v2/shifts/schedule?${params}`);
    },
  });
  const schedules = (Array.isArray(schedulesRaw) ? schedulesRaw : []) as ShiftScheduleEntry[];

  const { data: swapRequests = [], isLoading: swapLoading, refetch: refetchSwaps } = useQuery<ShiftSwapRequest[]>({
    queryKey: ["/api/hr-v2/shifts/swap-requests"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/shifts/swap-requests"),
  });

  const { data: todayShifts = [] } = useQuery<ShiftScheduleEntry[]>({
    queryKey: ["/api/hr/shifts/today"],
    queryFn: () => apiRequest("GET", "/api/hr/shifts/today"),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { user_id: string; shift_date: string; shift_type: ShiftType }) =>
      apiRequest("POST", "/api/hr-v2/shifts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-v2/shifts/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/today"] });
      toast({ title: "Smena tayinlandi" });
      setAssignDialog(null);
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr-v2/shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-v2/shifts/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/today"] });
      toast({ title: "Smena o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const swapMutation = useMutation({
    mutationFn: (data: { from_employee_id?: string; to_employee_id?: string; shift_date: string; reason: string }) =>
      apiRequest("POST", "/api/hr-v2/shifts/swap-request", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-v2/shifts/swap-requests"] });
      toast({ title: "Almashish so'rovi yuborildi" });
      setSwapDialog(null);
      setSwapToUserId("");
      setSwapReason("");
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      apiRequest("PATCH", `/api/hr-v2/shifts/${id}/approve-swap`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr-v2/shifts/swap-requests"] });
      toast({ title: "So'rov yangilandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const filteredEmployees = useMemo(() => {
    let list = (Array.isArray(employees) ? employees : []).filter(e => e.status !== "deleted");
    if (selectedDeptId !== "all") list = list.filter(e => e.departmentId === selectedDeptId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => e.fullName.toLowerCase().includes(q));
    }
    return list;
  }, [employees, selectedDeptId, searchQuery]);

  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const pagedEmployees = filteredEmployees.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = useCallback((val: string) => { setSearchQuery(val); setPage(0); }, []);
  const handleDeptChange = useCallback((val: string) => { setSelectedDeptId(val); setPage(0); }, []);

  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<string, ShiftScheduleEntry>> = {};
    for (const s of schedules) {
      const uid = s.user_id;
      const date = s.shift_date?.slice(0, 10);
      if (uid && date) {
        if (!map[uid]) map[uid] = {};
        map[uid][date] = s;
      }
    }
    return map;
  }, [schedules]);

  const morningCount = (Array.isArray(todayShifts) ? todayShifts : []).filter(s => s.shift_type === "MORNING").length;
  const eveningCount = (Array.isArray(todayShifts) ? todayShifts : []).filter(s => s.shift_type === "EVENING").length;
  const nightCount  = (Array.isArray(todayShifts) ? todayShifts : []).filter(s => s.shift_type === "NIGHT").length;
  const pendingSwaps = (Array.isArray(swapRequests) ? swapRequests : []).filter(r => r.status === "pending").length;

  if (empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }

  if (empError) return <EPErrorState onRetry={refetchEmps} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{tCommon("shiftScheduleTitle")}</b></>}
        title={tCommon("shiftScheduleTitle")}
      />
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchSchedules(); refetchSwaps(); }} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />{t("refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <Users className="h-7 w-7 text-[var(--ep-blue)] shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tCommon("totalEmployeesLabel")}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-today-total">{todayShifts.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <Sun className="h-7 w-7 text-[var(--ep-yellow)] shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tCommon("morningShiftLabel")}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-morning-count">{morningCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <Sunrise className="h-7 w-7 text-[var(--ep-primary)] shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tCommon("eveningShiftLabel")}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-evening-count">{eveningCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <Moon className="h-7 w-7 text-[var(--ep-blue)] shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{tCommon("nightShiftLabel")}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-night-count">{nightCount}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={activeTab === "grid" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("grid")} data-testid="tab-grid">
          <Calendar className="h-4 w-4 mr-2" />{t("haftalikJadval")}
        </Button>
        <Button variant={activeTab === "swaps" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("swaps")} data-testid="tab-swaps">
          <ArrowRightLeft className="h-4 w-4 mr-2" />Almashish So'rovlari
          {pendingSwaps > 0 && <Badge className="ml-2 bg-[var(--ep-red)] text-white text-xs">{pendingSwaps}</Badge>}
        </Button>
      </div>

      {activeTab === "grid" && (
        <GridTab
          weekDates={weekDates} todayStr={todayStr} pagedEmployees={pagedEmployees}
          filteredEmployees={filteredEmployees} page={page} totalPages={totalPages}
          schedLoading={schedLoading} scheduleMap={scheduleMap} isHR={isHR}
          authUserId={String(authUser?.id)} searchQuery={searchQuery}
          selectedDeptId={selectedDeptId} departments={departments as Department[]}
          onSearchChange={handleSearchChange} onDeptChange={handleDeptChange}
          onPrevWeek={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
          onNextWeek={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
          onToday={() => setCurrentDate(new Date())}
          onPrevPage={() => setPage(p => Math.max(0, p - 1))}
          onNextPage={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          onAssign={(date, userId) => { setAssignDialog({ open: true, date, userId }); setSelectedShift("MORNING"); }}
          onSwap={(userId, date) => { setSwapDialog({ open: true, userId, date }); setSwapToUserId(""); setSwapReason(""); }}
          onDelete={(id) => setDeleteEntryId(id)}
        />
      )}

      {activeTab === "swaps" && (
        <SwapsTab
          swapLoading={swapLoading}
          swapRequests={swapRequests}
          pendingSwaps={pendingSwaps}
          isHR={isHR}
          isApprovePending={approveMutation.isPending}
          onApprove={(id, action) => approveMutation.mutate({ id, action })}
        />
      )}

      <AssignShiftDialog
        assignDialog={assignDialog} onClose={() => setAssignDialog(null)} employees={employees}
        selectedShift={selectedShift} onShiftChange={setSelectedShift}
        onSave={() => { if (assignDialog) assignMutation.mutate({ user_id: assignDialog.userId, shift_date: assignDialog.date, shift_type: selectedShift }); }}
        isPending={assignMutation.isPending}
      />

      <SwapRequestDialog
        swapDialog={swapDialog} onClose={() => setSwapDialog(null)} employees={employees}
        swapToUserId={swapToUserId} onSwapToUserChange={setSwapToUserId}
        swapReason={swapReason} onSwapReasonChange={setSwapReason}
        onSend={() => {
          if (!swapDialog) return;
          const p: { from_employee_id?: string; to_employee_id?: string; shift_date: string; reason: string } =
            { shift_date: swapDialog.date, reason: swapReason };
          if (isHR && swapDialog.userId !== String(authUser?.id)) p.from_employee_id = swapDialog.userId;
          if (swapToUserId) p.to_employee_id = swapToUserId;
          swapMutation.mutate(p);
        }}
        isPending={swapMutation.isPending}
      />

      <DeleteEntryConfirm
        deleteEntryId={deleteEntryId}
        onOpenChange={(v) => { if (!v) setDeleteEntryId(null); }}
        onConfirm={() => { if (deleteEntryId !== null) { deleteMutation.mutate(deleteEntryId); setDeleteEntryId(null); } }}
      />
    </div>
  );
}
