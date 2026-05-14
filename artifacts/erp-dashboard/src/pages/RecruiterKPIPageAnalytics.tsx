/** @module RecruiterKPIPageAnalytics @description Worker-type pie chart section and channel-conversion analytics table for the Recruiter KPI page. */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Radio } from "lucide-react";
import { WORKER_TYPE_META } from "@/lib/workerType";
import type { WorkerType } from "@/lib/workerType";
import { ConversionChain } from "./RecruiterKPIPageCards";
import { CONVERSION_TARGET, CHANNEL_META, WORKER_TYPE_PIE_COLORS } from "./RecruiterKPIPageTypes";
import type { ChannelAnalyticsRow, WorkerTypeStatsRow } from "./RecruiterKPIPageTypes";
import { useTranslation } from '@/lib/i18n';

// ── WorkerTypeSection ─────────────────────────────────────────────────────────

interface WorkerTypeSectionProps {
  workerTypeRows: WorkerTypeStatsRow[];
}

export function WorkerTypeSection({ workerTypeRows }: WorkerTypeSectionProps) {
  const { t } = useTranslation("common");
  if (workerTypeRows.length === 0) return null;

  const WORKER_TYPES: WorkerType[] = ["FLAGMAN", "PROTSESSNIK", "TRABLDAYKER"];
  const total = (Array.isArray(workerTypeRows) ? workerTypeRows : []).reduce(
    (a, r) => a + parseInt(r.count || "0"),
    0,
  );
  const pieData = WORKER_TYPES.map((wt, i) => {
    const row = (Array.isArray(workerTypeRows) ? workerTypeRows : []).find(r => r.worker_type === wt);
    return {
      name:  WORKER_TYPE_META[wt].emoji + " " + WORKER_TYPE_META[wt].label,
      value: parseInt(row?.count || "0"),
      color: WORKER_TYPE_PIE_COLORS[i],
      meta:  WORKER_TYPE_META[wt],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> {t("xodimTurlariBoyichaStatistika")}
          <Badge variant="outline" className="text-[10px] ml-2">{t("hrCapital9")}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ""}
                labelLine={false}
              >
                {(Array.isArray(pieData) ? pieData : []).map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(val: number) => [`${val} nomzod`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-3 flex-1">
            {(Array.isArray(pieData) ? pieData : []).map(entry => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div
                  key={entry.meta.label}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${entry.meta.bg} ${entry.meta.border}`}
                >
                  <span className="text-2xl">{entry.meta.emoji}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${entry.meta.color}`}>{entry.meta.label}</div>
                    <div className="text-[10px] text-muted-foreground">{entry.meta.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xl font-bold ${entry.meta.color}`}>{entry.value}</div>
                    <div className="text-[10px] text-muted-foreground">{pct}%</div>
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground mt-1">
              Jami: {total} nomzod klassifikatsiyasi
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── ChannelAnalyticsSection ───────────────────────────────────────────────────

interface ChannelAnalyticsSectionProps {
  channelRows: ChannelAnalyticsRow[];
}

export function ChannelAnalyticsSection({ channelRows }: ChannelAnalyticsSectionProps) {
  const allChannelKeys = [
    ...new Set([
      ...(Array.isArray(channelRows) ? channelRows : []).map(r => r.ch_key),
      "REFERRAL",
      "GAZETA",
    ]),
  ];

  const rowsWithDefaults: ChannelAnalyticsRow[] = (
    Array.isArray(allChannelKeys) ? allChannelKeys : []
  ).map(key => {
    const found = (Array.isArray(channelRows) ? channelRows : []).find(r => r.ch_key === key);
    return (
      found ?? {
        ch_key:            key,
        vacancy_count:     "0",
        total_views:       "0",
        total_applications: "0",
        conversion_rate:   "0",
      }
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" /> {t("jalbQilishKanallariBoyichaSamaradorlik")}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            Maqsad: ≥{CONVERSION_TARGET}% konversiya
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 60% rule visual header */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {t("k60KonversiyaQoidasiArizaTelefon")}
            </p>
            <div className="flex items-center gap-3">
              {([
                { label: "Arizalar",       pct: 100, target: "10x" },
                { label: "Telefon suhbat", pct: 50,  target: "5x"  },
                { label: "Suhbat",         pct: 10,  target: "1x"  },
              ]).map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-muted-foreground">{step.label}</span>
                    <div className="w-12 h-2 bg-primary/10 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${step.pct}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-primary mt-0.5">{step.target}</span>
                  </div>
                  {i < 2 && <span className="text-muted-foreground text-sm">→</span>}
                </div>
              ))}
              <div className="ml-4 text-xs text-muted-foreground">
                {t("maqsad1")}<span className="font-bold text-primary">{CONVERSION_TARGET}%</span> konversiya
              </div>
            </div>
          </div>

          {/* Per-channel table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">{t("kanal")}</th>
                  <th className="text-right pb-2 font-medium">{t("vakansiyalar")}</th>
                  <th className="text-right pb-2 font-medium">{t("korishlar")}</th>
                  <th className="text-left pb-2 pl-4 font-medium">{t("konversiyaZanjiri")}</th>
                  <th className="text-right pb-2 font-medium">{t("status28")}</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(rowsWithDefaults) ? rowsWithDefaults : []).map(row => {
                  const meta      = CHANNEL_META[row.ch_key];
                  const apps      = Number(row.total_applications ?? 0);
                  const phone     = row.phone_screening_count != null ? Number(row.phone_screening_count) : undefined;
                  const interview = row.interview_count   != null ? Number(row.interview_count)   : undefined;
                  const hired     = row.hired_count       != null ? Number(row.hired_count)       : undefined;

                  const convNum =
                    apps > 0 && hired != null
                      ? Math.round((hired / apps) * 100)
                      : parseFloat(row.conversion_rate ?? "0");

                  const isGood   = convNum >= CONVERSION_TARGET;
                  const isMedium = !isGood && convNum >= 30;

                  const statusColor =
                    apps === 0
                      ? "bg-muted/40 text-muted-foreground border-border/40"
                      : isGood
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : isMedium
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30";

                  const statusLabel =
                    apps === 0 ? "Ma'lumot yo'q" : isGood ? "Yaxshi" : isMedium ? "O'rta" : "Past";

                  return (
                    <tr key={row.ch_key} className="border-b border-border/50">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta?.color ?? "bg-gray-400"}`} />
                          <span className="font-medium">{meta?.label ?? row.ch_key}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 text-muted-foreground">{row.vacancy_count}</td>
                      <td className="text-right py-2">{Number(row.total_views).toLocaleString()}</td>
                      <td className="py-2 pl-4">
                        <ConversionChain
                          applications={apps}
                          phone={phone}
                          interview={interview}
                          hired={hired}
                        />
                      </td>
                      <td className="text-right py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
