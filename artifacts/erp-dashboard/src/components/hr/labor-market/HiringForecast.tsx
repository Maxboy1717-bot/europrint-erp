/**
 * @module HiringForecast
 * @description React UI component.
 */

import { Clock } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export interface EmployerMarket {
  competitors: Array<{
    company: string;
    salary_min: number | "";
    salary_max: number | "";
    benefits: string;
    channels: string;
  }>;
  market_heat: "hot" | "medium" | "cold";
}

export interface CandidateMarket {
  candidate_count: number | "";
  salary_expectation_min: number | "";
  salary_expectation_max: number | "";
  avg_skill_level: "junior" | "middle" | "senior" | "";
  avg_response_days: number | "";
}

export interface HistoricalStats {
  avg_fill_days: number | null;
  avg_candidates_screened: number | null;
  sample_size: number;
}

export function HiringForecast({
  em,
  cm,
  historical,
}: {
  em: EmployerMarket;
  cm: CandidateMarket;
  historical: HistoricalStats | null;
}) {
  const { t } = useTranslation("common");
  const candidateCount = Number(cm.candidate_count) || 0;
  const avgResponseDays = Number(cm.avg_response_days) || 0;

  const historicalBase = historical?.avg_fill_days ?? null;
  let baseDays = historicalBase !== null ? Math.round(historicalBase) : 15;

  if (em.market_heat === "hot") baseDays = Math.round(baseDays * 1.25);
  if (em.market_heat === "cold") baseDays = Math.round(baseDays * 0.85);
  if (candidateCount > 0 && candidateCount < 10) baseDays += 7;
  if (candidateCount > 50) baseDays = Math.max(5, baseDays - 3);
  if (avgResponseDays > 5) baseDays += Math.round(avgResponseDays - 5);

  const minDays = Math.max(3, baseDays - 5);
  const maxDays = baseDays + 10;

  const color = maxDays <= 15 ? "text-green-400" : maxDays <= 30 ? "text-amber-400" : "text-red-400";
  const hasHistory = historical !== null && historical.sample_size > 0;

  return (
    <div className="space-y-2">
      <div className="bg-muted/60 rounded-lg p-3 flex items-center gap-3 border border-border/40">
        <Clock className={`w-5 h-5 ${color} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${color}`}>
            {minDays}–{maxDays} ish kuni
          </div>
          <div className="text-xs text-muted-foreground">
            Bashoratli yollash muddati
            {hasHistory ? " (tarixiy ma'lumot asosida)" : " (bozor holati asosida)"}
          </div>
        </div>
      </div>
      {hasHistory && (
        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-3 px-1">
          <span>
            {t("tarix1")}<b>{historical?.sample_size}</b> {t("taShungaOxshashVakansiya")}
          </span>
          {historical?.avg_fill_days !== null && (
            <span>
              {t("ortachaToldirish")}<b>{historical?.avg_fill_days} kun</b>
            </span>
          )}
          {historical?.avg_candidates_screened !== null && (
            <span>
              {t("ortachaNomzodlar")}<b>{historical?.avg_candidates_screened}</b>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
