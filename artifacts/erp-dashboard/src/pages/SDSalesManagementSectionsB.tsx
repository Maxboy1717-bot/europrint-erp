/**
 * @module SDSalesManagementSectionsB
 * @description Analytics and Commission section components for SDSalesManagement.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Award, Target, Trophy } from "lucide-react";
import { AnalyticsMonthly, CommissionRecord, LeaderboardEntry, statusVariant, statusLabel } from "./SDSalesManagementTypes";

// ---------------------------------------------------------------------------
// AnalyticsSection
// ---------------------------------------------------------------------------

interface AnalyticsSectionProps {
  analyticsMonthly: AnalyticsMonthly[];
  analyticsVelocity: Record<string, unknown> | null;
  isLoading: boolean;
}

export function AnalyticsSection({ analyticsMonthly, analyticsVelocity, isLoading }: AnalyticsSectionProps) {
  const safeMonthly = Array.isArray(analyticsMonthly) ? analyticsMonthly : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Savdo Analitikasi</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={`k-${i}`} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : analyticsMonthly.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
          <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Analitika ma'lumotlari yo'q</p>
          <p className="text-sm mt-1 opacity-70">Savdo ma'lumotlari to'planayotganda analitika ko'rinadi</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {([
              {
                label: "Jami daromad",
                value: safeMonthly.reduce((s, m) => s + Number(m.totalRevenue || 0), 0),
                fmt: (v: number) => `${(v / 1_000_000).toFixed(1)}M`,
                color: "text-primary",
              },
              {
                label: "Jami buyurtmalar",
                value: safeMonthly.reduce((s, m) => s + (m.totalOrders || 0), 0),
                fmt: (v: number) => v.toString(),
                color: "text-[var(--ep-blue)]",
              },
              {
                label: "O'rtacha buyurtma",
                value: safeMonthly.length > 0
                  ? safeMonthly.reduce((s, m) => s + Number(m.avgOrderValue || 0), 0) / safeMonthly.length
                  : 0,
                fmt: (v: number) => `${(v / 1_000_000).toFixed(2)}M`,
                color: "text-[var(--ep-green)]",
              },
              {
                label: "Yangi mijozlar",
                value: safeMonthly.reduce((s, m) => s + (m.newCustomers || 0), 0),
                fmt: (v: number) => v.toString(),
                color: "text-[var(--ep-yellow)]",
              },
            ]).map((s, i) => (
              <div key={`k-${i}`} className="bg-card rounded-lg p-5" data-testid={`analytics-kpi-${i}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.fmt(s.value)}</p>
              </div>
            ))}
          </div>

          <Card className="bg-card border-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Oylik Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Oy</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Daromad</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Buyurtmalar</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">O'rtacha buyurtma</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Yangi mijozlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeMonthly.map((m, idx) => (
                    <TableRow key={idx} data-testid={`row-analytics-${idx}`} className="hover:bg-muted/40 transition-colors border-none">
                      <TableCell className="py-3 px-6 font-medium text-foreground">{m.month}/{m.year}</TableCell>
                      <TableCell className="py-3 px-6 font-mono text-foreground">{m.totalRevenue ? `${Number(m.totalRevenue).toLocaleString()} so'm` : "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{m.totalOrders || 0}</TableCell>
                      <TableCell className="py-3 px-6 font-mono text-foreground">{m.avgOrderValue ? `${Number(m.avgOrderValue).toLocaleString()} so'm` : "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{m.newCustomers || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>

          {analyticsVelocity && (
            <Card className="bg-card border-none rounded-xl">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Savdo Tezligi</CardTitle>
                <CardDescription className="text-muted-foreground">Pipeline va konversiya metrikalari</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analyticsVelocity ?? {}).filter((_, i) => i < 4).map(([key, val]) => (
                    <div key={key} className="bg-muted/60 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="text-2xl font-bold text-foreground">{String(val ?? "—")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommissionSection
// ---------------------------------------------------------------------------

interface CommissionSectionProps {
  commissions: CommissionRecord[];
  leaderboard: LeaderboardEntry[];
  commLoading: boolean;
  leaderLoading: boolean;
}

export function CommissionSection({ commissions, leaderboard, commLoading, leaderLoading }: CommissionSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Savdochilar Komissiyasi</h2>

      {leaderLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={`k-${i}`} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-card rounded-xl p-6 text-center text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Leaderboard ma'lumotlari mavjud emas</p>
          <p className="text-sm mt-1 opacity-70">Savdochilar rejalari qo'shilganda reyting shakllanadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Array.isArray(leaderboard) ? leaderboard : []).slice(0, 3).map((l, i) => (
            <div
              key={`k-${i}`}
              className={`bg-card rounded-xl p-6 text-center border ${i === 0 ? "border-yellow-400" : i === 1 ? "border-border" : "border-amber-500"}`}
              data-testid={`leader-card-${i}`}
            >
              <div className={`text-3xl font-bold mb-2 ${i === 0 ? "text-[var(--ep-yellow)]" : i === 1 ? "text-muted-foreground" : "text-[var(--ep-yellow)]"}`}>
                #{l.rank || i + 1}
              </div>
              <div className="font-bold text-lg text-foreground">{l.salesPersonName || "—"}</div>
              <div className="text-3xl font-bold text-primary mt-2">
                {l.totalSales ? `${(Number(l.totalSales) / 1_000_000).toFixed(1)}M` : "—"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">so'm</div>
              {l.achievementPct != null && (
                <Badge className="mt-3 bg-muted/60 text-foreground border-none shadow-none rounded-full px-3">
                  {Number(l.achievementPct).toFixed(0)}% reja
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <Card className="bg-card border-none rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Komissiya Hisob-Kitobi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : commissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Komissiya hisoblari mavjud emas</p>
              <p className="text-sm mt-1 opacity-70">Savdochilar rejalari va natijalar kiritilganda hisob-kitob avtomatik bajariladi</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Savdochi</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Davr</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Jami savdo</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Stavka</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Komissiya</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(commissions) ? commissions : []).map(c => (
                  <TableRow key={c.id} data-testid={`row-commission-${c.id}`} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-foreground">{c.salesPersonName || "—"}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{c.period || "—"}</TableCell>
                    <TableCell className="py-3 px-6 font-mono text-foreground">{c.totalSales ? `${Number(c.totalSales).toLocaleString()} so'm` : "—"}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{c.commissionRate ? `${c.commissionRate}%` : "—"}</TableCell>
                    <TableCell className="py-3 px-6 font-mono font-bold text-primary">{c.commissionAmount ? `${Number(c.commissionAmount).toLocaleString()} so'm` : "—"}</TableCell>
                    <TableCell className="py-3 px-6">
                      <Badge className={`${statusVariant[c.status || ""] || "bg-muted/60 text-foreground"} rounded-full px-2.5 py-0.5 text-xs font-semibold border-none`}>
                        {statusLabel[c.status || ""] || c.status || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
