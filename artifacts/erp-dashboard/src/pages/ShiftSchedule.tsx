import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Calendar, ChevronLeft, ChevronRight, Users, Sun, Moon, Sunrise,
  Loader2, RefreshCw, CheckCircle, XCircle, ArrowRightLeft, Trash2, Plus, Filter, Search,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/hooks/useAuth";

type ShiftType = "MORNING" | "EVENING" | "NIGHT";

interface Employee {
  id: string;
  fullName: string;
  departmentId?: string;
  departmentName?: string;
  status?: string;
  shift?: string;
}

interface Department {
  id: string;
  name: string;
}

interface ShiftScheduleEntry {
  id: number;
  user_id: string;
  shift_date: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  status: string;
  full_name?: string;
  department_id?: string;
  department_name?: string;
}

interface ShiftSwapRequest {
  id: number;
  from_employee_id: string;
  to_employee_id?: string;
  shift_date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  from_employee_name?: string;
  to_employee_name?: string;
  approved_by_name?: string;
  created_at: string;
}

const SHIFT_COLORS: Record<ShiftType, string> = {
  MORNING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  EVENING: "bg-orange-100 text-orange-800 border-orange-300",
  NIGHT: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

const SHIFT_ICONS: Record<ShiftType, React.ReactNode> = {
  MORNING: <Sun className="h-3 w-3" />,
  EVENING: <Sunrise className="h-3 w-3" />,
  NIGHT: <Moon className="h-3 w-3" />,
};

const SHIFT_TIMES: Record<ShiftType, string> = {
  MORNING: "08:00–17:00",
  EVENING: "17:00–02:00",
  NIGHT: "02:00–08:00",
};

const SHIFT_LABELS: Record<ShiftType, string> = {
  MORNING: "Ertalab",
  EVENING: "Kechki",
  NIGHT: "Tungi",
};

const PAGE_SIZE = 50;

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ShiftSchedule() {
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

  const { data: rawEmployees = [], isLoading: empLoading, isError: empError, refetch: refetchEmps } = useQuery<Employee[]>({
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
    () => ["/api/hr/shifts/schedule", weekStart, selectedDeptId],
    [weekStart, selectedDeptId]
  );

  const { data: schedules = [], isLoading: schedLoading, refetch: refetchSchedules } = useQuery<ShiftScheduleEntry[]>({
    queryKey: scheduleKey,
    queryFn: () => {
      const params = new URLSearchParams({ week_start: weekStart });
      if (selectedDeptId !== "all") params.set("department_id", selectedDeptId);
      return apiRequest("GET", `/api/hr/shifts/schedule?${params}`);
    },
  });

  const { data: swapRequests = [], isLoading: swapLoading, refetch: refetchSwaps } = useQuery<ShiftSwapRequest[]>({
    queryKey: ["/api/hr/shifts/swap-requests"],
    queryFn: () => apiRequest("GET", "/api/hr/shifts/swap-requests"),
  });

  const { data: todayShifts = [] } = useQuery<ShiftScheduleEntry[]>({
    queryKey: ["/api/hr/shifts/today"],
    queryFn: () => apiRequest("GET", "/api/hr/shifts/today"),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { user_id: string; shift_date: string; shift_type: ShiftType }) =>
      apiRequest("POST", "/api/hr/shifts/schedule", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/today"] });
      toast({ title: "Smena tayinlandi" });
      setAssignDialog(null);
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/today"] });
      toast({ title: "Smena o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const swapMutation = useMutation({
    mutationFn: (data: { from_employee_id?: string; to_employee_id?: string; shift_date: string; reason: string }) =>
      apiRequest("POST", "/api/hr/shifts/swap-request", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/swap-requests"] });
      toast({ title: "Almashish so'rovi yuborildi" });
      setSwapDialog(null);
      setSwapToUserId("");
      setSwapReason("");
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      apiRequest("PATCH", `/api/hr/shifts/swap-request/${id}/approve`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/swap-requests"] });
      toast({ title: "So'rov yangilandi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const filteredEmployees = useMemo(() => {
    let list = (Array.isArray(employees) ? employees : []).filter(e => e.status !== "deleted");
    if (selectedDeptId !== "all") {
      list = (Array.isArray(list) ? list : []).filter(e => e.departmentId === selectedDeptId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = (Array.isArray(list) ? list : []).filter(e => e.fullName.toLowerCase().includes(q));
    }
    return list;
  }, [employees, selectedDeptId, searchQuery]);

  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const pagedEmployees = filteredEmployees.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    setPage(0);
  }, []);

  const handleDeptChange = useCallback((val: string) => {
    setSelectedDeptId(val);
    setPage(0);
  }, []);

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
  const nightCount = (Array.isArray(todayShifts) ? todayShifts : []).filter(s => s.shift_type === "NIGHT").length;
  const pendingSwaps = (Array.isArray(swapRequests) ? swapRequests : []).filter(r => r.status === "pending").length;

  const dayNames = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];

  if (empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (empError) return <ErrorState onRetry={refetchEmps} />;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            {tCommon('shiftScheduleTitle')}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchSchedules(); refetchSwaps(); }} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-4 flex items-center gap-3">
          <Users className="h-7 w-7 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon("totalEmployeesLabel")}</p>
            <p className="text-3xl font-bold text-on-surface" data-testid="text-today-total">{todayShifts.length}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-4 flex items-center gap-3">
          <Sun className="h-7 w-7 text-yellow-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon("morningShiftLabel")}</p>
            <p className="text-3xl font-bold text-on-surface" data-testid="text-morning-count">{morningCount}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-4 flex items-center gap-3">
          <Sunrise className="h-7 w-7 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon("eveningShiftLabel")}</p>
            <p className="text-3xl font-bold text-on-surface" data-testid="text-evening-count">{eveningCount}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-4 flex items-center gap-3">
          <Moon className="h-7 w-7 text-indigo-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon("nightShiftLabel")}</p>
            <p className="text-3xl font-bold text-on-surface" data-testid="text-night-count">{nightCount}</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("grid")}
          data-testid="tab-grid"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Haftalik Jadval
        </Button>
        <Button
          variant={activeTab === "swaps" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("swaps")}
          data-testid="tab-swaps"
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Almashish So'rovlari
          {pendingSwaps > 0 && (
            <Badge className="ml-2 bg-red-500 text-white text-xs">{pendingSwaps}</Badge>
          )}
        </Button>
      </div>

      {activeTab === "grid" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Week navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                  data-testid="button-prev-week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base font-semibold min-w-[180px] text-center" data-testid="text-week-range">
                  {weekDates[0].getDate()} {weekDates[0].toLocaleString("uz", { month: "short" })}
                  {" – "}
                  {weekDates[6].getDate()} {weekDates[6].toLocaleString("uz", { month: "short", year: "numeric" })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                  data-testid="button-next-week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} data-testid="button-today">
                  Bugun
                </Button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Xodim qidirish..."
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="pl-8 w-44 h-9"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedDeptId} onValueChange={handleDeptChange}>
                    <SelectTrigger className="w-44 h-9" data-testid="select-department">
                      <SelectValue placeholder="Barcha bo'limlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha bo'limlar</SelectItem>
                      {(Array.isArray(departments) ? departments : []).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-2 text-sm text-muted-foreground">
              {filteredEmployees.length} xodim
              {filteredEmployees.length > PAGE_SIZE && (
                <span className="ml-2">
                  (Sahifa {page + 1} / {totalPages})
                </span>
              )}
            </div>

            {schedLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]" data-testid="shift-grid">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3 border-b bg-muted font-semibold text-sm min-w-[170px] sticky left-0 z-10 bg-background">
                        Xodim
                      </th>
                      {(Array.isArray(weekDates) ? weekDates : []).map((d, i) => {
                        const isToday = fmt(d) === todayStr;
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <th
                            key={`k-${i}`}
                            className={`text-center py-2 px-2 border-b font-medium text-xs min-w-[90px] ${
                              isToday ? "bg-primary/10 text-primary" : isWeekend ? "bg-muted/60" : "bg-muted"
                            }`}
                          >
                            <div>{dayNames[i]}</div>
                            <div className={`text-base font-bold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-muted-foreground">
                          Xodimlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      (Array.isArray(pagedEmployees) ? pagedEmployees : []).map(emp => (
                        <tr key={emp.id} className="border-b hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-2 px-3 text-sm sticky left-0 z-10 bg-background border-r">
                            <div className="font-medium truncate max-w-[160px]">{emp.fullName}</div>
                            {emp.departmentName && (
                              <div className="text-xs text-muted-foreground truncate max-w-[160px]">{emp.departmentName}</div>
                            )}
                          </td>
                          {(Array.isArray(weekDates) ? weekDates : []).map((d, di) => {
                            const dateStr = fmt(d);
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                            const entry = scheduleMap[emp.id]?.[dateStr];
                            return (
                              <td
                                key={di}
                                className={`py-1 px-1 text-center align-middle ${isWeekend ? "bg-muted/20" : ""}`}
                                data-testid={`cell-${emp.id}-${dateStr}`}
                              >
                                {entry ? (() => {
                                  // Employee can swap their own shifts; HR can swap any
                                  const canSwap = isHR || emp.id === String(authUser?.id);
                                  return (
                                    <div className={`group relative inline-flex flex-col items-center rounded border px-1.5 py-1 text-xs font-medium gap-0.5 ${SHIFT_COLORS[entry.shift_type] ?? "bg-gray-100 text-gray-700 border-gray-200"} ${entry.status === "swap_pending" ? "ring-2 ring-orange-400" : ""}`}>
                                      <div className="flex items-center gap-1">
                                        {SHIFT_ICONS[entry.shift_type]}
                                        <span>{SHIFT_LABELS[entry.shift_type] ?? entry.shift_type}</span>
                                      </div>
                                      <span className="text-[10px] opacity-70">{entry.start_time}–{entry.end_time}</span>
                                      {canSwap && (
                                        <div className="absolute top-0 right-0 hidden group-hover:flex gap-0.5 bg-white rounded shadow p-0.5 z-10">
                                          <button
                                            title="Almashish so'rovi"
                                            className="text-orange-500 hover:text-orange-700 p-0.5"
                                            onClick={() => {
                                              setSwapDialog({ open: true, userId: emp.id, date: dateStr });
                                              setSwapToUserId("");
                                              setSwapReason("");
                                            }}
                                            data-testid={`btn-swap-${emp.id}-${dateStr}`}
                                          >
                                            <ArrowRightLeft className="h-3 w-3" />
                                          </button>
                                          {isHR && (
                                            <button
                                              title="O'chirish"
                                              className="text-red-500 hover:text-red-700 p-0.5"
                                              onClick={() => setDeleteEntryId(entry.id)}
                                              data-testid={`btn-delete-${emp.id}-${dateStr}`}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : isHR ? (
                                  <button
                                    className="w-full h-10 flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                                    onClick={() => {
                                      setAssignDialog({ open: true, date: dateStr, userId: emp.id });
                                      setSelectedShift("MORNING");
                                    }}
                                    data-testid={`btn-assign-${emp.id}-${dateStr}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground/30 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  data-testid="btn-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Oldingi
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  data-testid="btn-next-page"
                >
                  Keyingi
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 justify-center text-sm">
              {(["MORNING", "EVENING", "NIGHT"] as ShiftType[]).map(type => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${SHIFT_COLORS[type]}`}>
                    {SHIFT_ICONS[type]} {SHIFT_LABELS[type]}
                  </span>
                  <span className="text-muted-foreground text-xs">{SHIFT_TIMES[type]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "swaps" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Smena Almashish So'rovlari
              {pendingSwaps > 0 && (
                <Badge className="bg-amber-100 text-amber-800">{pendingSwaps} kutmoqda</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {swapLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : swapRequests.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Hech qanday so'rov yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm" data-testid="swap-table">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-2 px-3 font-semibold">So'rov beruvchi</th>
                      <th className="text-left py-2 px-3 font-semibold">Kim bilan</th>
                      <th className="text-left py-2 px-3 font-semibold">Sana</th>
                      <th className="text-left py-2 px-3 font-semibold">Sabab</th>
                      <th className="text-left py-2 px-3 font-semibold">Holat</th>
                      {isHR && <th className="text-left py-2 px-3 font-semibold">Amallar</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(swapRequests) ? swapRequests : []).map(req => (
                      <tr key={req.id} className="border-b hover:bg-surface-container-low/50">
                        <td className="py-2 px-3">{req.from_employee_name ?? req.from_employee_id}</td>
                        <td className="py-2 px-3">{req.to_employee_name ?? req.to_employee_id ?? "—"}</td>
                        <td className="py-2 px-3">{req.shift_date?.slice(0, 10)}</td>
                        <td className="py-2 px-3 max-w-[200px] truncate">{req.reason ?? "—"}</td>
                        <td className="py-2 px-3">
                          <Badge
                            className={
                              req.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : req.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          >
                            {req.status === "approved" ? "Tasdiqlangan" : req.status === "rejected" ? "Rad etilgan" : "Kutmoqda"}
                          </Badge>
                        </td>
                        {isHR && (
                          <td className="py-2 px-3">
                            {req.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => approveMutation.mutate({ id: req.id, action: "approve" })}
                                  disabled={approveMutation.isPending}
                                  data-testid={`btn-approve-${req.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Tasdiqlash
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => approveMutation.mutate({ id: req.id, action: "reject" })}
                                  disabled={approveMutation.isPending}
                                  data-testid={`btn-reject-${req.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rad etish
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">{req.approved_by_name ?? "—"}</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Shift Dialog */}
      <Dialog open={!!assignDialog?.open} onOpenChange={open => !open && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smena Tayinlash</DialogTitle>
          </DialogHeader>
          {assignDialog && (
            <div className="space-y-4">
              <div>
                <Label>Xodim</Label>
                <p className="font-medium">{(employees ?? []).find(e => e.id === assignDialog.userId)?.fullName ?? assignDialog.userId}</p>
              </div>
              <div>
                <Label>Sana</Label>
                <p className="font-medium">{assignDialog.date}</p>
              </div>
              <div>
                <Label>Smena turi</Label>
                <Select value={selectedShift} onValueChange={v => setSelectedShift(v as ShiftType)}>
                  <SelectTrigger data-testid="select-shift-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        Ertalab (08:00–17:00)
                      </div>
                    </SelectItem>
                    <SelectItem value="EVENING">
                      <div className="flex items-center gap-2">
                        <Sunrise className="h-4 w-4 text-orange-500" />
                        Kechki (17:00–02:00)
                      </div>
                    </SelectItem>
                    <SelectItem value="NIGHT">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        Tungi (02:00–08:00)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAssignDialog(null)} data-testid="btn-assign-cancel">
                  Bekor qilish
                </Button>
                <Button
                  onClick={() =>
                    assignMutation.mutate({
                      user_id: assignDialog.userId,
                      shift_date: assignDialog.date,
                      shift_type: selectedShift,
                    })
                  }
                  disabled={assignMutation.isPending}
                  data-testid="btn-assign-save"
                >
                  {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Saqlash
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Swap Request Dialog */}
      <Dialog open={!!swapDialog?.open} onOpenChange={open => !open && setSwapDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smena Almashish So'rovi</DialogTitle>
          </DialogHeader>
          {swapDialog && (
            <div className="space-y-4">
              <div>
                <Label>Xodim</Label>
                <p className="font-medium">{(employees ?? []).find(e => e.id === swapDialog.userId)?.fullName ?? swapDialog.userId}</p>
              </div>
              <div>
                <Label>Sana</Label>
                <p className="font-medium">{swapDialog.date}</p>
              </div>
              <div>
                <Label>Kim bilan almashtirish (ixtiyoriy)</Label>
                <Select value={swapToUserId} onValueChange={setSwapToUserId}>
                  <SelectTrigger data-testid="select-swap-to">
                    <SelectValue placeholder="Xodim tanlang (ixtiyoriy)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(employees) ? employees : []).filter(e => e.id !== swapDialog.userId)
                      .map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sabab</Label>
                <Textarea
                  value={swapReason}
                  onChange={e => setSwapReason(e.target.value)}
                  placeholder="Almashish sababi..."
                  rows={3}
                  data-testid="textarea-swap-reason"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSwapDialog(null)} data-testid="btn-swap-cancel">
                  Bekor qilish
                </Button>
                <Button
                  onClick={() => {
                    const payload: { from_employee_id?: string; to_employee_id?: string; shift_date: string; reason: string } = {
                      shift_date: swapDialog.date,
                      reason: swapReason,
                    };
                    // If HR opens the dialog from another employee's cell, pass from_employee_id
                    if (isHR && swapDialog.userId !== String(authUser?.id)) {
                      payload.from_employee_id = swapDialog.userId;
                    }
                    if (swapToUserId) payload.to_employee_id = swapToUserId;
                    swapMutation.mutate(payload);
                  }}
                  disabled={swapMutation.isPending}
                  data-testid="btn-swap-send"
                >
                  {swapMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  So'rov Yuborish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteEntryId !== null}
        onOpenChange={(v) => { if (!v) setDeleteEntryId(null); }}
        title="Smena yozuvini o'chirish"
        description="Ushbu smena yozuvini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteEntryId !== null) { deleteMutation.mutate(deleteEntryId); setDeleteEntryId(null); } }}
      />
    </div>
  );
}
