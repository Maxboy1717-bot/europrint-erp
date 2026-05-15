/**
 * MarketingDashboardPanels.tsx
 * AI assistant, NPS and Churn Risk panel components for MarketingDashboard.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Send, Star, AlertTriangle } from "lucide-react";
import type { NpsStats, ChurnData } from "./MarketingDashboardTypes";
import { RISK_COLORS, RISK_LABELS } from "./MarketingDashboardTypes";
import { NpsSubmitDialog, AiChurnSignal } from "./MarketingDashboardDialogs";
import { useTranslation } from '@/lib/i18n';

// ─── AI Marketing Assistant ───────────────────────────────────────────────────
export function AiAssistantSection() {
  const { t } = useTranslation("common");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const aiMutation = useMutation({
    mutationFn: (question: string) => apiRequest("POST", "/api/marketing/ai-assistant", { question }),
    onSuccess: (data: unknown) => setAiAnswer((data as { answer: string }).answer),
  });

  return (
    <div className="bg-card rounded-xl p-6 mb-6" data-testid="card-ai-assistant">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("aiMarketingYordamchisi")}</h3>
      </div>
      <div className="flex gap-2 mb-4">
        <Input placeholder={t("marketingBoyichaSavolBering")} value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && aiQuestion.trim()) { aiMutation.mutate(aiQuestion); setAiQuestion(""); } }}
          data-testid="input-ai-question" className="flex-1" />
        <Button size="icon" onClick={() => { aiMutation.mutate(aiQuestion); setAiQuestion(""); }}
          disabled={!aiQuestion.trim() || aiMutation.isPending} data-testid="button-ai-send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {aiMutation.isPending && (
        <div className="bg-muted/60 rounded-lg p-4">
          <Skeleton className="h-4 mb-2 rounded-lg" /><Skeleton className="h-4 w-3/4 rounded-lg" />
        </div>
      )}
      {aiAnswer && !aiMutation.isPending && (
        <div className="bg-muted/60 rounded-lg p-4" data-testid="text-ai-answer">
          <div className="flex items-start gap-2">
            <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground whitespace-pre-wrap">{aiAnswer}</p>
          </div>
        </div>
      )}
      {!aiAnswer && !aiMutation.isPending && (
        <div className="flex gap-2 flex-wrap">
          {(["Qaysi kanal eng samarali?", "Konversiya oshirish uchun nima qilish kerak?"]).map(q => (
            <Button key={q} variant="outline" size="sm" className="text-xs"
              onClick={() => { aiMutation.mutate(q); }} data-testid="button-ai-suggestion">{q}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NPS panel ────────────────────────────────────────────────────────────────
export function NpsPanel({ npsStats }: { npsStats: NpsStats | undefined }) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-xl p-6 overflow-hidden" data-testid="card-nps">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-[var(--ep-yellow)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("npsMijozMamnuniyati")}</h3>
        </div>
        <NpsSubmitDialog />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-muted/40 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("ortachaBall")}</p>
          <p className="text-2xl font-bold text-foreground" data-testid="text-nps-avg">
            {npsStats?.avgScore ?? "—"} <span className="text-sm font-normal text-muted-foreground">/ 10</span>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("k30KunlikOrtacha")}</p>
          <p className="text-2xl font-bold text-foreground" data-testid="text-nps-monthly">
            {npsStats?.monthlyAvg ?? "—"} <span className="text-sm font-normal text-muted-foreground">/ 10</span>
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Jami {npsStats?.totalResponses ?? 0} ta baho, so'nggi 30 kunda {npsStats?.recentResponses ?? 0} ta
      </p>
      <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded-md">
        NPS ≤6 (Detractor) → CRM task 24 soat ichida · ≤8 (Passive) → CRM task 72 soat
      </div>
      {npsStats?.lastComments && npsStats.lastComments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("songgiIzohlar")}</p>
          {(Array.isArray(npsStats.lastComments) ? npsStats.lastComments : []).map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 text-sm"
              data-testid={`nps-comment-${c.id}`}>
              <Badge variant="outline" className={`shrink-0 ${parseInt(String(c.score)) >= 9 ? "border-green-300 text-[var(--ep-green)]" : parseInt(String(c.score)) >= 7 ? "border-yellow-300 text-[var(--ep-yellow)]" : "border-red-300 text-[var(--ep-red)]"}`}>
                {c.score}/10
              </Badge>
              <span className="text-foreground truncate">{c.comment}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("haliNpsBaholariYoq")}</p>
      )}
    </div>
  );
}

// ─── Churn Risk panel ─────────────────────────────────────────────────────────
export function ChurnRiskPanel({ churnData }: { churnData: ChurnData | undefined }) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-xl p-6 overflow-hidden" data-testid="card-churn-risk">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Churn Xavfi (Multi-factor)</h3>
      </div>
      {churnData?.riskCounts && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {(["critical", "high", "medium", "low"] as const).map((level) => (
            <div key={level} className={`text-center p-2 rounded-md ${RISK_COLORS[level]}`} data-testid={`churn-risk-${level}`}>
              <div className="text-lg font-bold">{churnData.riskCounts[level]}</div>
              <div className="text-xs">{RISK_LABELS[level]}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-churn-count">
          {churnData?.total ?? 0}
        </p>
        <p className="text-sm text-muted-foreground">ta mijoz 30+ kun buyurtma bermagan</p>
      </div>
      <AiChurnSignal />
      {churnData?.customers && churnData.customers.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase">{t("engYuqoriXavf")}</p>
          {(Array.isArray(churnData.customers) ? churnData.customers : []).slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 text-sm"
              data-testid={`churn-customer-${c.id}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{c.name}</p>
                  <Badge className={`text-xs ${RISK_COLORS[c.riskLevel]} shrink-0 no-default-hover-elevate`}>{c.churnScore}</Badge>
                </div>
                {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                {c.npsAvg !== null && <p className="text-xs text-muted-foreground">NPS: {c.npsAvg}/10</p>}
              </div>
              <Badge className={`${RISK_COLORS[c.riskLevel]} rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate shrink-0`}>
                {c.daysSinceOrder ? `${c.daysSinceOrder} kun` : "Hech qachon"}
              </Badge>
            </div>
          ))}
        </div>
      )}
      {(!churnData?.customers || churnData.customers.length === 0) && (
        <p className="text-sm text-[var(--ep-green)] font-medium mt-4">{t("barchaMijozlarFaol")}</p>
      )}
    </div>
  );
}
