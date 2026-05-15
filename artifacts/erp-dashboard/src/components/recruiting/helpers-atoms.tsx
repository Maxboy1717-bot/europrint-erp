/**
 * @module recruiting/helpers-atoms
 * @description Small atoms (DeadlineBadge, StatCard, ChannelDots, ScoreBar,
 *   ChannelStatusPanel, HCMethodologyBanner, VacancyMarketBadge,
 *   ProbationCompleteButton). Split out of `helpers.tsx`.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle, ChevronDown, ChevronUp, BookOpen, ArrowRight, Radio,
} from "lucide-react";
import { MarketAnalysisBadge } from "@/components/hr/LaborMarketSheet";
import { useTranslation } from "@/lib/i18n";

import {
  CHANNEL_COLORS,
  HC_PHASES,
  STAGES,
  getPhaseForStage,
} from "./helpers-constants";

export function DeadlineBadge({
  daysRemaining,
  deadlinePercent,
}: {
  daysRemaining: number | null | undefined;
  deadlinePercent: number | null | undefined;
}) {
  if (daysRemaining === null || daysRemaining === undefined) return null;
  const pct = (deadlinePercent ?? 0) / 100;
  const color = pct < 0.5
    ? "bg-green-500/15 text-green-400 border-green-500/40"
    : pct < 0.8
      ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
      : "bg-red-500/15 text-red-400 border-red-500/40";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      <Clock className="w-2.5 h-2.5" />
      {daysRemaining}k qoldi
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 flex items-center gap-3 min-w-[130px]">
      <div className={`p-2 rounded-lg ${color ?? "bg-primary/10"}`}>
        <Icon className={`w-5 h-5 ${color ? "text-white" : "text-primary"}`} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function HCMethodologyBanner() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((p) => !p)}
        className="mb-2 gap-2 border-purple-500/30 text-purple-400 hover:bg-[var(--ep-purple)]/90/10"
        data-testid="button-toggle-hc-methodology"
      >
        <BookOpen className="w-4 h-4" />
        HR Capital 7-Bosqich Metodologiyasi
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </Button>
      {open && (
        <div className="bg-muted/60 rounded-xl p-4 border border-purple-500/20">
          <p className="text-xs text-muted-foreground mb-3">
            {t("rekrutmentJarayoniHrCapitalMetodologiyasining")}
          </p>
          <div className="flex flex-wrap gap-2">
            {HC_PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${phase.color}/20 border border-current/20`}>
                  <div className={`w-5 h-5 rounded-full ${phase.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                    {phase.num}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{phase.label}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight max-w-[120px]">{phase.desc}</div>
                  </div>
                </div>
                {i < HC_PHASES.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STAGES.filter((s) => s.key !== "REJECTED").map((stage) => {
              const phase = getPhaseForStage(stage.key);
              return (
                <span
                  key={stage.key}
                  className="inline-flex items-center gap-1 text-[10px] bg-muted/40 rounded px-1.5 py-0.5 border border-border/40"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${stage.accent}`} />
                  {stage.label}
                  {phase && <span className="text-muted-foreground">→ {phase.label}</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChannelDots({
  channels,
}: {
  channels: Record<string, { active: boolean }> | null | undefined;
}) {
  if (!channels) return null;
  const active = Object.entries(channels).filter(([, v]) => v.active);
  if (!active.length) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Radio className="w-3 h-3 text-muted-foreground" />
      {active.map(([key]) => (
        <div key={key} className={`w-2 h-2 rounded-full ${CHANNEL_COLORS[key] ?? "bg-gray-400"}`} title={key} />
      ))}
    </div>
  );
}

export function ScoreBar({ label, score }: { label: string; score: number | null }) {
  if (score === null || score === undefined) return null;
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function VacancyMarketBadge({ vacancyId }: { vacancyId: number }) {
  const { data } = useQuery<{ data: { employer_market?: { market_heat?: string } } | null }>({
    queryKey: [`/api/hr/recruitment/vacancies/${vacancyId}/market-analysis`],
    staleTime: 120_000,
  });
  const heat = data?.data?.employer_market?.market_heat as "hot" | "medium" | "cold" | undefined;
  if (!heat) return null;
  return (
    <div className="mt-1">
      <MarketAnalysisBadge heat={heat} />
    </div>
  );
}

export function ProbationCompleteButton({
  entryId,
  onComplete,
  isPending,
}: {
  entryId: number;
  onComplete: () => void;
  isPending: boolean;
}) {
  const { data } = useQuery<{ data: { checklist_data: Record<string, { done: boolean }> } }>({
    queryKey: [`/api/hr/recruitment/pipeline/${entryId}/checklist`],
    staleTime: 30_000,
  });
  const day90Done = data?.data?.checklist_data?.day_90_review?.done ?? false;
  return (
    <Button
      data-testid={`button-sinov-complete-${entryId}`}
      size="sm"
      variant="default"
      className="h-7 text-xs flex-1 bg-lime-600 hover:bg-[var(--ep-green)]/90 disabled:opacity-40"
      disabled={isPending || !day90Done}
      title={!day90Done ? "90-kun baholash to'ldirilishi shart" : undefined}
      onClick={onComplete}
    >
      <CheckCircle className="w-3 h-3 mr-0.5" />
      {day90Done ? "Sinov Yakunlandi" : "90-kun baholash kerak"}
    </Button>
  );
}
