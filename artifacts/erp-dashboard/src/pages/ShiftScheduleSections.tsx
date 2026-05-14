/**
 * @module ShiftScheduleSections
 * @description Grid and Swaps tab section components for ShiftSchedule.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, ArrowRightLeft, Trash2, Plus, Filter, Search } from "lucide-react";
import type {
  ShiftType, Employee, Department, ShiftScheduleEntry, ShiftSwapRequest,
} from "./ShiftScheduleTypes";
import { SHIFT_COLORS, SHIFT_ICONS, SHIFT_TIMES, SHIFT_LABELS, PAGE_SIZE, DAY_NAMES } from "./ShiftScheduleTypes";

import { EPLoader } from "@/components/ep";
// ── Grid Tab ──────────────────────────────────────────────────────────────

interface GridTabProps {
  weekDates: Date[]; todayStr: string; pagedEmployees: Employee[]; filteredEmployees: Employee[];
  page: number; totalPages: number; schedLoading: boolean; scheduleMap: Record<string, Record<string, ShiftScheduleEntry>>;
  isHR: boolean; authUserId: string | undefined; searchQuery: string; selectedDeptId: string; departments: Department[];
  onSearchChange: (v: string) => void; onDeptChange: (v: string) => void; onPrevWeek: () => void; onNextWeek: () => void;
  onToday: () => void; onPrevPage: () => void; onNextPage: () => void;
  onAssign: (date: string, userId: string) => void; onSwap: (userId: string, date: string) => void; onDelete: (id: number) => void;
}

export function GridTab({
  weekDates, todayStr, pagedEmployees, filteredEmployees, page, totalPages,
  schedLoading, scheduleMap, isHR, authUserId, searchQuery, selectedDeptId,
  departments, onSearchChange, onDeptChange, onPrevWeek, onNextWeek, onToday,
  onPrevPage, onNextPage, onAssign, onSwap, onDelete,
}: GridTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrevWeek} data-testid="button-prev-week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-base font-semibold min-w-[180px] text-center" data-testid="text-week-range">
              {weekDates[0].getDate()} {weekDates[0].toLocaleString("uz", { month: "short" })}
              {" – "}
              {weekDates[6].getDate()} {weekDates[6].toLocaleString("uz", { month: "short", year: "numeric" })}
            </span>
            <Button variant="outline" size="icon" onClick={onNextWeek} data-testid="button-next-week">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToday} data-testid="button-today">Bugun</Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Xodim qidirish..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-8 w-44 h-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDeptId} onValueChange={onDeptChange}>
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
            <span className="ml-2">(Sahifa {page + 1} / {totalPages})</span>
          )}
        </div>

        {schedLoading ? (
          <div className="flex items-center justify-center h-32">
            <EPLoader size={24} tone="muted" />
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
                    const isToday = d.toISOString().slice(0, 10) === todayStr;
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={`h-${i}`} className={`text-center py-2 px-2 border-b font-medium text-xs min-w-[90px] ${isToday ? "bg-primary/10 text-primary" : isWeekend ? "bg-muted/60" : "bg-muted"}`}>
                        <div>{DAY_NAMES[i]}</div>
                        <div className={`text-base font-bold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[13px] text-muted-foreground">Xodimlar topilmadi</td>
                  </tr>
                ) : (
                  (Array.isArray(pagedEmployees) ? pagedEmployees : []).map(emp => (
                    <tr key={emp.id} className="border-b hover:bg-muted/40/50 transition-colors">
                      <td className="py-2 px-3 text-sm sticky left-0 z-10 bg-background border-r">
                        <div className="font-medium truncate max-w-[160px]">{emp.fullName}</div>
                        {emp.departmentName && (
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{emp.departmentName}</div>
                        )}
                      </td>
                      {(Array.isArray(weekDates) ? weekDates : []).map((d, di) => {
                        const dateStr = d.toISOString().slice(0, 10);
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const entry = scheduleMap[emp.id]?.[dateStr];
                        const canSwap = isHR || emp.id === authUserId;
                        return (
                          <td key={di} className={`py-1 px-1 text-center align-middle ${isWeekend ? "bg-muted/20" : ""}`}
                            data-testid={`cell-${emp.id}-${dateStr}`}>
                            {entry ? (
                              <div className={`group relative inline-flex flex-col items-center rounded border px-1.5 py-1 text-xs font-medium gap-0.5 ${SHIFT_COLORS[entry.shift_type] ?? "bg-gray-100 text-gray-700 border-gray-200"} ${entry.status === "swap_pending" ? "ring-2 ring-orange-400" : ""}`}>
                                <div className="flex items-center gap-1">
                                  {SHIFT_ICONS[entry.shift_type]}
                                  <span>{SHIFT_LABELS[entry.shift_type] ?? entry.shift_type}</span>
                                </div>
                                <span className="text-[10px] opacity-70">{entry.start_time}–{entry.end_time}</span>
                                {canSwap && (
                                  <div className="absolute top-0 right-0 hidden group-hover:flex gap-0.5 bg-white rounded shadow p-0.5 z-10">
                                    <button title="Almashish so'rovi" className="text-[var(--ep-primary)] hover:text-orange-700 p-0.5"
                                      onClick={() => onSwap(emp.id, dateStr)}
                                      data-testid={`btn-swap-${emp.id}-${dateStr}`}>
                                      <ArrowRightLeft className="h-3 w-3" />
                                    </button>
                                    {isHR && (
                                      <button title="O'chirish" className="text-[var(--ep-red)] hover:text-red-700 p-0.5"
                                        onClick={() => onDelete(entry.id)}
                                        data-testid={`btn-delete-${emp.id}-${dateStr}`}>
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : isHR ? (
                              <button className="w-full h-10 flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                                onClick={() => onAssign(dateStr, emp.id)}
                                data-testid={`btn-assign-${emp.id}-${dateStr}`}>
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrevPage} disabled={page === 0} data-testid="btn-prev-page">
              <ChevronLeft className="h-4 w-4" />Oldingi
            </Button>
            <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={onNextPage} disabled={page >= totalPages - 1} data-testid="btn-next-page">
              Keyingi<ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

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
  );
}

// ── Swaps Tab ─────────────────────────────────────────────────────────────

interface SwapsTabProps {
  swapLoading: boolean; swapRequests: ShiftSwapRequest[]; pendingSwaps: number;
  isHR: boolean; isApprovePending: boolean; onApprove: (id: number, action: "approve" | "reject") => void;
}

export function SwapsTab({ swapLoading, swapRequests, pendingSwaps, isHR, isApprovePending, onApprove }: SwapsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-primary" />Smena Almashish So'rovlari{pendingSwaps > 0 && <Badge className="bg-amber-100 text-amber-800">{pendingSwaps} kutmoqda</Badge>}</CardTitle>
      </CardHeader>
      <CardContent>
        {swapLoading ? (
          <div className="flex items-center justify-center h-24">
            <EPLoader size={24} tone="muted" />
          </div>
        ) : swapRequests.length === 0 ? (
          <div className="text-center py-10 text-[13px] text-muted-foreground">
            <ArrowRightLeft className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Hech qanday so'rov yo'q</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" data-testid="swap-table">
              <thead>
                <tr className="bg-muted">
                  {["So'rov beruvchi", "Kim bilan", "Sana", "Sabab", "Holat"].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold">{h}</th>
                  ))}
                  {isHR && <th className="text-left py-2 px-3 font-semibold">Amallar</th>}
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(swapRequests) ? swapRequests : []).map(req => (
                  <tr key={req.id} className="border-b hover:bg-muted/40/50">
                    <td className="py-2 px-3">{req.from_employee_name ?? req.from_employee_id}</td>
                    <td className="py-2 px-3">{req.to_employee_name ?? req.to_employee_id ?? "—"}</td>
                    <td className="py-2 px-3">{req.shift_date?.slice(0, 10)}</td>
                    <td className="py-2 px-3 max-w-[200px] truncate">{req.reason ?? "—"}</td>
                    <td className="py-2 px-3">
                      <Badge className={
                        req.status === "approved" ? "bg-green-100 text-green-800" :
                        req.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"}>
                        {req.status === "approved" ? "Tasdiqlangan" : req.status === "rejected" ? "Rad etilgan" : "Kutmoqda"}
                      </Badge>
                    </td>
                    {isHR && (
                      <td className="py-2 px-3">
                        {req.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-[var(--ep-green)] border-green-300 hover:bg-green-50"
                              onClick={() => onApprove(req.id, "approve")} disabled={isApprovePending}
                              data-testid={`btn-approve-${req.id}`}>
                              <CheckCircle className="h-4 w-4 mr-1" />Tasdiqlash
                            </Button>
                            <Button size="sm" variant="outline" className="text-[var(--ep-red)] border-red-300 hover:bg-red-50"
                              onClick={() => onApprove(req.id, "reject")} disabled={isApprovePending}
                              data-testid={`btn-reject-${req.id}`}>
                              <XCircle className="h-4 w-4 mr-1" />Rad etish
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
  );
}
