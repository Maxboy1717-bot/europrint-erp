/**
 * @module QcParametersConfig
 * @description Config page for QC parameters (min/max/target values per category).
 * Route: /qc/parameters-config
 * Wraps GET /api/qc/parameters/grouped + PATCH /api/qc/parameters/:id.
 * Also exposes POST /api/qc/seed-parameters to restore defaults.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Pencil, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface QcParam {
  id: number;
  name: string;
  category: string;
  unit: string | null;
  minValue: string | number | null;
  maxValue: string | number | null;
  targetValue: string | number | null;
  isActive: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  printing:  "Bosma",
  color:     "Rang",
  material:  "Material",
  finishing: "Finishlash",
  cutting:   "Kesish",
  physical:  "Fizikaviy",
  paper:     "Qog'oz",
  general:   "Umumiy",
};

function fmtNum(v: string | number | null): string {
  if (v == null) return "—";
  const n = Number(v);
  return isNaN(n) ? "—" : n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function ParamRow({
  row,
  onSave,
}: {
  row: QcParam;
  onSave: (id: number, patch: { min_value?: number; max_value?: number; target_value?: number }) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [minVal, setMinVal]   = useState(row.minValue != null ? String(Number(row.minValue)) : "");
  const [maxVal, setMaxVal]   = useState(row.maxValue != null ? String(Number(row.maxValue)) : "");
  const [target, setTarget]   = useState(row.targetValue != null ? String(Number(row.targetValue)) : "");
  const [busy, setBusy]       = useState(false);

  function startEdit() {
    setMinVal(row.minValue != null ? String(Number(row.minValue)) : "");
    setMaxVal(row.maxValue != null ? String(Number(row.maxValue)) : "");
    setTarget(row.targetValue != null ? String(Number(row.targetValue)) : "");
    setEditing(true);
  }

  async function handleSave() {
    const mn = parseFloat(minVal);
    const mx = parseFloat(maxVal);
    const tg = parseFloat(target);
    if (minVal !== "" && isNaN(mn)) {
      toast({ title: "Min qiymat son bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (maxVal !== "" && isNaN(mx)) {
      toast({ title: "Max qiymat son bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (target !== "" && isNaN(tg)) {
      toast({ title: "Maqsad son bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (minVal !== "" && maxVal !== "" && !isNaN(mn) && !isNaN(mx) && mn > mx) {
      toast({ title: "Min qiymat max'dan kichik bo'lishi kerak", variant: "destructive" });
      return;
    }
    const patch: { min_value?: number; max_value?: number; target_value?: number } = {};
    if (minVal !== "" && !isNaN(mn)) patch.min_value = mn;
    if (maxVal !== "" && !isNaN(mx)) patch.max_value = mx;
    if (target !== "" && !isNaN(tg)) patch.target_value = tg;
    setBusy(true);
    try {
      await onSave(row.id, patch);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-sm">{row.name}</TableCell>
      <TableCell className="text-xs text-muted-foreground w-20">{row.unit ?? "—"}</TableCell>
      {editing ? (
        <>
          <TableCell className="w-28">
            <Input type="number" className="h-7 w-24 text-sm" value={minVal}
              placeholder="min" onChange={(e) => setMinVal(e.target.value)} />
          </TableCell>
          <TableCell className="w-28">
            <Input type="number" className="h-7 w-24 text-sm" value={target}
              placeholder="maqsad" onChange={(e) => setTarget(e.target.value)} />
          </TableCell>
          <TableCell className="w-28">
            <Input type="number" className="h-7 w-24 text-sm" value={maxVal}
              placeholder="max" onChange={(e) => setMaxVal(e.target.value)} />
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="w-28 tabular-nums text-right text-sm">{fmtNum(row.minValue)}</TableCell>
          <TableCell className="w-28 tabular-nums text-right text-sm font-semibold">{fmtNum(row.targetValue)}</TableCell>
          <TableCell className="w-28 tabular-nums text-right text-sm">{fmtNum(row.maxValue)}</TableCell>
        </>
      )}
      <TableCell className="w-20 text-right">
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

export default function QcParametersConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Record<string, QcParam[]>>({
    queryKey: ["/api/qc/parameters/grouped"],
    queryFn: () => apiRequest<Record<string, QcParam[]>>("GET", "/api/qc/parameters/grouped"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: {
      id: number;
      patch: { min_value?: number; max_value?: number; target_value?: number };
    }) => apiRequest<QcParam>("PATCH", `/api/qc/parameters/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/paper"] });
      toast({ title: "Parametr saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest<{ seeded: number }>("POST", "/api/qc/seed-parameters"),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      toast({ title: `${(res as { seeded?: number }).seeded ?? 0} ta standart parametr yuklandi` });
    },
    onError: () => toast({ title: "Yuklash xatoligi", variant: "destructive" }),
  });

  async function handleSave(
    id: number,
    patch: { min_value?: number; max_value?: number; target_value?: number },
  ) {
    await updateMutation.mutateAsync({ id, patch });
  }

  const grouped = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const categories = Object.keys(grouped);
  const totalCount = categories.reduce((s, k) => s + (Array.isArray(grouped[k]) ? grouped[k].length : 0), 0);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-base">QC Parametrlar Konfiguratsiyasi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sifat nazorati uchun min/maqsad/max chegaralar. {totalCount} ta parametr {categories.length} ta kategoriyada.
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${seedMutation.isPending ? "animate-spin" : ""}`} />
          Standart yuklash
        </Button>
      </div>

      {/* Grouped tables */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm mb-3">Parametrlar topilmadi.</p>
          <Button variant="outline" size="sm" onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Standart parametrlarni yuklash
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const params = Array.isArray(grouped[cat]) ? grouped[cat] : [];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{params.length} ta parametr</span>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parametr nomi</TableHead>
                        <TableHead className="w-20">Birlik</TableHead>
                        <TableHead className="w-28 text-right">Min</TableHead>
                        <TableHead className="w-28 text-right">Maqsad</TableHead>
                        <TableHead className="w-28 text-right">Max</TableHead>
                        <TableHead className="w-20 text-right">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {params.map((row) => (
                        <ParamRow key={row.id} row={row} onSave={handleSave} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground max-w-2xl">
        Min va Max — sifat chegaralari (bu doiradan tashqari = brak). Maqsad — ideal qiymat.
        "Standart yuklash" tugmasi bazaviy QC parametrlarini tiklaydi (mavjudlarni o'zgartirmaydi).
      </p>
    </div>
  );
}
