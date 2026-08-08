/**
 * @module CompanyStateThresholdConfig
 * @description Config page for company-state threshold bands and metric weights.
 * Route: /director/company-state-config
 * Wraps GET+PATCH /api/company-state/thresholds.
 * 5 metrics × 5 levels = 25 configurable rows.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Threshold {
  id: number;
  metric_key: string;
  level_code: string;
  min_value: string | null;
  max_value: string | null;
  weight: string | number;
}

const LEVEL_LABELS: Record<string, { labelKey: string; color: string }> = {
  OSISH:   { labelKey: "cscLevelOsish",   color: "text-green-600" },
  NORMAL:  { labelKey: "cscLevelNormal",  color: "text-blue-600" },
  EHTIYOT: { labelKey: "cscLevelEhtiyot", color: "text-yellow-600" },
  XAVF:    { labelKey: "cscLevelXavf",    color: "text-orange-600" },
  INQIROZ: { labelKey: "cscLevelInqiroz", color: "text-red-600" },
};

const METRIC_LABEL_KEYS: Record<string, string> = {
  cash_flow:       "cscMetricCashFlow",
  orders:          "cscMetricOrders",
  production_plan: "cscMetricProductionPlan",
  quality:         "cscMetricQuality",
  hr:              "cscMetricHr",
};

function fmt(v: string | number | null): string {
  if (v == null) return "—";
  const n = Number(v);
  return isNaN(n) ? "—" : n.toLocaleString("uz-UZ");
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function ThresholdRow({
  row,
  onSave,
}: {
  row: Threshold;
  onSave: (id: number, patch: { min_value?: number; max_value?: number; weight?: number }) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const { t } = useTranslation("director");
  const [editing, setEditing] = useState(false);
  const [minVal, setMinVal]   = useState(row.min_value ?? "");
  const [maxVal, setMaxVal]   = useState(row.max_value ?? "");
  const [weight, setWeight]   = useState(String(row.weight));
  const [busy, setBusy]       = useState(false);

  function startEdit() {
    setMinVal(row.min_value ?? "");
    setMaxVal(row.max_value ?? "");
    setWeight(String(row.weight));
    setEditing(true);
  }

  async function handleSave() {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0 || w > 1) {
      toast({ title: t("cscWeightRange"), variant: "destructive" });
      return;
    }
    setBusy(true);
    const patch: { min_value?: number; max_value?: number; weight?: number } = { weight: w };
    const mn = parseFloat(minVal);
    const mx = parseFloat(maxVal);
    if (minVal !== "" && !isNaN(mn)) patch.min_value = mn;
    if (maxVal !== "" && !isNaN(mx)) patch.max_value = mx;
    try {
      await onSave(row.id, patch);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  const levelInfo = LEVEL_LABELS[row.level_code];
  const levelLabel = levelInfo ? t(levelInfo.labelKey) : row.level_code;
  const levelColor = levelInfo?.color ?? "";
  const metricKey = METRIC_LABEL_KEYS[row.metric_key];

  return (
    <TableRow>
      <TableCell className="text-sm font-medium w-40">
        {metricKey ? t(metricKey) : row.metric_key}
      </TableCell>
      <TableCell className={`w-28 text-sm font-semibold ${levelColor}`}>
        {levelLabel}
      </TableCell>
      {editing ? (
        <>
          <TableCell className="w-32">
            <Input type="number" className="h-7 w-28 text-sm" value={minVal}
              placeholder={t("cscNullPlaceholder")} onChange={(e) => setMinVal(e.target.value)} />
          </TableCell>
          <TableCell className="w-32">
            <Input type="number" className="h-7 w-28 text-sm" value={maxVal}
              placeholder={t("cscNullPlaceholder")} onChange={(e) => setMaxVal(e.target.value)} />
          </TableCell>
          <TableCell className="w-24">
            <Input type="number" step="0.01" min="0.01" max="1"
              className="h-7 w-20 text-sm" value={weight}
              onChange={(e) => setWeight(e.target.value)} />
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="w-32 tabular-nums text-right">{fmt(row.min_value)}</TableCell>
          <TableCell className="w-32 tabular-nums text-right">{fmt(row.max_value)}</TableCell>
          <TableCell className="w-24 tabular-nums text-right">
            {parseFloat(String(row.weight)).toFixed(3)}
          </TableCell>
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

export default function CompanyStateThresholdConfig() {
  const { toast } = useToast();
  const { t } = useTranslation("director");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Threshold[]>({
    queryKey: ["/api/company-state/thresholds"],
    queryFn: () => apiRequest<Threshold[]>("GET", "/api/company-state/thresholds"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: {
      id: number;
      patch: { min_value?: number; max_value?: number; weight?: number };
    }) => apiRequest<Threshold>("PATCH", `/api/company-state/thresholds/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-state/thresholds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-state/current"] });
      toast({ title: t("cscThresholdSaved") });
    },
    onError: () => toast({ title: t("cscSaveError"), variant: "destructive" }),
  });

  const thresholds: Threshold[] = Array.isArray(data) ? data : [];

  async function handleSave(
    id: number,
    patch: { min_value?: number; max_value?: number; weight?: number },
  ) {
    await updateMutation.mutateAsync({ id, patch });
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">{t("cscThresholdTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("cscThresholdDesc")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">{t("cscMetric")}</TableHead>
              <TableHead className="w-28">{t("cscLevel")}</TableHead>
              <TableHead className="w-32 text-right">{t("cscMinValue")}</TableHead>
              <TableHead className="w-32 text-right">{t("cscMaxValue")}</TableHead>
              <TableHead className="w-24 text-right">{t("cscWeight")}</TableHead>
              <TableHead className="w-20 text-right">{t("cscAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : thresholds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t("cscNoThresholds")}
                </TableCell>
              </TableRow>
            ) : (
              thresholds.map((row) => (
                <ThresholdRow key={row.id} row={row} onSave={handleSave} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        {t("cscFooter")}
      </p>
    </div>
  );
}
