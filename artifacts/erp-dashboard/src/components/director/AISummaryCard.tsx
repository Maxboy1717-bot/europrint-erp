/**
 * @module AISummaryCard
 * @description React UI component.
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles } from "lucide-react";
import type { AISummary } from "@/components/director/types";
import { useTranslation } from '@/lib/i18n';

interface AISummaryCardProps {
  ai: AISummary | undefined;
  aiLoad: boolean;
}

export function AISummaryCard({ ai, aiLoad }: AISummaryCardProps) {
  const { t } = useTranslation("common");
  const [aiExpanded, setAiExpanded] = useState(false);

  return (
    <div className="rounded-xl border from-primary/5 to-primary/10 border-primary/20 p-5" data-testid="card-ai-summary">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("aiKunlikXulosa")}</p>
              {ai?.aiGenerated && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">GPT-4o</Badge>
              )}
              {ai?.generatedAt && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(ai.generatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            {aiLoad ? (
              <div className="space-y-2"><Skeleton className="h-4 w-full rounded-lg" /><Skeleton className="h-4 w-3/4 rounded-lg" /></div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{ai?.summary ?? "Ma'lumot yuklanmoqda..."}</p>
            )}
          </div>
        </div>
        {ai?.stats && aiExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mt-3">
            {([
              { label: "Buyurtmalar", val: ai.stats.totalOrders },
              { label: "Bajarildi", val: ai.stats.completedOrders },
              { label: "Kechikkan", val: ai.stats.overdueOrders },
              { label: "OEE", val: ai.stats.oee ? `${ai.stats.oee}%` : "—" },
              { label: "Davomad", val: `${ai.stats.attendance?.present ?? 0}/${ai.stats.attendance?.total ?? 0}` },
              { label: "Davomad %", val: `${ai.stats.attendance?.rate ?? 0}%` },
            ]).map((s, i) => (
              <div key={`k-${i}`} className="rounded-lg bg-background/60 border border-primary/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Button
        size="sm" variant="outline"
        onClick={() => setAiExpanded(!aiExpanded)}
        className="mt-3 border-primary/20 text-primary"
        data-testid="button-ai-expand"
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        {aiExpanded ? "Yopish" : "Batafsil ko'rsatish"}
      </Button>
    </div>
  );
}
