/**
 * @module GsdGraph
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { Target, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from '@/lib/i18n';

interface GsdHistoryEntry {
  week_date: string;
  week_label: string;
  actual: number;
  target: number;
  variance: number;
  note: string | null;
}

interface GsdData {
  definition: {
    gsd_name: string;
    target_value: number;
    unit: string;
    frequency: string;
    gsd_formula: string | null;
  } | null;
  history: GsdHistoryEntry[];
  stats: {
    lastWeekActual: number | null;
    lastWeekTarget: number | null;
    lastWeekVariance: number | null;
    prevWeekActual: number | null;
    avgActual: number | null;
    totalWeeks: number;
  };
}

interface GsdGraphProps {
  employeeId: string | number;
  positionId?: number | null;
  canEdit?: boolean;
}

function VarianceBadge({ variance }: { variance: number | null }) {
  if (variance === null) return <span className="text-muted-foreground text-xs">—</span>;
  const positive = variance >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md",
      positive ? "bg-emerald-50 text-[var(--ep-green)]" : "bg-red-50 text-[var(--ep-red)]"
    )}>
      {positive
        ? <TrendingUp className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{variance.toFixed(1)}%
    </span>
  );
}

export function GsdGraph({ employeeId, canEdit = false }: GsdGraphProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ week_date: "", actual: "", note: "" });

  const { data, isLoading } = useQuery<GsdData>({
    queryKey: [`/api/hr/gsd/employees/${employeeId}/history`],
    enabled: !!employeeId,
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/hr/gsd/employees/${employeeId}/history?months=12`) as unknown as Response;
      if (!res.ok) throw new Error("GSD tarix yuklanmadi");
      return res.json() as Promise<GsdData>;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { week_date: string; actual: number; note?: string }) => {
      return apiRequest("POST", `/api/hr/gsd/employees/${employeeId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hr/gsd/employees/${employeeId}/history`] });
      toast({ title: "GSD natijasi saqlandi" });
      setAddOpen(false);
      setForm({ week_date: "", actual: "", note: "" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      toast({ title: "Xatolik", description: msg, variant: "destructive" });
    },
  });

  function handleSubmit() {
    const actual = parseFloat(form.actual);
    if (!form.week_date || isNaN(actual)) {
      toast({ title: "Hafta sanasi va natija kiritilishi kerak", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ week_date: form.week_date, actual, note: form.note || undefined });
  }

  const def = data?.definition;
  const stats = data?.stats;
  const history = data?.history ?? [];

  const chartData = (Array.isArray(history) ? history : []).map(h => ({
    name: h.week_label,
    actual: h.actual,
    target: h.target,
    variance: h.variance,
  }));

  const targetLine = def?.target_value ?? (history.length > 0 ? history[0].target : null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">
              GSD — {def?.gsd_name ?? "Asosiy Ko'rsatkich"}
            </CardTitle>
            {def?.unit && (
              <Badge variant="secondary" className="text-[10px]">{def.unit}</Badge>
            )}
            {def?.frequency && (
              <Badge variant="outline" className="text-[10px]">{def.frequency}</Badge>
            )}
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setAddOpen(!addOpen)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t("natijaKiritish")}
            </Button>
          )}
        </div>
        {def?.gsd_formula && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("formula")}<code className="bg-muted px-1 rounded">{def.gsd_formula}</code>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {addOpen && canEdit && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold">{t("haftalikNatijaKiritish")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gsd-week">{t("haftaSanasi")}</Label>
                <Input
                  id="gsd-week"
                  type="date"
                  value={form.week_date}
                  onChange={e => setForm(p => ({ ...p, week_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gsd-actual">Haqiqiy natija {def?.unit ? `(${def.unit})` : ""}</Label>
                <Input
                  id="gsd-actual"
                  type="number"
                  placeholder={`Maqsad: ${def?.target_value ?? "—"}`}
                  value={form.actual}
                  onChange={e => setForm(p => ({ ...p, actual: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="gsd-note">Izoh (ixtiyoriy)</Label>
                <Input
                  id="gsd-note"
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  placeholder={t("qoshimchaMalumot")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitMutation.isPending}>
                {t("Saqlash")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>{t("cancel")}</Button>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>GSD natijalari hali kiritilmagan</p>
            {def ? (
              <p className="text-xs mt-1">Maqsad: {def.target_value} {def.unit}</p>
            ) : (
              <p className="text-xs mt-1">{t("buLavozimUchunGsdTarifi")}</p>
            )}
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} ${def?.unit ?? ""}`.trim(),
                    name === "actual" ? "Haqiqiy" : "Maqsad",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(v: string) => v === "actual" ? "Haqiqiy" : "Maqsad"}
                />
                {targetLine !== null && (
                  <ReferenceLine y={targetLine} stroke="hsl(var(--primary))" strokeDasharray="6 3" strokeWidth={1.5} />
                )}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t("otganHafta")}</p>
                <p className="text-xl font-bold text-foreground">
                  {stats?.lastWeekActual !== null && stats?.lastWeekActual !== undefined
                    ? stats.lastWeekActual
                    : <Minus className="w-4 h-4 mx-auto text-muted-foreground" />}
                </p>
                {def?.unit && <p className="text-[10px] text-muted-foreground">{def.unit}</p>}
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t("Maqsad")}</p>
                <p className="text-xl font-bold text-foreground">
                  {stats?.lastWeekTarget !== null && stats?.lastWeekTarget !== undefined
                    ? stats.lastWeekTarget
                    : def?.target_value ?? "—"}
                </p>
                {def?.unit && <p className="text-[10px] text-muted-foreground">{def.unit}</p>}
              </div>
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t("ogish")}</p>
                <div className="mt-1 flex justify-center">
                  <VarianceBadge variance={stats?.lastWeekVariance ?? null} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">o'rtacha: {stats?.avgActual ?? "—"}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
