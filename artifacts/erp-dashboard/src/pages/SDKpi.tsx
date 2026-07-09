/**
 * @module SDKpi
 * @description React page component. Route-level UI.
 * Added: KPI Targets section, Target edit dialog, Team table view, CSV export.
 */

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Download, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target } from "lucide-react";
import { fmt, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/sd-helpers";
import { tLabel } from "@/lib/i18n/tLabel";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamKpiItem {
  managerId: string;
  totalSales: number | string;
  ordersCount: number;
}

interface FunnelItem {
  status: string;
  count: number | string;
  totalValue: number | string;
}

interface TargetRow {
  id: number;
  managerId?: string;
  year?: number;
  month?: number;
  revenueTarget?: number;
  orderCountTarget?: number;
  newCustomerTarget?: number;
}

type KpiRow = TeamKpiItem;

// ---------------------------------------------------------------------------
// CSV helper
// ---------------------------------------------------------------------------

function downloadKpiCsv(data: KpiRow[]) {
  const header = "MenejerID,Jami savdo,Buyurtmalar";
  const rows = (Array.isArray(data) ? data : []).map(
    r => `${r.managerId},${Number(r.totalSales) || 0},${r.ordersCount}`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kpi.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SDKpi() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date();
  const { isAuthenticated } = useAuth();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // Target edit dialog
  const [editTarget, setEditTarget] = useState<{ open: boolean; target?: TargetRow }>({ open: false });
  const [editTargetForm, setEditTargetForm] = useState<Partial<TargetRow>>({});

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: teamRaw, isLoading: teamLoading, refetch } = useQuery({
    queryKey: ["/api/sd/kpi/team", year, month],
    queryFn: () => apiRequest("GET", `/api/sd/kpi/team?year=${year}&month=${month}`),
    enabled: isAuthenticated === true,
  });

  const team: TeamKpiItem[] = (() => {
    if (!teamRaw) return [];
    if (Array.isArray(teamRaw)) return teamRaw as TeamKpiItem[];
    const d = teamRaw as { items?: TeamKpiItem[] };
    return Array.isArray(d.items) ? d.items : [];
  })();

  const { data: funnelRaw, isLoading: funnelLoading } = useQuery({
    queryKey: ["/api/sd/reports/funnel"],
    enabled: isAuthenticated === true,
  });

  const funnel: FunnelItem[] = (() => {
    if (!funnelRaw) return [];
    if (Array.isArray(funnelRaw)) return funnelRaw as FunnelItem[];
    const d = funnelRaw as { items?: FunnelItem[] };
    return Array.isArray(d.items) ? d.items : [];
  })();

  const { data: targetsRaw } = useQuery({
    queryKey: ["/api/sd/kpi-targets"],
    queryFn: () => apiRequest("GET", "/api/sd/kpi-targets"),
    enabled: isAuthenticated === true,
  });

  const targets: TargetRow[] = (() => {
    if (!targetsRaw) return [];
    if (Array.isArray(targetsRaw)) return targetsRaw as TargetRow[];
    const d = targetsRaw as { items?: TargetRow[] };
    return Array.isArray(d.items) ? d.items : [];
  })();

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const updateTargetMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TargetRow> }) =>
      apiRequest("PATCH", `/api/sd/kpi-targets/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sd/kpi-targets"] });
      toast({ title: tLabel("sd.targets.updated", "Maqsad yangilandi") });
      setEditTarget({ open: false });
    },
    onError: () => toast({ title: tLabel("sd.error", "Xatolik"), variant: "destructive" }),
  });

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const totalTeamSales = (Array.isArray(team) ? team : []).reduce(
    (s, m) => s + (Number(m.totalSales) || 0),
    0,
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <div>
          <EPPageHeader
            breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("savdoKpi")}</b></>}
            title={t("savdoKpi")}
            subtitle={t("menejerReytingiKvotalarVaFunnel")}
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadKpiCsv(team)}
            data-testid="button-kpi-csv"
          >
            <Download className="h-4 w-4 mr-1" />
            {tLabel("sd.kpi.csvDownload", "CSV yuklab olish")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Select value={String(month)} onValueChange={v => setMonth(+v)}>
            <SelectTrigger className="w-40 bg-card border-border h-9" data-testid="select-kpi-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(MONTHS) ? MONTHS : []).map((m, i) => (
                <SelectItem key={`k-${i}`} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(+v)}>
            <SelectTrigger className="w-28 bg-card border-border h-9" data-testid="select-kpi-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([2024, 2025, 2026, 2027]).map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Team + Funnel ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team KPI Table */}
        <div className="bg-card rounded-xl border border-[var(--ep-border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("menejerlarReytingi")}
            </h3>
          </div>
          {teamLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`sk-${i}`} className="h-8 bg-muted/60 rounded animate-pulse" />
              ))}
            </div>
          ) : team.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {t("ushbuOydaBuyurtmalarYoq")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">#</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                      {tLabel("sd.col.managerId", "Menejer ID")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                      {tLabel("sd.col.totalSales", "Jami savdo")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                      {tLabel("sd.col.orders", "Buyurtmalar")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-4">
                      {tLabel("sd.col.share", "Ulush")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(Array.isArray(team) ? team : [])]
                    .sort((a, b) => (Number(b.totalSales) || 0) - (Number(a.totalSales) || 0))
                    .map((m, i) => (
                      <TableRow key={m.managerId || i} data-testid={`card-manager-kpi-${i}`} className="hover:bg-muted/40 border-none">
                        <TableCell className="py-2 px-4 text-muted-foreground font-medium">#{i + 1}</TableCell>
                        <TableCell className="py-2 px-4 font-medium text-foreground">
                          {m.managerId || tLabel("sd.unknown", "Noma'lum")}
                        </TableCell>
                        <TableCell className="py-2 px-4 font-mono text-foreground font-semibold">
                          {fmt(Number(m.totalSales) || 0)} so'm
                        </TableCell>
                        <TableCell className="py-2 px-4 text-foreground">{m.ordersCount}</TableCell>
                        <TableCell className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted/60 rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{
                                  width: totalTeamSales > 0
                                    ? `${Math.round((Number(m.totalSales) / totalTeamSales) * 100)}%`
                                    : "0%",
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-8 text-right">
                              {totalTeamSales > 0
                                ? Math.round((Number(m.totalSales) / totalTeamSales) * 100)
                                : 0}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Funnel */}
        <div className="bg-card rounded-xl p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            {t("leadFunnelTahlili")}
          </h3>
          <div className="space-y-3">
            {funnelLoading && <div className="text-sm text-muted-foreground">{t("Yuklanmoqda...")}</div>}
            {(Array.isArray(funnel) ? funnel : []).map((f) => (
              <div key={f.status} data-testid={`card-funnel-${f.status}`} className="flex items-center gap-3 text-sm">
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold min-w-[120px] text-center",
                  f.status === "won" ? "bg-green-100 text-green-800" :
                  f.status === "lost" ? "bg-red-100 text-red-800" :
                  f.status === "negotiating" ? "bg-amber-100 text-amber-800" :
                  "bg-primary/10 text-primary",
                )}>
                  {LEAD_STATUS_LABELS[f.status] || f.status}
                </span>
                <div className="flex-1 bg-muted/60 rounded-full h-2">
                  <div className="bg-primary/10 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((Number(f.count) / 20) * 100))}%` }} />
                </div>
                <span className="font-bold min-w-8 text-right">{f.count}</span>
                {Number(f.totalValue) > 0 && (
                  <span className="text-muted-foreground text-xs">{fmt(Number(f.totalValue))} so'm</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Targets Section ──────────────────────────────────────── */}
      <Card className="bg-card border-none rounded-xl">
        <div className="px-6 py-4 border-b border-border/40 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tLabel("sd.targets.title", "KPI Maqsadlar")}
          </h3>
        </div>
        <CardContent className="p-0">
          {targets.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border border-dashed border-border rounded-lg m-4">
              {tLabel("sd.targets.empty", "KPI maqsadlar mavjud emas")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.manager", "Menejer")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.year", "Yil")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.month", "Oy")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.revenueTarget", "Tushumlar rejasi")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.orderTarget", "Buyurtmalar rejasi")}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4">
                      {tLabel("sd.col.actions", "Amallar")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(targets) ? targets : []).map((tgt) => (
                    <TableRow key={tgt.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-target-${tgt.id}`}>
                      <TableCell className="py-3 px-4 font-medium text-foreground">{tgt.managerId || "—"}</TableCell>
                      <TableCell className="py-3 px-4 text-foreground">{tgt.year || "—"}</TableCell>
                      <TableCell className="py-3 px-4 text-foreground">
                        {tgt.month ? MONTHS[(tgt.month - 1)] : "—"}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-mono text-foreground">
                        {tgt.revenueTarget != null ? `${Number(tgt.revenueTarget).toLocaleString()} so'm` : "—"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-foreground">{tgt.orderCountTarget ?? "—"}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditTargetForm({
                              revenueTarget: tgt.revenueTarget,
                              orderCountTarget: tgt.orderCountTarget,
                              newCustomerTarget: tgt.newCustomerTarget,
                            });
                            setEditTarget({ open: true, target: tgt });
                          }}
                          data-testid={`btn-edit-target-${tgt.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Target Edit Dialog ───────────────────────────────────────── */}
      <Dialog open={editTarget.open} onOpenChange={(o) => setEditTarget({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel("sd.targets.editTitle", "KPI Maqsadni tahrirlash")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{tLabel("sd.targets.revenueLabel", "Tushumlar rejasi (so'm)")}</Label>
              <Input
                type="number"
                value={editTargetForm.revenueTarget ?? ""}
                onChange={(e) => setEditTargetForm({ ...editTargetForm, revenueTarget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>{tLabel("sd.targets.orderCountLabel", "Buyurtmalar rejasi (dona)")}</Label>
              <Input
                type="number"
                value={editTargetForm.orderCountTarget ?? ""}
                onChange={(e) => setEditTargetForm({ ...editTargetForm, orderCountTarget: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>{tLabel("sd.targets.newCustomerLabel", "Yangi mijozlar rejasi (dona)")}</Label>
              <Input
                type="number"
                value={editTargetForm.newCustomerTarget ?? ""}
                onChange={(e) => setEditTargetForm({ ...editTargetForm, newCustomerTarget: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button
              className="w-full"
              disabled={updateTargetMut.isPending}
              onClick={() => {
                if (editTarget.target?.id) {
                  updateTargetMut.mutate({ id: editTarget.target.id, data: editTargetForm });
                }
              }}
            >
              {updateTargetMut.isPending
                ? tLabel("sd.saving", "Saqlanmoqda...")
                : tLabel("sd.save", "Saqlash")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
