/**
 * CardAiInsightsCard — item #104: aiInsights was hardcoded []. Now shows real
 * karta-AI agregat (ckp_fact_values, AI-daily-report orqali to'ldiriladi):
 * chegaradan past achievement_pct'li kartalar, eng-yomonidan boshlab.
 */
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import type { CardAiInsight } from "./types";

export function CardAiInsightsCard({ items, isLoading }: { items?: CardAiInsight[]; isLoading?: boolean }) {
  const { t } = useTranslation("common");
  const list = Array.isArray(items) ? items : [];

  return (
    <Card className="p-4" data-testid="card-ai-insights">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[var(--ep-blue)]" />
        <h3 className="font-bold text-sm">{t("kartaAiAgregatSarlavha")}</h3>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <EPLoader className="mr-2" /> {t("Yuklanmoqda...")}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">{t("kartaAiAgregatBosh")}</div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {list.map((c) => (
            <div key={c.cardId} className="rounded-lg p-3 border-l-4 border-amber-500 bg-amber-50/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{c.positionName}</span>
                <span className="text-xs font-bold text-[var(--ep-red)]">{c.avgAchievementPct}%</span>
              </div>
              {c.ckp && <p className="text-xs text-muted-foreground mt-0.5">{c.ckp}</p>}
              {c.latestAiNote && <p className="text-xs text-slate-700 mt-1">{c.latestAiNote}</p>}
              <div className="text-[10px] text-muted-foreground mt-1">
                {c.factCount} {t("hisobot")} · {c.aiFactCount} AI · {c.lastFactDate ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
