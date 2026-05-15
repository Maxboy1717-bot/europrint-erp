/**
 * @module ShiftReportsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface ShiftReport {
  id: string | number;
  report_number?: string;
  reportNumber?: string;
  shift_date?: string;
  shiftDate?: string;
  shift_type?: string;
  shiftType?: string;
  work_center?: string;
  workCenter?: string;
  operator_name?: string;
  operatorName?: string;
  status?: string;
  planned_qty?: number;
  plannedQty?: number;
  actual_qty?: number;
  actualQty?: number;
  defect_qty?: number;
  defectQty?: number;
  downtime_minutes?: number;
  downtimeMinutes?: number;
  notes?: string;
  created_at?: string;
  createdAt?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open:     { label: "Ochiq",      variant: "secondary" },
  closed:   { label: "Yopilgan",   variant: "default"   },
  approved: { label: "Tasdiqlandi", variant: "default"  },
  rejected: { label: "Rad etildi", variant: "destructive" },
};

const SHIFT_LABELS: Record<string, string> = {
  day:     "☀️ Kunduz",
  evening: "🌆 Kechqurun",
  night:   "🌙 Tun",
};

const QUERY_KEY = ["/api/production/shift-reports"];

export default function ShiftReportsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    shift_date: new Date().toISOString().slice(0, 10),
    shift_type: "day",
    work_center: "",
    planned_qty: "",
    actual_qty: "",
    defect_qty: "0",
    notes: "",
  });

  const { data: rawData, isLoading, isError, refetch } = useQuery<
    ShiftReport[] | { data?: ShiftReport[]; items?: ShiftReport[] }
  >({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      return await apiRequest("GET", "/api/production/shift-reports?page=1&limit=50");
    },
  });

  const reports: ShiftReport[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: ShiftReport[] })?.data
      ?? (rawData as { items?: ShiftReport[] })?.items
      ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/production/shift-reports", {
        ...dto,
        planned_qty: dto.planned_qty ? parseInt(dto.planned_qty) : 0,
        actual_qty:  dto.actual_qty  ? parseInt(dto.actual_qty)  : 0,
        defect_qty:  dto.defect_qty  ? parseInt(dto.defect_qty)  : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Smenа hisoboti yaratildi" });
      setShowCreate(false);
      setForm({ shift_date: new Date().toISOString().slice(0, 10), shift_type: "day", work_center: "", planned_qty: "", actual_qty: "", defect_qty: "0", notes: "" });
    },
    onError: () => toast({ title: "Xatolik", description: "Yaratishda muammo", variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="production"
      title={t("smenaHisobotlari")}
      icon={<FileText className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-shift-report">
          <Plus className="h-4 w-4 mr-2" />
          {t("hisobotQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44 rounded-lg" />
                    <Skeleton className="h-3 w-60 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("smenaHisobotlariYoq")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map(r => {
              const status    = r.status ?? "open";
              const sc        = STATUS_MAP[status] ?? STATUS_MAP.open;
              const shiftType = r.shift_type ?? r.shiftType ?? "day";
              const wc        = r.work_center ?? r.workCenter ?? "—";
              const planned   = r.planned_qty ?? r.plannedQty ?? 0;
              const actual    = r.actual_qty  ?? r.actualQty  ?? 0;
              const defects   = r.defect_qty  ?? r.defectQty;
              const downtime  = r.downtime_minutes ?? r.downtimeMinutes;
              const date      = r.shift_date ?? r.shiftDate;
              const operator  = r.operator_name ?? r.operatorName;
              const efficiency = planned > 0 ? Math.round((actual / planned) * 100) : null;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-shift-${r.id}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{SHIFT_LABELS[shiftType] ?? shiftType} — {wc}</p>
                        <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                        {efficiency !== null && (
                          <Badge
                            variant={efficiency >= 100 ? "default" : efficiency >= 80 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {efficiency}% samaradorlik
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {date && <span>📅 {new Date(date).toLocaleDateString("uz-UZ")}</span>}
                        <span>Reja: {planned} / Fakt: {actual}</span>
                        {defects !== undefined && defects > 0 && (
                          <span className="text-destructive">Brak: {defects}</span>
                        )}
                        {downtime !== undefined && downtime > 0 && (
                          <span>To'xtash: {downtime} daq</span>
                        )}
                        {operator && <span>👷 {operator}</span>}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{r.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiSmenaHisoboti")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("date")}</Label>
                <Input
                  type="date"
                  value={form.shift_date}
                  onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))}
                  data-testid="input-shift-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("smena")}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.shift_type}
                  onChange={e => setForm(f => ({ ...f, shift_type: e.target.value }))}
                  data-testid="select-shift-type"
                >
                  <option value="day">{t("kunduz")}</option>
                  <option value="evening">{t("kechqurun")}</option>
                  <option value="night">{t("tun")}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("ishMarkazi")}</Label>
              <Input
                value={form.work_center}
                onChange={e => setForm(f => ({ ...f, work_center: e.target.value }))}
                placeholder={t("ishMarkaziNomi")}
                data-testid="input-shift-wc"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("reja")}</Label>
                <Input type="number" value={form.planned_qty} onChange={e => setForm(f => ({ ...f, planned_qty: e.target.value }))} placeholder="0" data-testid="input-shift-planned" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fakt")}</Label>
                <Input type="number" value={form.actual_qty} onChange={e => setForm(f => ({ ...f, actual_qty: e.target.value }))} placeholder="0" data-testid="input-shift-actual" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Brak")}</Label>
                <Input type="number" value={form.defect_qty} onChange={e => setForm(f => ({ ...f, defect_qty: e.target.value }))} placeholder="0" data-testid="input-shift-defect" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Izoh")}</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder={t("smenaIzohi")} data-testid="input-shift-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              data-testid="button-confirm-shift-report"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
