/**
 * @module KpiScoreWeightsConfig
 * @description Config page for KPI score calculation weights (STKP vazn).
 * Route: /director/kpi-weights
 * Wraps GET+PATCH /api/director/dashboard/kpi-weights.
 * 3 rows: attendance / performance / tasks — umumiy 1.00 bo'lishi kerak.
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

interface KpiWeight {
  id: number;
  code: string;
  label_uz: string;
  weight: string | number;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function WeightRow({
  row,
  onSave,
}: {
  row: KpiWeight;
  onSave: (code: string, weight: number) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(Math.round(Number(row.weight) * 100)));
  const [busy, setBusy]       = useState(false);

  function startEdit() {
    setVal(String(Math.round(Number(row.weight) * 100)));
    setEditing(true);
  }

  async function handleSave() {
    const pct = parseFloat(val);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      toast({ title: "Vazn 1–100% oralig'ida bo'lishi kerak", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onSave(row.code, pct / 100);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  const pctDisplay = `${Math.round(Number(row.weight) * 100)}%`;

  return (
    <TableRow>
      <TableCell className="w-32 font-mono text-xs text-muted-foreground">{row.code}</TableCell>
      <TableCell className="w-48 font-medium">{row.label_uz}</TableCell>
      {editing ? (
        <TableCell className="w-32">
          <div className="flex items-center gap-1">
            <Input type="number" min="1" max="100" step="1" className="h-7 w-20 text-sm"
              value={val} onChange={(e) => setVal(e.target.value)} />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </TableCell>
      ) : (
        <TableCell className="w-32 tabular-nums text-center font-semibold text-primary">
          {pctDisplay}
        </TableCell>
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

export default function KpiScoreWeightsConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ items: KpiWeight[] }>({
    queryKey: ["/api/director/dashboard/kpi-weights"],
    queryFn: () => apiRequest<{ items: KpiWeight[] }>("GET", "/api/director/dashboard/kpi-weights"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, weight }: { code: string; weight: number }) =>
      apiRequest<KpiWeight>("PATCH", `/api/director/dashboard/kpi-weights/${code}`, { weight }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/director/dashboard/kpi-weights"] });
      toast({ title: "KPI vazn saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  async function handleSave(code: string, weight: number) {
    await updateMutation.mutateAsync({ code, weight });
  }

  const weights: KpiWeight[] = Array.isArray(data?.items) ? data.items : [];
  const total = weights.reduce((s, w) => s + Number(w.weight), 0);
  const totalPct = Math.round(total * 100);
  const isBalanced = totalPct === 100;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <BarChart2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">STKP Vazn Konfiguratsiyasi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xodim KPI ball formulasidagi har bir komponent vazni (%).
            Uchala vazn umumiy 100% bo'lishi kerak.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kod</TableHead>
              <TableHead className="w-48">Komponent</TableHead>
              <TableHead className="w-32 text-center">Vazn (%)</TableHead>
              <TableHead className="w-20 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : weights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Ma'lumot topilmadi
                </TableCell>
              </TableRow>
            ) : (
              weights.map((row) => (
                <WeightRow key={row.code} row={row} onSave={handleSave} />
              ))
            )}
            {/* Total row */}
            {weights.length > 0 && (
              <TableRow className="border-t-2 bg-muted/30">
                <TableCell colSpan={2} className="font-semibold text-sm">Jami</TableCell>
                <TableCell className={`text-center font-bold text-sm ${isBalanced ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {totalPct}%
                  {!isBalanced && <span className="ml-1 text-xs">(100% bo'lishi kerak)</span>}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        <strong>Davomat:</strong> xodimning ish joyiga kelish foizi.{" "}
        <strong>Samaradorlik:</strong> belgilangan vazifalarni bajarish sifati.{" "}
        <strong>Vazifalar:</strong> topshiriqlarni o'z vaqtida yakunlash.{" "}
        Jami 100% bo'lishi shart — aks holda KPI hisob-kitobi noto'g'ri chiqadi.
      </p>
    </div>
  );
}
