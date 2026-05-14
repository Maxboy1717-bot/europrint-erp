/** @module RecruiterKPIPageCards @description KPI summary card grid and the ConversionChain mini-component used inside channel analytics rows. */

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, TrendingUp, Clock, Target, Award, Percent } from "lucide-react";
import { CONVERSION_TARGET, fmt } from "./RecruiterKPIPageTypes";
import type { KPISummary } from "./RecruiterKPIPageTypes";

// ── ConversionChain ───────────────────────────────────────────────────────────

interface ConversionChainProps {
  applications: number;
  phone?: number;
  interview?: number;
  hired?: number;
}

/** Renders a compact "Ariza → Telefon → Suhbat  Conv%" inline badge row. */
export function ConversionChain({ applications, phone, interview, hired }: ConversionChainProps) {
  const stages = [
    { label: "Ariza",   value: applications,    target: null },
    { label: "Telefon", value: phone ?? null,   target: Math.round(applications * 0.5) },
    { label: "Suhbat",  value: interview ?? null, target: Math.round(applications * 0.1) },
  ];
  const convRate =
    applications > 0 && hired != null
      ? Math.round((hired / applications) * 100)
      : null;
  const convColor =
    convRate == null
      ? "text-muted-foreground"
      : convRate >= CONVERSION_TARGET
      ? "text-green-400"
      : convRate >= 30
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(Array.isArray(stages) ? stages : []).map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
            <span
              className={`text-xs font-bold ${
                s.value == null ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {s.value ?? "–"}
            </span>
          </div>
          {i < stages.length - 1 && (
            <span className="text-[10px] text-muted-foreground">→</span>
          )}
        </div>
      ))}
      {convRate !== null && (
        <div className="flex flex-col items-center ml-2">
          <span className="text-[9px] text-muted-foreground">Conv%</span>
          <span className={`text-xs font-bold ${convColor}`}>{convRate}%</span>
        </div>
      )}
    </div>
  );
}

// ── SummaryKPICards ───────────────────────────────────────────────────────────

interface SummaryKPICardsProps {
  summary: KPISummary;
}

/** Renders the top row of 6–7 KPI metric cards. */
export function SummaryKPICards({ summary: s }: SummaryKPICardsProps) {
  const metrics = [
    { label: "Jami nomzodlar",               value: fmt(s.total_candidates),                       icon: Users,      color: "text-[var(--ep-blue)]"    },
    { label: "Qabul qilinganlar",             value: fmt(s.hired),                                  icon: UserCheck,  color: "text-[var(--ep-green)]"   },
    { label: "Referral orqali",               value: fmt(s.via_referral),                           icon: Award,      color: "text-[var(--ep-purple)]"  },
    { label: "O'rtacha to'ldirish (ish kun)", value: fmt(s.avg_time_to_fill_working_days, " kun"),  icon: Clock,      color: "text-[var(--ep-primary)]"  },
    { label: "AI o'tish darajasi",            value: fmt(s.ai_pass_rate, "%"),                      icon: TrendingUp, color: "text-[var(--ep-green)]" },
    { label: "Taklif qabul darajasi",         value: fmt(s.offer_acceptance_rate, "%"),             icon: Percent,    color: "text-[var(--ep-blue)]"     },
    { label: "Ishga muvofiqlik sifati",       value: fmt(s.quality_of_hire, "%"),                   icon: Target,     color: "text-[var(--ep-blue)]"  },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {(Array.isArray(metrics) ? metrics : []).map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-4 text-center">
            <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
