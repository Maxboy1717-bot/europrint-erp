/**
 * @module CrmFunnelAnalytics
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, Users, Trophy, Gauge, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EPErrorState, EPLoader } from "@/components/ep";

interface WinRateResult {
  won: number; lost: number; total: number; winRate: number; lossRate: number;
}
interface FunnelConversionResult {
  stages: { name: string; entered: number; movedToNext: number; conversionRate: number }[];
  overallConversion: number;
}
interface VelocityResult {
  velocity: number;
  opportunities: number;
  winRate: number;
  avgDealSize: number;
  avgSalesCycleDays: number;
}
interface RawStage { stage_name: string; count: number; is_won: boolean; is_lost: boolean }
interface FunnelData {
  winRate: WinRateResult;
  funnel: FunnelConversionResult;
  velocity: VelocityResult;
  rawStages: RawStage[];
}

const STAGE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

function WinRateCard({ data, t }: { data: WinRateResult; t: (k: string) => string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[var(--ep-yellow)]" /> {t('winRate')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--ep-green)]">{data.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{t('winRate1')}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.won}</p>
            <p className="text-xs text-muted-foreground">{t('won')}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--ep-red)]">{data.lost}</p>
            <p className="text-xs text-muted-foreground">{t('lost')}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs"><span className="text-[var(--ep-green)]">{t("won")}</span><span>{data.winRate.toFixed(1)}%</span></div>
          <Progress value={data.winRate} className="h-2" />
          <div className="flex justify-between text-xs"><span className="text-[var(--ep-red)]">{t("lost")}</span><span>{data.lossRate.toFixed(1)}%</span></div>
          <Progress value={data.lossRate} className="h-2 [&>div]:bg-red-400" />
        </div>
      </CardContent>
    </Card>
  );
}

function VelocityCard({ data, t }: { data: VelocityResult; t: (k: string) => string }) {
  const velocityFmt = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(data.velocity);
  const dealFmt     = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(data.avgDealSize);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[var(--ep-blue)]" /> {t('velocity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-[var(--ep-blue)]">{velocityFmt}</p>
          <p className="text-xs text-muted-foreground">{t('velocityPerDay')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="text-center rounded bg-slate-50 p-2">
            <p className="text-muted-foreground">{t('pipelineOpportunities')}</p>
            <p className="font-bold text-base">{data.opportunities}</p>
          </div>
          <div className="text-center rounded bg-slate-50 p-2">
            <p className="text-muted-foreground">{t('avgDealSize')}</p>
            <p className="font-bold text-base">{dealFmt}</p>
          </div>
          <div className="text-center rounded bg-slate-50 p-2">
            <p className="text-muted-foreground">{t('avgCycleDays')}</p>
            <p className="font-bold text-base">{data.avgSalesCycleDays.toFixed(1)}</p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">{t('winRateGauge')}</p>
          <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(data.winRate, 100)}%` }}
            />
            <span className="absolute right-2 top-0 text-xs text-white font-medium leading-4">
              {data.winRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStages({ data, t }: { data: RawStage[]; t: (k: string) => string }) {
  const sorted = [...(data ?? [])].sort((a, b) => b.count - a.count);
  const maxCount = sorted[0]?.count ?? 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-[var(--ep-blue)]" /> {t('stagesByCount')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!sorted.length ? (
          <div className="text-muted-foreground text-sm text-center py-8">{t('noData')}</div>
        ) : (
          <div className="space-y-3">
            {sorted.map((stage, i) => (
              <div key={`${stage.stage_name}-${i}`} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{stage.stage_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{stage.count}</span>
                    {stage.is_won  && <Badge className="text-xs bg-green-100 text-green-800">{t("won")}</Badge>}
                    {stage.is_lost && <Badge className="text-xs bg-red-100 text-red-800">{t("lost")}</Badge>}
                  </div>
                </div>
                <Progress value={(stage.count / maxCount) * 100} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarStageChart({ data, t }: { data: RawStage[]; t: (k: string) => string }) {
  const chartData = (Array.isArray(data) ? data : []).map((s, i) => ({
    name: s.stage_name.length > 12 ? s.stage_name.slice(0, 12) + "…" : s.stage_name,
    count: s.count,
    fill: STAGE_COLORS[i % STAGE_COLORS.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name={t('deals')} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function CrmFunnelAnalytics() {
  const { t } = useTranslation('crm');
  const { toast } = useToast();
  const queryClientHook = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [dealForm, setDealForm] = useState({ dealId: "", outcome: "", closeDate: "" });
  const [stageOpen, setStageOpen] = useState(false);
  const [stageForm, setStageForm] = useState({ dealId: "", stage: "" });

  const { data, isLoading, isError, error, refetch } = useQuery<FunnelData>({
    queryKey: ["crm-funnel"],
    queryFn:  () => apiRequest("GET", "/api/crm/funnel"),
    retry: 1,
  });

  const updateStageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/crm/deals/${stageForm.dealId}/stage`, { stage: stageForm.stage });
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ["crm-funnel"] });
      toast({ title: "Muvaffaqiyat", description: "Bitim bosqichi yangilandi" });
      setStageForm({ dealId: "", stage: "" });
      setStageOpen(false);
    },
    onError: () => {
      toast({ title: "Xato", description: "Bosqich yangilanmadi", variant: "destructive" });
    },
  });

  const closeDealMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/crm/deals/close", {
        dealId: dealForm.dealId,
        outcome: dealForm.outcome,
        closeDate: dealForm.closeDate,
      });
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ["crm-funnel"] });
      toast({ title: "Muvaffaqiyat", description: "Bitim muvaffaqiyatli yopildi" });
      setDealForm({ dealId: "", outcome: "", closeDate: "" });
      setCloseOpen(false);
    },
    onError: () => {
      toast({ title: "Xato", description: "Amal bajarilmadi", variant: "destructive" });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><EPLoader className="w-8 h-8 text-[var(--ep-blue)]" /></div>;
  if (isError)   return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-[var(--ep-blue)]" />
          <div>
            <h1 className="text-2xl font-bold">{t('funnelAnalytics')}</h1>
            <p className="text-muted-foreground text-sm">{t('funnelDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <Dialog open={stageOpen} onOpenChange={setStageOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-update-stage">
              <Target className="h-4 w-4 mr-2" />
              {t("bosqichniYangilash")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("bitimBosqichiniYangilash")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="stage-deal-id">{t("bitimId")}</Label>
                <Input
                  id="stage-deal-id"
                  value={stageForm.dealId}
                  onChange={(e) => setStageForm((f) => ({ ...f, dealId: e.target.value }))}
                  placeholder={t('deal001')}
                  data-testid="input-stage-deal-id"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stage-name">{t("yangiBosqich")}</Label>
                {data?.rawStages && data.rawStages.length > 0 ? (
                  <Select value={stageForm.stage} onValueChange={(v) => setStageForm((f) => ({ ...f, stage: v }))}>
                    <SelectTrigger id="stage-name" data-testid="select-stage-name" className="h-9">
                      <SelectValue placeholder={t("bosqichTanlang")} />
                    </SelectTrigger>
                    <SelectContent>
                      {data.rawStages.map((s) => (
                        <SelectItem key={s.stage_name} value={s.stage_name}>{s.stage_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="stage-name"
                    value={stageForm.stage}
                    onChange={(e) => setStageForm((f) => ({ ...f, stage: e.target.value }))}
                    placeholder={t("bosqichNomi")}
                    data-testid="input-stage-name"
                  />
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => updateStageMutation.mutate()}
                disabled={updateStageMutation.isPending || !stageForm.dealId || !stageForm.stage}
                data-testid="button-submit-stage"
              >
                {updateStageMutation.isPending ? "Saqlanmoqda..." : "Yangilash"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-close-deal">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("bitimniYopish")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("bitimniYopish")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="deal-id">{t("bitimId")}</Label>
                <Input
                  id="deal-id"
                  value={dealForm.dealId}
                  onChange={(e) => setDealForm((f) => ({ ...f, dealId: e.target.value }))}
                  placeholder={t('deal001')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deal-outcome">{t("natija")}</Label>
                <Select
                  value={dealForm.outcome}
                  onValueChange={(v) => setDealForm((f) => ({ ...f, outcome: v }))}
                >
                  <SelectTrigger id="deal-outcome" className="h-9">
                    <SelectValue placeholder={t("natijaniTanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">{t("yutildiWon")}</SelectItem>
                    <SelectItem value="lost">{t("yoQotildiLost")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="deal-closeDate">{t("yopishSanasi")}</Label>
                <Input
                  id="deal-closeDate"
                  type="date"
                  value={dealForm.closeDate}
                  onChange={(e) => setDealForm((f) => ({ ...f, closeDate: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => closeDealMutation.mutate()}
                disabled={closeDealMutation.isPending || !dealForm.dealId || !dealForm.outcome}
              >
                {closeDealMutation.isPending ? "Saqlanmoqda..." : "Yopish"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WinRateCard data={data.winRate} t={t} />
            <VelocityCard data={data.velocity} t={t} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FunnelStages data={data.rawStages} t={t} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--ep-purple)]" /> {t('pipelineOverview')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarStageChart data={data.rawStages} t={t} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
