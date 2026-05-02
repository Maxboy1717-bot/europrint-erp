import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Users, UserCheck, TrendingUp, Clock, Target, Briefcase, BarChart3, Award, Percent, AlertTriangle, Zap,
  Printer, Radio,
} from "lucide-react";
import { WORKER_TYPE_META } from "@/lib/workerType";
import type { WorkerType } from "@/lib/workerType";

interface KPISummary {
  total_candidates: string;
  hired: string;
  rejected: string;
  via_referral: string;
  avg_time_to_fill_working_days: string | null;
  ai_pass_rate: string | null;
  offer_acceptance_rate: string | null;
  quality_of_hire: string | null;
}

interface RecruiterRow {
  recruiter_id: number;
  recruiter_name: string;
  total: string;
  hired: string;
  rejected: string;
  hire_rate: string;
  avg_time_to_fill_working_days: string | null;
  offer_acceptance_rate: string | null;
  monthly_closed: string;
  quality_of_hire: string | null;
  ai_pass_rate: string | null;
}

interface StageRow {
  stage: string;
  count: string;
}

interface VacancyTypeRow {
  vacancy_type: string;
  applications: string;
  hired: string;
  conversion_rate: string;
}

interface MonthlyTrendRow {
  month: string;
  monthly_hired: string;
  monthly_rejected: string;
  avg_fill_days: string | null;
}

interface KPIData {
  period: { from: string; to: string };
  summary: KPISummary;
  byRecruiter: RecruiterRow[];
  byStage: StageRow[];
  byVacancyType: VacancyTypeRow[];
  monthlyTrend: MonthlyTrendRow[];
}

interface UrgentVacancy {
  id: number;
  title: string;
  vacancy_type: string;
  department_name: string | null;
  candidate_count: string;
  deadline_working_days: number | null;
  working_days_elapsed: string | null;
}

interface ChannelAnalyticsRow {
  ch_key: string;
  vacancy_count: string;
  total_views: string;
  total_applications: string;
  conversion_rate: string;
  phone_screening_count?: string;
  interview_count?: string;
  hired_count?: string;
}

interface WorkerTypeStatsRow {
  worker_type: string;
  count: string;
}

const CONVERSION_TARGET = 60;

