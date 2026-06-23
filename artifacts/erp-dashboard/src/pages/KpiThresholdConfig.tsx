/**
 * @module KpiThresholdConfig
 * @description Config page for KPI threshold definitions (target / warning / critical).
 * Route: /director/kpi-thresholds
 * Wraps GET+PATCH /api/director/dashboard/kpi-definitions.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface KpiDef {
  id: number;
  kpi_code: string;
  kpi_name: string;
  category: string;
  unit: string;
  target_value: string | number;
  warning_threshold: string | number;
  critical_threshold: string | number;
  threshold_direction: "asc" | "desc";
  is_active: boolean;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function KpiRow({
  row,
  onSave,
}: {
  row: KpiDef;
  onSave: (id: number, patch: { target_value?: number; warning_threshold?: number; critical_threshold?: number }) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const [editing, setEditing]   = useState(false);
  const [target, setTarget]     = useState(String(row.target_value));
  const [warn, setWarn]         = useState(String(row.warning_threshold));
  const [crit, setCrit]         = useState(String(row.critical_threshold));
  const [busy, setBusy]         = useState(false);

  function startEdit() {
    setTarget(String(row.target_value));
    setWarn(String(row.warning_threshold));
    setCrit(String(row.critical_threshold));
    setEditing(true);
  }

  async function handleSave() {
    const t = parseFloat(target);
    const w = parseFloat(warn);
    const c = parseFloat(crit);
    if ([t, w, c].some((v) => isNaN(v) || v <= 0)) {
      toast({ title: "Barcha qiymatlar musbat son bo'lishi kerak", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onSave(row.id, { target_value: t, warning_threshold: w, critical_threshold: c });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  const dirIcon = row.threshold_direction === "asc" ? "↑" : "↓";

  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground font-mono w-36">{row.kpi_code}</TableCell>
      <TableCell className="font-medium">{row.kpi_name}</TableCell>
      <TableCell className="text-xs text-muted-foreground w-24">{row.category}</TableCell>
      <TableCell className="w-8 text-center text-muted-foreground">{dirIcon}</TableCell>
      {editing ? (
        <>
          <TableCell className="w-24">
            <Input type="number" className="h-7 w-20 text-sm" value={target}
              onChange={(e) => setTarget(e.target.value)} />
          </TableCell>
          <TableCell className="w-24">
            <Input type="number" className="h-7 w-20 text-sm" value={warn}
              onChange={(e) => setWarn(e.target.value)} />
          </TableCell>
          <TableCell className="w-24">
            <Input type="number" className="h-7 w-20 text-sm" value={crit}
              onChange={(e) => setCrit(e.target.value)} />
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="w-24 tabular-nums text-right">{parseFloat(String(row.target_value)).toLocaleString("uz-UZ")} {row.unit}</TableCell>
          <TableCell className="w-24 tabular-nums text-right text-yellow-600">{parseFloat(String(row.warning_threshold)).toLocaleString("uz-UZ")}</TableCell>
          <TableCell className="w-24 tabular-nums text-right text-red-600">{parseFloat(String(row.critical_threshold)).toLocaleString("uz-UZ")}</TableCell>
        </>
      )}
      <TableCell className="w-24 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--ep-green)]"
              onClick={() => void handleSave()} disabled={busy}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
              onClick={() => setEditing(false)} disabled={busy}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function KpiThresholdConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<KpiDef[]>({
    queryKey: ["/api/director/dashboard/kpi-definitions"],
    queryFn: () => apiRequest<KpiDef[]>("GET", "/api/director/dashboard/kpi-definitions"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: {
      id: number;
      patch: { target_value?: number; warning_threshold?: number; critical_threshold?: number };
    }) => apiRequest<KpiDef>("PATCH", `/api/director/dashboard/kpi-definitions/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/dashboard/kpi-definitions"] });
      toast({ title: "KPI chegaralari saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  const kpis: KpiDef[] = Array.isArray(data) ? data : [];

  async function handleSave(
    id: number,
    patch: { target_value?: number; warning_threshold?: number; critical_threshold?: number },
  ) {
    await updateMutation.mutateAsync({ id, patch });
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <BarChart2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">KPI Chegaralari Konfiguratsiyasi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Har bir KPI uchun maqsad (target), ogohlantiruv va kritik chegara. ↑ = ko'p yaxshi, ↓ = kam yaxshi.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">KPI kodi</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead className="w-24">Kategoriya</TableHead>
              <TableHead className="w-8 text-center">Yo'nalish</TableHead>
              <TableHead className="w-24 text-right">Maqsad</TableHead>
              <TableHead className="w-24 text-right text-yellow-600">Ogohlantiruv</TableHead>
              <TableHead className="w-24 text-right text-red-600">Kritik</TableHead>
              <TableHead className="w-24 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : kpis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  KPI ta'riflari topilmadi
                </TableCell>
              </TableRow>
            ) : (
              kpis.map((row) => (
                <KpiRow key={row.id} row={row} onSave={handleSave} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        ↑ (asc): yuqori = yaxshi (davomat foizi). ↓ (desc): past = yaxshi (kechikishlar soni).
        Ogohlantiruv va kritik chegaralarga yetganda tizim xabar yuboradi.
      </p>
    </div>
  );
}
