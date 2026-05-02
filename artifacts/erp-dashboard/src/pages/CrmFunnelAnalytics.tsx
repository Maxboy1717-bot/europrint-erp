import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, Users, Trophy, Loader2, Gauge } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

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
          <Trophy className="w-4 h-4 text-yellow-500" /> {t('winRate')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{data.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.won}</p>
            <p className="text-xs text-muted-foreground">{t('won')}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-500">{data.lost}</p>
            <p className="text-xs text-muted-foreground">{t('lost')}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs"><span className="text-green-600">Won</span><span>{data.winRate.toFixed(1)}%</span></div>
          <Progress value={data.winRate} className="h-2" />
          <div className="flex justify-between text-xs"><span className="text-red-500">Lost</span><span>{data.lossRate.toFixed(1)}%</span></div>
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
          <Gauge className="w-4 h-4 text-blue-500" /> {t('velocity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-blue-600">{velocityFmt}</p>
          <p className="text-xs text-muted-foreground">{t('velocityPerDay')}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
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
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
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
          <Target className="w-4 h-4 text-blue-500" /> {t('stagesByCount')}
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
                    {stage.is_won  && <Badge className="text-xs bg-green-100 text-green-800">Won</Badge>}
                    {stage.is_lost && <Badge className="text-xs bg-red-100 text-red-800">Lost</Badge>}
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
  const chartData = (data ?? []).map((s, i) => ({
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
  const { data, isLoading, isError, refetch } = useQuery<FunnelData>({
    queryKey: ["crm-funnel"],
    queryFn:  () => apiRequest("GET", "/api/crm/funnel"),
    retry: 1,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (isError)   return <ErrorState onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">{t('funnelAnalytics')}</h1>
          <p className="text-muted-foreground text-sm">{t('funnelDesc')}</p>
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
                  <Users className="w-4 h-4 text-purple-500" /> {t('pipelineOverview')}
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