function ConversionChain({
  applications,
  phone,
  interview,
  hired,
}: {
  applications: number;
  phone?: number;
  interview?: number;
  hired?: number;
}) {
  const stages = [
    { label: "Ariza",   value: applications,                 target: null },
    { label: "Telefon", value: phone ?? null,                target: Math.round(applications * 0.5) },
    { label: "Suhbat",  value: interview ?? null,            target: Math.round(applications * 0.1) },
  ];
  const convRate = applications > 0 && hired != null ? Math.round((hired / applications) * 100) : null;
  const convColor = convRate == null ? "text-muted-foreground" : convRate >= CONVERSION_TARGET ? "text-green-400" : convRate >= 30 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(Array.isArray(stages) ? stages : []).map((s, i) => (
        <div key={s.label} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
            <span className={`text-xs font-bold ${s.value == null ? "text-muted-foreground" : "text-foreground"}`}>
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

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  HH_UZ:     { label: "hh.uz",                  color: "bg-red-500"     },
  UZJOB:     { label: "UZjobs.uz",               color: "bg-blue-500"    },
  MYJOB:     { label: "MyJob.uz",                color: "bg-green-500"   },
  TELEGRAM:  { label: "Telegram",                color: "bg-sky-500"     },
  INSTAGRAM: { label: "Instagram",               color: "bg-pink-500"    },
  LINKEDIN:  { label: "LinkedIn",                color: "bg-indigo-500"  },
  FACEBOOK:  { label: "Facebook",                color: "bg-blue-700"    },
  REFERRAL:  { label: "Referral (xodim tavsiyasi)", color: "bg-purple-500" },
  GAZETA:    { label: "Gazetalar / Matbuot",     color: "bg-amber-600"   },
};

const STAGE_LABELS: Record<string, string> = {
  NEW:                  "Yangi ariza",
  QUESTIONNAIRE_SENT:   "Anketa yuborildi",
  PHONE_SCREENING:      "Telefon suhbati",
  INTERVIEW_SCHEDULED:  "Intervyu rejalashtirildi",
  INTERVIEWED:          "Intervyu o'tkazildi",
  TEST_SENT:            "Test yuborildi",
  REFERENCES:           "Tavsiyalar tekshiruvi",
  OFFER_SENT:           "Taklif yuborildi",
  HIRED:                "Qabul qilindi",
  PROBATION:            "Sinov davri",
  SINOV_COMPLETE:       "Sinov tugadi",
  REJECTED:             "Rad etildi",
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standart",
  INTERNAL: "Ichki",
  COMPLEX: "Murakkab",
  TOP_MANAGEMENT: "Top Menejment",
};

const TYPE_COLORS: Record<string, string> = {
  STANDARD: "bg-blue-100 text-blue-700",
  INTERNAL: "bg-purple-100 text-purple-700",
  COMPLEX: "bg-orange-100 text-orange-700",
  TOP_MANAGEMENT: "bg-red-100 text-red-700",
};

function fmt(v: string | null | undefined, suffix = ""): string {
  if (v === null || v === undefined || v === "") return "–";
  return `${v}${suffix}`;
}

export default function RecruiterKPIPage() {
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(ninetyDaysAgo);
  const [to, setTo]     = useState(today);
  const [applied, setApplied] = useState({ from: ninetyDaysAgo, to: today });

  const { data, isLoading, isError } = useQuery<{ data: KPIData }>({
    queryKey: ["recruiter-kpi", applied.from, applied.to],
    queryFn:  () => apiRequest("GET", `/api/hr/recruitment/kpi?from=${applied.from}&to=${applied.to}`),
  });

  const { data: urgentData } = useQuery<{ data: UrgentVacancy[] }>({
    queryKey: ["/api/hr/recruitment/urgent"],
    staleTime: 60_000,
  });

  const { data: channelData } = useQuery<{ data: ChannelAnalyticsRow[] }>({
    queryKey: ["/api/hr/recruitment/channel-analytics"],
    staleTime: 120_000,
  });

  const { data: workerTypeData } = useQuery<{ data: WorkerTypeStatsRow[] }>({
    queryKey: ["/api/hr/recruitment/worker-type-stats"],
    staleTime: 120_000,
  });

  const urgentList = urgentData?.data ?? [];
  const channelRows = channelData?.data ?? [];
  const workerTypeRows = workerTypeData?.data ?? [];

  const kpi = data?.data;
  const s   = kpi?.summary ?? {} as KPISummary;

  const summaryMetrics = [
    { label: "Jami nomzodlar",              value: fmt(s.total_candidates),                        icon: Users,      color: "text-blue-500" },
    { label: "Qabul qilinganlar",            value: fmt(s.hired),                                   icon: UserCheck,  color: "text-green-500" },
    { label: "Referral orqali",              value: fmt(s.via_referral),                            icon: Award,      color: "text-purple-500" },
    { label: "O'rtacha to'ldirish (ish kun)", value: fmt(s.avg_time_to_fill_working_days, " kun"),  icon: Clock,      color: "text-orange-500" },
    { label: "AI o'tish darajasi",           value: fmt(s.ai_pass_rate, "%"),                       icon: TrendingUp, color: "text-emerald-500" },
    { label: "Taklif qabul darajasi",        value: fmt(s.offer_acceptance_rate, "%"),              icon: Percent,    color: "text-sky-500" },
    { label: "Ishga muvofiqlik sifati",      value: fmt(s.quality_of_hire, "%"),                    icon: Target,     color: "text-indigo-500" },
  ];

  const trendData = (Array.isArray(kpi?.monthlyTrend) ? kpi?.monthlyTrend : []).map(r => ({
    month: r.month,
    Qabul: parseInt(r.monthly_hired ?? "0"),
    "Rad etildi": parseInt(r.monthly_rejected ?? "0"),
    "To\'ldirish (kun)": parseFloat(r.avg_fill_days ?? "0"),
  }));

  return (
    <div className="p-6 space-y-6 print:p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruiter KPI</h1>
          <p className="text-sm text-muted-foreground">Ishga qabul bo'limi samaradorligi tahlili</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          PDF / Chop etish
        </Button>
      </div>

      {/* Date filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs mb-1 block">Boshlanish sanasi</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tugash sanasi</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
            </div>
            <Button onClick={() => setApplied({ from, to })} className="bg-primary hover:bg-primary/90">
              <BarChart3 className="w-4 h-4 mr-2" /> Ko'rsatish
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      {isError && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Ma'lumot yuklanmadi</CardContent></Card>
      )}

      {kpi && (
        <>
          {/* Summary KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Array.isArray(summaryMetrics) ? summaryMetrics : []).map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="pt-4 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* URGENT Vacancies Widget */}
          {urgentList.length > 0 && (
            <Card className="border-red-500/40 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Shoshilinch Vakansiyalar ({urgentList.length})
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    — Tezkor e'tibor talab qiladi
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {(Array.isArray(urgentList) ? urgentList : []).map(v => {
                    const elapsed = parseInt(v.working_days_elapsed ?? "0");
                    const deadline = v.deadline_working_days ?? 15;
                    const pct = Math.min(100, Math.round((elapsed / deadline) * 100));
                    const isCritical = pct >= 80;
                    return (
                      <div
                        key={v.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${isCritical ? "border-red-500/50 bg-red-500/10" : "border-orange-500/30 bg-orange-500/5"}`}
                      >
                        <Zap className={`w-4 h-4 shrink-0 ${isCritical ? "text-red-400" : "text-orange-400"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{v.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {v.department_name ?? "—"} · {v.vacancy_type ?? "STANDARD"} · {v.candidate_count} nomzod
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 bg-surface-container-low rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${isCritical ? "bg-red-500" : "bg-orange-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-medium shrink-0 ${isCritical ? "text-red-400" : "text-orange-400"}`}>
                              {elapsed}/{deadline} ish kuni
                            </span>
                          </div>
                        </div>
                        <Badge className={`text-xs shrink-0 ${isCritical ? "bg-red-500 text-white" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}`}>
                          {pct}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly trend chart */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Oylik trend: Qabul va rad etish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="Qabul" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="left" type="monotone" dataKey="Rad etildi" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="To'ldirish (kun)" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Recruiter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Recruiter bo'yicha KPI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpi.byRecruiter.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left pb-2 font-medium">Recruiter</th>
                        <th className="text-right pb-2 font-medium">Qabul</th>
                        <th className="text-right pb-2 font-medium">O'rtacha (kun)</th>
                        <th className="text-right pb-2 font-medium">Taklif %</th>
                        <th className="text-right pb-2 font-medium">AI o'tish %</th>
                        <th className="text-right pb-2 font-medium">Yopilgan (oy)</th>
                        <th className="text-right pb-2 font-medium">Sifat %</th>
                        <th className="text-right pb-2 font-medium">Foiz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(kpi.byRecruiter) ? kpi.byRecruiter : []).map((r, i) => (
                        <tr key={r.recruiter_name} className="border-b border-border/40">
                          <td className="py-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate max-w-[120px]">{r.recruiter_name}</span>
                          </td>
                          <td className="text-right py-2 font-semibold text-green-600">{r.hired}</td>
                          <td className="text-right py-2">{fmt(r.avg_time_to_fill_working_days, " k")}</td>
                          <td className="text-right py-2">{fmt(r.offer_acceptance_rate, "%")}</td>
                          <td className="text-right py-2 text-emerald-600">{fmt(r.ai_pass_rate, "%")}</td>
                          <td className="text-right py-2 font-medium">{r.monthly_closed ?? "0"}</td>
                          <td className="text-right py-2 text-indigo-600">{fmt(r.quality_of_hire, "%")}</td>
                          <td className="text-right py-2">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 bg-muted rounded-full">
                                <div
                                  className="h-1.5 bg-primary rounded-full"
                                  style={{ width: `${r.hire_rate ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{r.hire_rate ?? 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* By Stage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Bosqichlar bo'yicha
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpi.byStage.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
                )}
                <div className="space-y-2">
                  {(Array.isArray(kpi.byStage) ? kpi.byStage : []).map(row => {
                    const total = kpi.byStage?.reduce((a, b) => a + parseInt(b.count), 0);
                    const pctVal = total ? Math.round(parseInt(row.count) / total * 100) : 0;
                    return (
                      <div key={row.stage} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-36 truncate">
                          {STAGE_LABELS[row.stage] ?? row.stage}
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full">
                          <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${pctVal}%` }} />
                        </div>
                        <span className="text-xs font-semibold w-8 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Vacancy Type */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Vakansiya turi bo'yicha konversiya
                  <span className="ml-auto text-xs font-normal text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
                    Maqsad: {CONVERSION_TARGET}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kpi.byVacancyType.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left pb-2 font-medium">Tur</th>
                        <th className="text-right pb-2 font-medium">Arizalar</th>
                        <th className="text-right pb-2 font-medium">Qabul</th>
                        <th className="text-right pb-2 font-medium">Konversiya</th>
                        <th className="text-left pb-2 font-medium pl-4">Progress (60% maqsad)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(kpi.byVacancyType) ? kpi.byVacancyType : []).map(row => {
                        const convRate = Number(row.conversion_rate ?? 0);
                        const convColor = convRate >= CONVERSION_TARGET
                          ? "bg-green-500"
                          : convRate >= 30
                          ? "bg-amber-500"
                          : "bg-red-500";
                        const textColor = convRate >= CONVERSION_TARGET
                          ? "text-green-600"
                          : convRate >= 30
                          ? "text-amber-500"
                          : "text-red-500";
                        return (
                          <tr key={row.vacancy_type} className="border-b border-border/50">
                            <td className="py-2">
                              <Badge className={`text-xs ${TYPE_COLORS[row.vacancy_type] ?? "bg-gray-100 text-gray-700"}`}>
                                {TYPE_LABELS[row.vacancy_type] ?? row.vacancy_type}
                              </Badge>
                            </td>
                            <td className="text-right py-2">{row.applications}</td>
                            <td className="text-right py-2 font-semibold text-green-600">{row.hired}</td>
                            <td className={`text-right py-2 font-semibold ${textColor}`}>{convRate}%</td>
                            <td className="py-2 pl-4 w-48">
                              <div className="relative h-2 bg-muted rounded-full overflow-visible">
                                {/* Target line at 60% */}
                                <div
                                  className="absolute top-0 h-full w-0.5 bg-primary/50 z-10"
                                  style={{ left: `${CONVERSION_TARGET}%` }}
                                  title={`Maqsad: ${CONVERSION_TARGET}%`}
                                />
                                <div
                                  className={`h-2 rounded-full ${convColor}`}
                                  style={{ width: `${Math.min(100, convRate)}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">
                                {convRate >= CONVERSION_TARGET ? "✓ Maqsadga erishildi" : `${CONVERSION_TARGET - convRate}% yetishmaydi`}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Xodim turi statistikasi ──────────────────────────────────── */}
          {workerTypeRows.length > 0 && (() => {
            const WORKER_TYPES: WorkerType[] = ["FLAGMAN", "PROTSESSNIK", "TRABLDAYKER"];
            const PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444"];
            const total = (Array.isArray(workerTypeRows) ? workerTypeRows : []).reduce((a, r) => a + parseInt(r.count || "0"), 0);
            const pieData = WORKER_TYPES.map((wt, i) => {
              const row = (Array.isArray(workerTypeRows) ? workerTypeRows : []).find(r => r.worker_type === wt);
              return {
                name: WORKER_TYPE_META[wt].emoji + " " + WORKER_TYPE_META[wt].label,
                value: parseInt(row?.count || "0"),
                color: PIE_COLORS[i],
                meta: WORKER_TYPE_META[wt],
              };
            });
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Xodim Turlari Bo'yicha Statistika
                    <Badge variant="outline" className="text-[10px] ml-2">HR Capital №9</Badge>
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
                          label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ""}
                          labelLine={false}
                        >
                          {(Array.isArray(pieData) ? pieData : []).map((entry, i) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          formatter={(val: number) => [`${val} nomzod`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3 flex-1">
                      {(Array.isArray(pieData) ? pieData : []).map(entry => {
                        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                        return (
                          <div key={entry.meta.label} className={`flex items-center gap-3 p-3 rounded-lg border ${entry.meta.bg} ${entry.meta.border}`}>
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
          })()}

          {/* ── Kanal konversiya tahlili ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" /> Jalb qilish kanallari bo'yicha samaradorlik
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  Maqsad: ≥{CONVERSION_TARGET}% konversiya
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* All-channels table including static Referral + Gazeta */}
              {(() => {
                const allChannelKeys = [
                  ...new Set([
                    ...(channelRows ?? []).map(r => r.ch_key),
                    "REFERRAL",
                    "GAZETA",
                  ]),
                ];
                const rowsWithDefaults: ChannelAnalyticsRow[] = (allChannelKeys ?? []).map(key => {
                  const found = (Array.isArray(channelRows) ? channelRows : []).find(r => r.ch_key === key);
                  return found ?? {
                    ch_key: key,
                    vacancy_count: "0",
                    total_views: "0",
                    total_applications: "0",
                    conversion_rate: "0",
                  };
                });

                return (
                  <div className="space-y-4">
                    {/* 60% konversiya qoidasi — vizual chiziq */}
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        60% Konversiya Qoidasi: Ariza → Telefon suhbat → Asosiy suhbat
                      </p>
                      <div className="flex items-center gap-3">
                        {([
                          { label: "Arizalar", pct: 100, target: "10x" },
                          { label: "Telefon suhbat", pct: 50, target: "5x" },
                          { label: "Suhbat", pct: 10, target: "1x" },
                        ]).map((step, i) => (
                          <div key={step.label} className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-muted-foreground">{step.label}</span>
                              <div className="w-12 h-2 bg-primary/20 rounded-full overflow-hidden mt-0.5">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${step.pct}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-primary mt-0.5">{step.target}</span>
                            </div>
                            {i < 2 && <span className="text-muted-foreground text-sm">→</span>}
                          </div>
                        ))}
                        <div className="ml-4 text-xs text-muted-foreground">
                          Maqsad: <span className="font-bold text-primary">{CONVERSION_TARGET}%</span> konversiya
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="text-left pb-2 font-medium">Kanal</th>
                            <th className="text-right pb-2 font-medium">Vakansiyalar</th>
                            <th className="text-right pb-2 font-medium">Ko'rishlar</th>
                            <th className="text-left pb-2 pl-4 font-medium">Konversiya zanjiri</th>
                            <th className="text-right pb-2 font-medium">Holat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(rowsWithDefaults) ? rowsWithDefaults : []).map(row => {
                            const meta = CHANNEL_META[row.ch_key];
                            const apps = Number(row.total_applications ?? 0);
                            const phone = row.phone_screening_count != null ? Number(row.phone_screening_count) : undefined;
                            const interview = row.interview_count != null ? Number(row.interview_count) : undefined;
                            const hired = row.hired_count != null ? Number(row.hired_count) : undefined;
                            const convNum = apps > 0 && hired != null ? Math.round((hired / apps) * 100) : parseFloat(row.conversion_rate ?? "0");
                            const isGood = convNum >= CONVERSION_TARGET;
                            const isMedium = !isGood && convNum >= 30;
                            const statusColor = apps === 0
                              ? "bg-muted/40 text-muted-foreground border-border/40"
                              : isGood
                              ? "bg-green-500/10 text-green-400 border-green-500/30"
                              : isMedium
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30";
                            const statusLabel = apps === 0
                              ? "Ma'lumot yo'q"
                              : isGood ? "Yaxshi" : isMedium ? "O'rta" : "Past";

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
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
