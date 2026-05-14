/**
 * @module SegmentationTab
 * @description React UI component.
 */

import { SdSegmentationData, SdInternalIntelligenceData } from "./sd-types";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, BarChart3, Target, MapPin, Clock, Brain, Star, Lightbulb, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { fmtNum, fmtDate } from "./helpers";
import { useTranslation } from '@/lib/i18n';

interface JourneyData {
  stage: string;
  stageLabel: string;
  firstOrderDate?: string;
  lastOrderDate?: string;
  daysSinceFirstOrder?: number;
  daysSinceLastOrder?: number;
}

export function SegmentationTab({ segmentation, journey, internalIntelligence }: {
  segmentation: SdSegmentationData;
  journey?: JourneyData;
  internalIntelligence?: SdInternalIntelligenceData;
}) {
  const { t } = useTranslation("common");
  if (!segmentation) return <div className="text-sm text-muted-foreground py-8 text-center">{t("malumotYuklanmadi")}</div>;

  const { abcScore, abcCategory, scoreBreakdown, recommendations, categoryLabel } = segmentation;
  const seg = abcCategory || segmentation.segment || "C";

  const catConf: Record<string, { gradient: string; text: string; border: string; label: string }> = {
    A: { gradient: "", text: "text-[var(--ep-green)]", border: "border-emerald-200 dark:border-emerald-800", label: "VIP mijoz" },
    B: { gradient: "", text: "text-[var(--ep-blue)]", border: "border-sky-200 dark:border-sky-800", label: "Doimiy mijoz" },
    C: { gradient: "", text: "text-[var(--ep-yellow)]", border: "border-amber-200 dark:border-amber-800", label: "Oddiy mijoz" },
    D: { gradient: "", text: "text-[var(--ep-red)]", border: "border-rose-200 dark:border-rose-800", label: "Xavfli mijoz" },
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
  const rfm = segmentation.rfm as { recency: number; frequency: number; monetary: number } | undefined;

  return (
    <div className="space-y-4">
      {/* RFM mini-badges */}
      {rfm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Recency", desc: "So'nggi faollik", val: rfm.recency, color: "" },
            { label: "Frequency", desc: "Buyurtma chastotasi", val: rfm.frequency, color: "" },
            { label: "Monetary", desc: "Daromad hajmi", val: rfm.monetary, color: "" },
          ].map(item => (
            <div key={item.label} className="rounded-xl border bg-card p-3 text-center">
              <div className={`w-10 h-10 rounded-xl ${item.color} mx-auto flex items-center justify-center mb-2`}>
                <span className="text-lg font-black text-white">{item.val}</span>
              </div>
              <p className="text-xs font-bold">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              <div className="mt-1.5">
                <Progress value={item.val * 20} className="h-1 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score card */}
        <div className={`rounded-xl border-2 ${conf.border} bg-card overflow-hidden`}>
          <div className="p-6 text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-xl ${conf.gradient} shadow-lg mb-3`}>
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
                <BarChart3 className="h-4 w-4 text-muted-foreground" />{t("ballRadar")}
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
            <h3 className="text-sm font-semibold">{t("ballTafsiloti")}</h3>
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
              <Target className="h-4 w-4 text-muted-foreground" />{t("tavsiyalar1")}
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

      {/* Internal Intelligence (Layer 7) */}
      {internalIntelligence && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />Ichki razvedka (Layer 7)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Relationship quality */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("munosabatSifati")}</span>
              <Badge className={
                internalIntelligence.relationshipQuality === 'excellent' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                : internalIntelligence.relationshipQuality === 'good'    ? "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
                : internalIntelligence.relationshipQuality === 'difficult'? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200"
                : "bg-muted text-muted-foreground"
              } variant="outline">{internalIntelligence.relationshipLabel}</Badge>
            </div>
            {/* Last interaction */}
            {internalIntelligence.lastInteraction && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{t("songgiMuloqot")}</span>
                <span className="font-medium">{internalIntelligence.lastInteraction.type}</span>
                <span className="text-muted-foreground text-xs">{fmtDate(String(internalIntelligence.lastInteraction.date ?? ""))}</span>
                {internalIntelligence.lastInteraction.by && (
                  <span className="text-xs text-muted-foreground">({String(internalIntelligence.lastInteraction.by)})</span>
                )}
              </div>
            )}
            {/* Key insights */}
            {(internalIntelligence.keyInsights || []).filter(Boolean).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5" />{t("asosiyXulosalar")}</p>
                {internalIntelligence.keyInsights.filter(Boolean).map((insight, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--ep-green)] shrink-0" />
                    <span>{String(insight)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Next actions */}
            {(internalIntelligence.nextActions || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Target className="h-3.5 w-3.5" />{t("keyingiAmallar")}</p>
                {internalIntelligence.nextActions.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm rounded-lg bg-muted/40 px-2.5 py-1.5">
                    <Star className="h-3.5 w-3.5 text-[var(--ep-yellow)] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span>{String(a.action ?? "")}</span>
                      {a.date && <span className="text-xs text-muted-foreground ml-2">{fmtDate(String(a.date))}</span>}
                    </div>
                    {a.by && <span className="text-xs text-muted-foreground shrink-0">{String(a.by)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journey stage */}
      {journey && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />Mijoz yo'li (Journey)
            </h3>
          </div>
          <div className="p-4">
            {/* Journey stages visual */}
            {(() => {
              const stages = ["prospect", "new", "growing", "stable", "at_risk", "lost"] as const;
              const stageLabels: Record<string, string> = {
                prospect: "Potensial", new: "Yangi", growing: "O'sish", stable: "Barqaror", at_risk: "Xavf ostida", lost: "Yo'qolgan",
              };
              const stageColors: Record<string, string> = {
                prospect: "bg-violet-500", new: "bg-sky-500", growing: "bg-emerald-500",
                stable: "bg-teal-500", at_risk: "bg-amber-500", lost: "bg-rose-500",
              };
              const currentIdx = stages.indexOf(journey.stage as typeof stages[number]);
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {stages.map((s, i) => (
                      <div key={s} className="flex items-center flex-1 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0
                          ${i === currentIdx ? stageColors[s] : i < currentIdx ? "bg-muted-foreground/40" : "bg-muted/60"}`}>
                          {i + 1}
                        </div>
                        {i < stages.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-0.5 ${i < currentIdx ? "bg-muted-foreground/40" : "bg-muted/60"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full text-white ${stageColors[journey.stage] || "bg-muted"}`}>
                      <MapPin className="h-3.5 w-3.5" />
                      {journey.stageLabel || stageLabels[journey.stage] || journey.stage}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {journey.daysSinceFirstOrder !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{t("birinchiBuyurtmadan")}</span>
                        <span className="font-medium">{journey.daysSinceFirstOrder} kun</span>
                      </div>
                    )}
                    {journey.daysSinceLastOrder !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{t("songgiBuyurtmadan")}</span>
                        <span className="font-medium">{journey.daysSinceLastOrder} kun</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
