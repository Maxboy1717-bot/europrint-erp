/**
 * @module CrmRfmClusters
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { Users, Target, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

import { EPLoader } from "@/components/ep";
type SegmentLabel = "Champions" | "Loyal" | "At-Risk" | "New Customer" | "Hibernating" | "Lost";

interface ClusterPoint {
  customerId: string;
  clusterId: number;
  rNorm: number;
  fNorm: number;
  mNorm: number;
  segmentLabel: SegmentLabel;
}

const SEGMENT_CONFIG: Record<SegmentLabel, { color: string; desc: string }> = {
  "Champions":    { color: "#10b981", desc: "Eng yaxshi, faol, yuqori xarid" },
  "Loyal":        { color: "#3b82f6", desc: "Doimiy, ishonchli mijozlar" },
  "At-Risk":      { color: "#f59e0b", desc: "Yo'qolish xavfi bor, eski faol" },
  "New Customer": { color: "#8b5cf6", desc: "Yaqinda qo'shilgan" },
  "Hibernating":  { color: "#6b7280", desc: "Bir muddatdan beri faolsiz" },
  "Lost":         { color: "#ef4444", desc: "Yo'qotilgan, uzoq vaqt yo'q" },
};

function genSampleData(n = 80) {
  return Array.from({ length: n }, (_, i) => ({
    customerId: `C${String(i + 1).padStart(3, "0")}`,
    rNorm: Math.random(),
    fNorm: Math.random(),
    mNorm: Math.random(),
  }));
}

async function runKMeans(points: object[]): Promise<ClusterPoint[]> {
  return apiRequest("POST", "/api/crm/rfm/cluster", { points });
}

const CustomDot = (props: {
  cx?: number; cy?: number; fill?: string; r?: number; payload?: ClusterPoint;
}) => {
  const { cx = 0, cy = 0, fill = "#ccc", r = 5 } = props;
  return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.8} stroke="#fff" strokeWidth={1} />;
};

export default function CrmRfmClusters() {
  const { t } = useTranslation('crm');
  const { toast } = useToast();
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);
  const [sampleData] = useState(genSampleData);

  const mutation = useMutation({
    mutationFn: () => runKMeans(sampleData),
    onSuccess: (data) => setClusters(data),
    onError: (e: Error) => toast({ title: t('error'), description: e.message, variant: "destructive" }),
  });

  const grouped = clusters.reduce<Record<SegmentLabel, ClusterPoint[]>>((acc, c) => {
    const seg = c.segmentLabel;
    if (!acc[seg]) acc[seg] = [];
    acc[seg].push(c);
    return acc;
  }, {} as Record<SegmentLabel, ClusterPoint[]>);

  const scatterData = (Object.entries(grouped) as [SegmentLabel, ClusterPoint[]][]).map(([seg, pts]) => ({
    label: seg,
    color: SEGMENT_CONFIG[seg]?.color ?? "#ccc",
    data: (Array.isArray(pts) ? pts : []).map(p => ({ x: p.rNorm, y: p.fNorm, z: p.mNorm, id: p.customerId })),
  }));

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-[var(--ep-purple)]" />
          <div>
            <h1 className="text-2xl font-bold">{t('rfmClusters')}</h1>
            <p className="text-muted-foreground text-sm">{t('rfmDesc')}</p>
          </div>
        </div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <EPLoader className="w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {clusters.length ? t('recluster') : t('cluster')}
        </Button>
      </div>

      {clusters.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <Target className="w-5 h-5 mr-2" />
            {t('rfmSampleReady', { count: String(sampleData.length) })}
          </CardContent>
        </Card>
      )}

      {clusters.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.entries(SEGMENT_CONFIG) as [SegmentLabel, { color: string; desc: string }][]).map(([seg, cfg]) => {
              const count = grouped[seg]?.length ?? 0;
              return (
                <Card key={seg} className="p-3 border-l-4" style={{ borderLeftColor: cfg.color }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{seg}</span>
                    <Badge style={{ backgroundColor: cfg.color }} className="text-white text-xs">{count}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('rfmScatterTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name={t('recencyLabel')} type="number" domain={[0, 1]} tickCount={6} tick={{ fontSize: 11 }}
                    label={{ value: t('recencyAxis'), position: "insideBottom", offset: -10, fontSize: 11 }} />
                  <YAxis dataKey="y" name={t('frequencyLabel')} type="number" domain={[0, 1]} tickCount={6} tick={{ fontSize: 11 }}
                    label={{ value: t('frequencyAxis'), angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <ZAxis dataKey="z" range={[30, 200]} name={t('monetaryLabel')} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload as { x: number; y: number; z: number; id: string } | undefined;
                    if (!d) return null;
                    return (
                      <div className="bg-white border rounded shadow p-2 text-xs">
                        <p className="font-semibold">{d.id}</p>
                        <p>{t('recencyLabel')}: {d.x.toFixed(2)}</p>
                        <p>{t('frequencyLabel')}: {d.y.toFixed(2)}</p>
                        <p>{t('monetaryLabel')}: {d.z.toFixed(2)}</p>
                      </div>
                    );
                  }} />
                  <Legend />
                  {(Array.isArray(scatterData) ? scatterData : []).map(seg => (
                    <Scatter key={seg.label} name={seg.label} data={seg.data} fill={seg.color} shape={<CustomDot />} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
