/**
 * @module ShiftDetailModal
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList, Gauge, Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  formatNum, formatDate, formatDateTime, pct, oeeColor,
  SHIFT_STATUS, DOWNTIME_REASONS,
} from "./helpers";
import { ShiftReport, DowntimeRecord, HourlyProduction } from "./types";

interface ShiftDetailModalProps {
  reportId: number | null;
  open: boolean;
  onClose: () => void;
}

export function ShiftDetailModal({ reportId, open, onClose }: ShiftDetailModalProps) {
  const { toast } = useToast();
  const [closeForm, setCloseForm] = useState({ produced_qty: "", defective_qty: "", rework_qty: "", supervisor_notes: "", next_shift_plan: "" });
  const [dtForm, setDtForm] = useState({ started_at: "", duration_min: "", reason_type: "machine_failure", reason_description: "", is_planned: false });
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [showDtForm, setShowDtForm] = useState(false);

  const { data, isLoading, refetch } = useQuery<{
    report: ShiftReport;
    downtimes: DowntimeRecord[];
    hourlyProduction: HourlyProduction[];
    qualityChecks: unknown[];
  }>({
    queryKey: ["/api/production/shift-reports", reportId],
    queryFn: async () => {
      const r = await apiRequest('GET', `/api/production/shift-reports/${reportId}`);
      if (!r.ok) throw new Error("Xato");
      return r.json();
    },
    enabled: !!reportId && open,
  });

  const closeMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", `/api/production/shift-reports/${reportId}/close`, body),
    onSuccess: () => {
      toast({ title: "Smena yopildi" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/production/shift-reports"] });
      setShowCloseForm(false);
    },
    onError: (e: Error) => toast({ title: "Xato", description: e.message, variant: "destructive" }),
  });

  const dtMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", `/api/production/shift-reports/${reportId}/downtime`, body),
    onSuccess: () => {
      toast({ title: "To'xtatish qo'shildi" });
      refetch();
      setDtForm({ started_at: "", duration_min: "", reason_type: "machine_failure", reason_description: "", is_planned: false });
      setShowDtForm(false);
    },
    onError: (e: Error) => toast({ title: "Xato", description: e.message, variant: "destructive" }),
  });

  const report = data?.report;
  const downtimes = data?.downtimes || [];
  const hourly = data?.hourlyProduction || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {isLoading ? <Skeleton className="h-5 w-32 rounded-lg" /> : report?.report_number || "Smena xisoboti"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { label: "Bo'lim", value: report.department },
                { label: "Smena", value: `${report.shift_number}-smena` },
                { label: "Sana", value: formatDate(report.shift_date) },
                { label: "Holat", value: <Badge variant={SHIFT_STATUS[report.status]?.variant || "secondary"}>{SHIFT_STATUS[report.status]?.label || report.status}</Badge> },
                { label: "Reja (dona)", value: formatNum(report.planned_qty) },
                { label: "Ishlab chiq.", value: formatNum(report.produced_qty) },
                { label: "Nosifat", value: formatNum(report.defective_qty) },
                { label: "Sifat %", value: report.quality_rate ? `${Number(report.quality_rate).toFixed(1)}%` : "—" },
              ]).map((item) => (
                <div key={item.label} className="bg-muted/30 rounded-md p-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {report.oee_percent && (
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-md">
                <Gauge className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">OEE</p>
                  <p className={`text-xl font-bold ${oeeColor(Number(report.oee_percent))}`}>{Number(report.oee_percent).toFixed(1)}%</p>
                </div>
                <div className="ml-4">
                  <p className="text-xs text-muted-foreground">Ish vaqti</p>
                  <p className="font-medium">{report.net_working_min || "—"} min</p>
                </div>
                <div className="ml-4">
                  <p className="text-xs text-muted-foreground">To'xtatish</p>
                  <p className="font-medium text-[var(--ep-primary)]">{report.actual_stop_min || 0} min</p>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">To'xtatishlar jurnali ({downtimes.length})</h4>
                {report.status === "in_progress" && (
                  <Button size="sm" variant="outline" onClick={() => setShowDtForm(!showDtForm)} data-testid="button-add-downtime">
                    <Plus className="w-3 h-3 mr-1" /> Qo'shish
                  </Button>
                )}
              </div>
              {showDtForm && (
                <div className="border rounded-md p-3 mb-3 space-y-2 bg-muted/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Boshlanish vaqti</Label>
                      <Input type="datetime-local" value={dtForm.started_at} onChange={(e) => setDtForm(f => ({ ...f, started_at: e.target.value }))} data-testid="input-dt-start" />
                    </div>
                    <div>
                      <Label className="text-xs">Davomiylik (min)</Label>
                      <Input type="number" placeholder="30" value={dtForm.duration_min} onChange={(e) => setDtForm(f => ({ ...f, duration_min: e.target.value }))} data-testid="input-dt-duration" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Sabab</Label>
                    <Select value={dtForm.reason_type} onValueChange={(v) => setDtForm(f => ({ ...f, reason_type: v }))}>
                      <SelectTrigger data-testid="select-dt-reason" className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(DOWNTIME_REASONS) ? DOWNTIME_REASONS : []).map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Izoh</Label>
                    <Input placeholder="Qo'shimcha ma'lumot" value={dtForm.reason_description} onChange={(e) => setDtForm(f => ({ ...f, reason_description: e.target.value }))} data-testid="input-dt-desc" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!dtForm.started_at || !dtForm.duration_min || dtMut.isPending}
                      onClick={() => dtMut.mutate({ ...dtForm, duration_min: Number(dtForm.duration_min) })}
                      data-testid="button-save-downtime">
                      Saqlash
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowDtForm(false)}>Bekor</Button>
                  </div>
                </div>
              )}
              {downtimes.length > 0 ? (
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Boshlanish</TableHead>
                      <TableHead>Davomiylik</TableHead>
                      <TableHead>Sabab</TableHead>
                      <TableHead>Tur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(downtimes) ? downtimes : []).map((dt) => (
                      <TableRow key={dt.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="text-sm">{formatDateTime(dt.started_at)}</TableCell>
                        <TableCell className="text-sm">{dt.duration_min || "—"} min</TableCell>
                        <TableCell className="text-sm">{(Array.isArray(DOWNTIME_REASONS) ? DOWNTIME_REASONS : []).find(r => r.value === dt.reason_type)?.label || dt.reason_type}</TableCell>
                        <TableCell>
                          <Badge variant={dt.is_planned ? "secondary" : "destructive"} className="text-xs">
                            {dt.is_planned ? "Rejalashtirilgan" : "Rejalashmagan"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">To'xtatish hodisalari yo'q</p>
              )}
            </div>

            {hourly.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Soatlik unumdorlik</h4>
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Soat</TableHead>
                      <TableHead className="text-right">Reja</TableHead>
                      <TableHead className="text-right">Amalda</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                      <TableHead>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(hourly) ? hourly : []).map((h) => {
                      const pValue = pct(Number(h.actual_qty), Number(h.planned_qty));
                      return (
                        <TableRow key={h.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="text-sm">{formatDateTime(h.hour_start)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{formatNum(h.planned_qty)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{formatNum(h.actual_qty)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{formatNum(h.cumulative_qty)}</TableCell>
                          <TableCell>
                            <span className={pValue >= 100 ? "text-[var(--ep-green)]" : pValue >= 80 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}>
                              {pValue}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              </div>
            )}

            {report.status === "in_progress" && (
              <div className="border-t pt-4">
                <Button variant="outline" onClick={() => setShowCloseForm(!showCloseForm)} data-testid="button-toggle-close-form">
                  {showCloseForm ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                  Smenani Yopish
                </Button>
                {showCloseForm && (
                  <div className="mt-3 space-y-3 bg-muted/10 rounded-md p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Ishlab chiq. (dona) *</Label>
                        <Input type="number" value={closeForm.produced_qty} onChange={(e) => setCloseForm(f => ({ ...f, produced_qty: e.target.value }))} data-testid="input-close-produced" />
                      </div>
                      <div>
                        <Label>Nosifat (dona)</Label>
                        <Input type="number" value={closeForm.defective_qty} onChange={(e) => setCloseForm(f => ({ ...f, defective_qty: e.target.value }))} data-testid="input-close-defective" />
                      </div>
                      <div>
                        <Label>Qayta ishlash (dona)</Label>
                        <Input type="number" value={closeForm.rework_qty} onChange={(e) => setCloseForm(f => ({ ...f, rework_qty: e.target.value }))} data-testid="input-close-rework" />
                      </div>
                    </div>
                    <div>
                      <Label>Ustaning izohi</Label>
                      <Textarea rows={2} value={closeForm.supervisor_notes} onChange={(e) => setCloseForm(f => ({ ...f, supervisor_notes: e.target.value }))} data-testid="input-close-notes" />
                    </div>
                    <div>
                      <Label>Keyingi smena uchun reja</Label>
                      <Textarea rows={2} value={closeForm.next_shift_plan} onChange={(e) => setCloseForm(f => ({ ...f, next_shift_plan: e.target.value }))} data-testid="input-close-next-plan" />
                    </div>
                    <Button
                      disabled={!closeForm.produced_qty || closeMut.isPending}
                      onClick={() => closeMut.mutate({
                        produced_qty: Number(closeForm.produced_qty),
                        defective_qty: Number(closeForm.defective_qty) || 0,
                        rework_qty: Number(closeForm.rework_qty) || 0,
                        supervisor_notes: closeForm.supervisor_notes,
                        next_shift_plan: closeForm.next_shift_plan,
                        shift_end: new Date().toISOString(),
                      })}
                      data-testid="button-close-shift"
                    >
                      {closeMut.isPending ? "Saqlanmoqda..." : "Smenani Yopish"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">Ma'lumot topilmadi</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
