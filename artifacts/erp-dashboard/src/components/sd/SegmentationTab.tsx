import { SdSegmentationData } from "./sd-types";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, BarChart3, Target } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { fmtNum } from "./helpers";

export function SegmentationTab({ segmentation }: { segmentation: SdSegmentationData }) {
  if (!segmentation) return <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yuklanmadi</div>;

  const { abcScore, abcCategory, scoreBreakdown, recommendations, categoryLabel } = segmentation;
  const seg = abcCategory || segmentation.segment || "C";

  const catConf: Record<string, { gradient: string; text: string; border: string; label: string }> = {
    A: { gradient: "from-emerald-500 to-teal-500", text: "text-emerald-600", border: "border-emerald-200 dark:border-emerald-800", label: "VIP mijoz" },
    B: { gradient: "from-sky-500 to-blue-500", text: "text-sky-600", border: "border-sky-200 dark:border-sky-800", label: "Doimiy mijoz" },
    C: { gradient: "from-amber-500 to-orange-500", text: "text-amber-600", border: "border-amber-200 dark:border-amber-800", label: "Oddiy mijoz" },
    D: { gradient: "from-rose-500 to-red-500", text: "text-rose-600", border: "border-rose-200 dark:border-rose-800", label: "Xavfli mijoz" },
  };
  const conf = catConf[seg] || catConf.C;

  const radarData = scoreBreakdown ? [
    { subject: "Daromad", value: scoreBreakdown.revenueScore || 0 },
    { subject: "Chastota", value: scoreBreakdown.frequencyScore || 0 },
    { subject: "Faollik", value: scoreBreakdown.recencyScore || 0 },
    { subject: "To'lov", value: scoreBreakdown.paymentScore || 0 },
    { subject: "Vafodorlik", value: scoreBreakdown.loyaltyScore || 0 },
  ] : [];

  const score = fmtNum(abcScore);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score card */}
        <div className={`rounded-xl border-2 ${conf.border} bg-card overflow-hidden`}>
          <div className="p-6 text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${conf.gradient} shadow-lg mb-3`}>
              <span className="text-4xl font-black text-white">{seg}</span>
            </div>
            <p className="text-lg font-bold">{categoryLabel || conf.label}</p>
            <p className="text-sm text-muted-foreground mt-1">Ball: {score} / 100</p>
            <div className="mt-4 max-w-xs mx-auto">
              <Progress value={score} className="h-2.5 rounded-full" />
            </div>
          </div>
        </div>

        {/* Radar chart */}
        {radarData.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />Ball radar
              </h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {scoreBreakdown && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Ball tafsiloti</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: "Daromad", weight: "35%", val: scoreBreakdown.revenueScore || 0, color: "[&>div]:bg-emerald-500" },
              { label: "Chastota", weight: "25%", val: scoreBreakdown.frequencyScore || 0, color: "[&>div]:bg-sky-500" },
              { label: "Faollik", weight: "20%", val: scoreBreakdown.recencyScore || 0, color: "[&>div]:bg-violet-500" },
              { label: "To'lov", weight: "15%", val: scoreBreakdown.paymentScore || 0, color: "[&>div]:bg-amber-500" },
              { label: "Vafodorlik", weight: "5%", val: scoreBreakdown.loyaltyScore || 0, color: "[&>div]:bg-rose-500" },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label} <span className="text-[10px]">({item.weight})</span></span>
                  <span className="font-medium">{item.val}</span>
                </div>
                <Progress value={item.val} className={`h-1.5 rounded-full ${item.color}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {(recommendations || []).length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />Tavsiyalar
            </h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2.5">
              {recommendations.map((r: string, i: number) => (
                <li key={`r-${i}`} className="flex items-start gap-2.5 text-sm">
                  <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
