import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Settings2, TrendingUp, AlertTriangle, Clock, Zap, Target,
  ChevronUp, ChevronDown, Activity, Gauge, CheckCircle2, BarChart2, RefreshCw,
} from "lucide-react";
import type { MesSummary } from "./profile-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface MachineOperatorTabProps {
  employeeId: string;
}

function KpiCard({
  label, value, unit, icon: Icon, color, subtitle, trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Card className={`bg-gradient-to-br ${color} border-0`}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{value}</span>
              {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1">
            {trend === "up" && <ChevronUp className="h-3.5 w-3.5 text-green-500" />}
            {trend === "down" && <ChevronDown className="h-3.5 w-3.5 text-red-500" />}
            <Icon className="h-7 w-7 opacity-50" />
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

const STOPPAGE_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22d3ee", "#8b5cf6", "#ec4899"];

export function MachineOperatorTab({ employeeId }: MachineOperatorTabProps) {
  const { data: mes, isLoading } = useQuery<MesSummary>({
    queryKey: ["/api/integration/employee-mes-summary", employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/integration/employee-mes-summary/${employeeId}?months=3`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employeeId,
  });

  const { data: mes6, isLoading: loading6 } = useQuery<MesSummary>({
    queryKey: ["/api/integration/employee-mes-summary", employeeId, 6],
    queryFn: async () => {
      const res = await fetch(`/api/integration/employee-mes-summary/${employeeId}?months=6`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const s = mes?.summary;
  const noData = !s || s.totalSessions === 0;

  const oee = s ? Math.round(s.avgOee * 100) / 100 : 0;
  const productivity = s ? Math.round(s.goalAchievement) : 0;
  const defectPct = s ? Math.round(s.defectPercent * 10) / 10 : 0;
  const uptime = s ? Math.round(s.workTimeRatio) : 0;

  const oeeColor =  oee >= 80 ? "text-green-600" : oee >= 60 ? "text-amber-600" : "text-red-600";
  const productColor = productivity >= 90 ? "text-green-600" : productivity >= 70 ? "text-amber-600" : "text-red-600";

  const monthlyChartData = (Array.isArray(mes6?.monthlyData) ? mes6?.monthlyData : []).map(d => ({
    month: d.month?.substring(0, 7) ?? "",
    Ishlab: d.actual ?? 0,
    Maqsad: d.target ?? 0,
    Nuqson: d.defects ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Dastgoh Operatori Profili</h2>
          <p className="text-sm text-muted-foreground">
            So'nggi {mes?.periodMonths ?? 3} oy uchun ishlab chiqarish ko'rsatkichlari
          </p>
        </div>
      </div>

      {noData ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Activity className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">Ishlab chiqarish ma'lumotlari topilmadi</p>
            <p className="text-xs opacity-60">Dastgoh sessiyalari MES tizimida qayd etilmagan</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="OEE (Samaradorlik)"
              value={`${oee.toFixed(1)}%`}
              icon={Gauge}
              color="from-blue-500/10 to-blue-600/10"
              subtitle={oee >= 80 ? "A'lo" : oee >= 60 ? "Qoniqarli" : "Past"}
            />
            <KpiCard
              label="Maqsad bajarilishi"
              value={`${productivity}%`}
              icon={Target}
              color="from-green-500/10 to-green-600/10"
              subtitle={`${(s?.totalActual ?? 0).toLocaleString()} / ${(s?.totalTarget ?? 0).toLocaleString()} dona`}
              trend={productivity >= 90 ? "up" : productivity < 70 ? "down" : "neutral"}
            />
            <KpiCard
              label="Nuqson ulushi"
              value={`${defectPct}%`}
              icon={AlertTriangle}
              color={defectPct <= 2 ? "from-green-500/10 to-green-600/10" : defectPct <= 5 ? "from-amber-500/10 to-amber-600/10" : "from-red-500/10 to-red-600/10"}
              subtitle={`${(s?.totalDefects ?? 0).toLocaleString()} dona nuqsonli`}
              trend={defectPct <= 2 ? "up" : defectPct > 5 ? "down" : "neutral"}
            />
            <KpiCard
              label="Ish vaqti ulushi"
              value={`${uptime}%`}
              icon={Zap}
              color="from-purple-500/10 to-purple-600/10"
              subtitle={`${Math.round((s?.totalRunningMinutes ?? 0) / 60)}h ish / ${Math.round((s?.totalStoppedMinutes ?? 0) / 60)}h to'xtash`}
            />
          </div>

          {/* Additional stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Yakunlangan sessiyalar</p>
                <p className="font-bold text-sm">{s?.completedSessions} / {s?.totalSessions}</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">To'xtashlar soni</p>
                <p className="font-bold text-sm">{s?.totalStoppages ?? 0} ta</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg px-4 py-3 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Jami ishlab chiqarilgan</p>
                <p className="font-bold text-sm">{(s?.totalActual ?? 0).toLocaleString()} dona</p>
              </div>
            </div>
          </div>

          {/* Monthly Production Chart */}
          {monthlyChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart2 className="h-4 w-4 text-blue-500" />
                  Oylik ishlab chiqarish dinamikasi (6 oy)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart data={monthlyChartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11 }}
                      formatter={(val: number, name: string) => [val.toLocaleString(), name]}
                    />
                    <Bar dataKey="Maqsad" fill="#e2e8f0" radius={[2,2,0,0]} />
                    <Bar dataKey="Ishlab" fill="#3b82f6" radius={[2,2,0,0]} />
                    <Bar dataKey="Nuqson" fill="#ef4444" radius={[2,2,0,0]} />
                  </ReBarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  {([
                    { label: "Maqsad", color: "#e2e8f0" },
                    { label: "Ishlab chiqarilgan", color: "#3b82f6" },
                    { label: "Nuqsonli", color: "#ef4444" },
                  ]).map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                      <span className="text-xs text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stoppage Reasons */}
          {(mes?.stoppageHistory ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  To'xtash sabablari tahlili
                </CardTitle>
                {mes?.mostFrequentReason && (
                  <CardDescription>
                    Eng ko'p: <span className="font-medium text-foreground">
                      {mes.mostFrequentReason.reasonDescription || mes.mostFrequentReason.reasonCode}
                    </span> ({mes.mostFrequentReason.count} marta)
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bar chart for stoppages */}
                  <div>
                    <ResponsiveContainer width="100%" height={160}>
                      <ReBarChart
                        data={(mes?.stoppageHistory ?? []).slice(0, 6).map((r, i) => ({
                          name: r.reasonDescription?.substring(0, 14) || r.reasonCode,
                          daqiqa: Math.round(r.totalMinutes),
                          fill: STOPPAGE_COLORS[i % STOPPAGE_COLORS.length],
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v} daqiqa`, "To'xtash"]} />
                        <Bar dataKey="daqiqa" radius={[0,2,2,0]}>
                          {(mes?.stoppageHistory ?? []).slice(0, 6).map((_, i) => (
                            <Cell key={`k-${i}`} fill={STOPPAGE_COLORS[i % STOPPAGE_COLORS.length]} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Sabab</TableHead>
                        <TableHead className="text-xs text-right">Marta</TableHead>
                        <TableHead className="text-xs text-right">Daqiqa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(mes?.stoppageHistory ?? []).slice(0, 8).map((r, i) => (
                        <TableRow key={`k-${i}`}>
                          <TableCell className="text-xs py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: STOPPAGE_COLORS[i % STOPPAGE_COLORS.length] }}
                              />
                              {r.reasonDescription || r.reasonCode}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-right py-1.5 font-medium">{r.count}</TableCell>
                          <TableCell className="text-xs text-right py-1.5 text-muted-foreground">
                            {Math.round(r.totalMinutes)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Stoppages */}
          {(mes?.recentStoppages ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-red-500" />
                  Oxirgi to'xtashlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Sana</TableHead>
                      <TableHead className="text-xs">Sabab</TableHead>
                      <TableHead className="text-xs text-right">Davomiyligi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mes?.recentStoppages ?? []).slice(0, 10).map((st, i) => (
                      <TableRow key={`k-${i}`}>
                        <TableCell className="text-xs py-1.5 text-muted-foreground whitespace-nowrap">
                          {st.startedAt ? new Date(st.startedAt).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="text-xs py-1.5">
                          {st.reasonDescription || st.reasonCode || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right py-1.5 font-medium">
                          {st.durationSeconds
                            ? `${Math.round(st.durationSeconds / 60)} daq`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* OEE rating badge */}
          <Card className="bg-muted/20">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Umumiy OEE bahosi</p>
                  <p className="text-xs text-muted-foreground">
                    Jahon standarti: A'lo ≥85%, Yaxshi ≥65%, Qoniqarli ≥50%
                  </p>
                </div>
              </div>
              <Badge
                className={`text-sm px-4 py-1.5 ${
                  oee >= 85 ? "bg-green-500/20 text-green-600 border-green-500/30"
                  : oee >= 65 ? "bg-amber-500/20 text-amber-600 border-amber-500/30"
                  : oee >= 50 ? "bg-orange-500/20 text-orange-600 border-orange-500/30"
                  : "bg-red-500/20 text-red-600 border-red-500/30"
                }`}
                variant="outline"
              >
                {oee >= 85 ? "A'lo" : oee >= 65 ? "Yaxshi" : oee >= 50 ? "Qoniqarli" : "Yaxshilash kerak"}
                {" — "}{oee.toFixed(1)}%
              </Badge>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
