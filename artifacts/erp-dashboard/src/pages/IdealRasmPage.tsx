/**
 * @module IdealRasmPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getAuthHeaders } from "@/lib/queryClient";
import {
  Target, Edit3, Save, X, RefreshCw, TrendingUp, TrendingDown,
  BarChart3, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";

interface IdealRasmTarget {
  id: number;
  targetName: string;
  targetKey: string;
  targetValue: string;
  unit: string;
  horizonYears: number;
  description?: string;
  actualValue: number;
  achievementPct: number;
}

interface IdealRasmResponse {
  targets: IdealRasmTarget[];
  generatedAt: string;
}

function formatValue(val: number, unit: string): string {
  if (unit === "UZS") {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return String(Math.round(val));
  }
  if (unit === "%") return `${val.toFixed(1)}%`;
  return `${val.toLocaleString()} ${unit}`;
}

function pctColor(pct: number): string {
  if (pct >= 100) return "text-[var(--ep-green)]";
  if (pct >= 80) return "text-[var(--ep-blue)]";
  if (pct >= 60) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-red)]";
}

function pctBg(pct: number): string {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 80) return "bg-blue-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function PctBadge({ pct }: { pct: number }) {
  const trend = pct >= 80 ? "up" : pct >= 60 ? "stable" : "down";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md",
      pct >= 80 ? "bg-emerald-50 text-[var(--ep-green)]" : pct >= 60 ? "bg-amber-50 text-[var(--ep-yellow)]" : "bg-red-50 text-[var(--ep-red)]"
    )}>
      {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {pct}%
    </span>
  );
}

export default function IdealRasmPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const isDirector = ["director", "super_admin"].includes(user?.role ?? "");

  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery<IdealRasmResponse>({
    queryKey: ["/api/ideal-rasm"],
    queryFn: async () => {
      const res = await apiRequest('GET', "/api/ideal-rasm");
      if (!res.ok) throw new Error("Yuklab bo'lmadi");
      return res.json();
    },
    refetchInterval: 300_000,
  });

  const targets = data?.targets ?? [];

  const radarData = (Array.isArray(targets) ? targets : []).map((t) => ({
    metric: t.targetName.replace("Haftalik ", "").replace(" Soni", "").replace(" Ulushi", ""),
    Haqiqat: Math.min(t.achievementPct, 150),
    Maqsad: 100,
  }));

  function startEdit() {
    const vals: Record<string, string> = {};
    (Array.isArray(targets) ? targets : []).forEach((t) => { vals[t.targetKey] = t.targetValue; });
    setEditValues(vals);
    setEditMode(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(editValues).map(([targetKey, targetValue]) => ({
        targetKey,
        targetValue,
      }));
      const res = await apiRequest('PUT', "/api/ideal-rasm", { targets: payload });
      if (!res.ok) throw new Error("Yangilashda xatolik");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Maqsadlar yangilandi" });
      qc.invalidateQueries({ queryKey: ["/api/ideal-rasm"] });
      setEditMode(false);
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex-1 overflow-auto bg-background p-5 space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            {t("idealRasm")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("kompaniyaning3YillikMaqsadHolati")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("refresh")}
          </Button>
          {isDirector && !editMode && (
            <Button size="sm" onClick={startEdit}>
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> {t("maqsadlarniTahrirlash")}
            </Button>
          )}
          {editMode && (
            <>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Horizon Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          <BarChart3 className="w-3 h-3 mr-1" /> {t("k3YillikMaqsadOraligi")}
        </Badge>
        {data?.generatedAt && (
          <span className="text-xs text-muted-foreground">
            Yangilangan: {new Date(data.generatedAt).toLocaleTimeString("uz-UZ")}
          </span>
        )}
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {([0, 1, 2, 3, 4]).map((i) => (
            <Skeleton key={`k-${i}`} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(targets) ? targets : []).map((target) => (
            <Card key={target.targetKey} className="relative overflow-hidden">
              <div
                className={cn("absolute top-0 left-0 w-1 h-full", pctBg(target.achievementPct))}
              />
              <CardHeader className="pb-2 pl-5">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {target.targetName}
                  </CardTitle>
                  <PctBadge pct={target.achievementPct} />
                </div>
              </CardHeader>
              <CardContent className="pl-5 space-y-3">
                {editMode ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Maqsad qiymat ({target.unit})</label>
                    <Input
                      type="number"
                      value={editValues[target.targetKey] ?? target.targetValue}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [target.targetKey]: e.target.value }))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("haqiqat")}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {formatValue(target.actualValue, target.unit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("Maqsad")}</p>
                        <p className="text-lg font-bold text-muted-foreground mt-0.5">
                          {formatValue(parseFloat(target.targetValue), target.unit)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("progress5")}</span>
                        <span className={cn("font-semibold", pctColor(target.achievementPct))}>
                          {target.achievementPct}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", pctBg(target.achievementPct))}
                          style={{ width: `${Math.min(target.achievementPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {target.description && (
                      <p className="text-[10px] text-muted-foreground">{target.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      Muddat: {target.horizonYears} yil
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Radar Chart */}
      {!isLoading && targets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t("idealVsHaqiqatRadarTahlil")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Radar
                    name="Maqsad"
                    dataKey="Maqsad"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                    strokeDasharray="4 2"
                  />
                  <Radar
                    name="Haqiqat"
                    dataKey="Haqiqat"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val: number, name: string) => [`${val}%`, name]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground inline-block" />
                Maqsad (100%)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <span className="w-4 h-0.5 bg-primary inline-block" />
                {t("haqiqat")}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Summary */}
      {!isLoading && targets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("umumiyBaholash")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
              {([
                { label: "Maqsadlar", value: targets.length, sub: "ta" },
                { label: "≥80% Bajarilgan", value: (Array.isArray(targets) ? targets : []).filter((t) => t.achievementPct >= 80).length, sub: "ta", color: "text-[var(--ep-green)]" },
                { label: "60-80% Oralig'i", value: (Array.isArray(targets) ? targets : []).filter((t) => t.achievementPct >= 60 && t.achievementPct < 80).length, sub: "ta", color: "text-[var(--ep-yellow)]" },
                { label: "<60% Past", value: (Array.isArray(targets) ? targets : []).filter((t) => t.achievementPct < 60).length, sub: "ta", color: "text-[var(--ep-red)]" },
              ]).map((item, i) => (
                <div key={`k-${i}`} className="text-center rounded-xl bg-muted/30 p-4">
                  <p className={cn("text-2xl font-bold", item.color ?? "text-foreground")}>
                    {item.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
