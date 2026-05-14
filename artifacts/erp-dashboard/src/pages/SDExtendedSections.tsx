/**
 * @module SDExtendedSections
 * @description Major section (TabsContent) components for SDExtended.
 * Contains ManagerPanel and QuotaPanel.
 * RentalPanel and AdvancePanel live in SDExtendedSections2.tsx.
 */

import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp, Users, CheckCircle2, DollarSign, BarChart3,
} from "lucide-react";
import type { ManagerStat } from "./SDExtendedTypes";
import { EPStatusPill } from "@/components/ep";

// ── Manager Panel ────────────────────────────────────────────────────────────

interface ManagerPanelProps {
  dealsCount: number;
  wonDealsCount: number;
  totalRevenue: number;
  managersCount: number;
  managerStats: ManagerStat[];
}

export function ManagerPanel({
  dealsCount,
  wonDealsCount,
  totalRevenue,
  managersCount,
  managerStats,
}: ManagerPanelProps) {
  return (
    <TabsContent value="manager" className="space-y-6 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jami bitimlar</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">{dealsCount}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Yutilgan bitimlar</p>
                <p className="text-3xl font-bold tracking-tight text-primary">{wonDealsCount}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Jami daromad</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">{(totalRevenue / 1_000_000).toFixed(1)}M</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Menejerlar soni</p>
                <p className="text-3xl font-bold tracking-tight text-foreground">{managersCount}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/40/50">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menejer ko'rsatkichlari</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {managerStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 italic">Menejer ma'lumotlari topilmadi</p>
          ) : (
            <div className="space-y-8">
              {(Array.isArray(managerStats) ? managerStats : []).map((m, i) => (
                <div key={`k-${i}`} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{m.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      <span className="text-foreground">{(m.revenue / 1_000_000).toFixed(1)}M</span> / {(m.quota / 1_000_000).toFixed(0)}M so'm
                    </span>
                  </div>
                  <Progress value={m.progress} className="h-2.5 bg-muted" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {m.wonDeals} yutilgan
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                        {m.totalDeals} jami bitim
                      </div>
                    </div>
                    <EPStatusPill tone="neutral" className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-none ${
                      m.progress >= 100 ? "bg-primary text-white" :
                      m.progress >= 70 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {m.progress.toFixed(0)}%
                    </EPStatusPill>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// ── Quota Panel ──────────────────────────────────────────────────────────────

interface QuotaPanelProps {
  managerStats: ManagerStat[];
}

export function QuotaPanel({ managerStats }: QuotaPanelProps) {
  return (
    <TabsContent value="quota" className="space-y-4 mt-0">
      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/40/50">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />Kvota bajarilishi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">Menejer</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">Kvota (so'm)</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">Haqiqiy</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">Farq</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">%</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-12">Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12 italic">Ma'lumot yo'q</TableCell>
                </TableRow>
              ) : (Array.isArray(managerStats) ? managerStats : []).map((m, i) => (
                <TableRow key={`k-${i}`} className="border-border hover:bg-muted/40/50">
                  <TableCell className="font-bold text-foreground py-4">{m.name}</TableCell>
                  <TableCell className="text-right font-medium text-foreground py-4">{(m.quota / 1_000_000).toFixed(0)}M</TableCell>
                  <TableCell className="text-right font-bold text-primary py-4">{(m.revenue / 1_000_000).toFixed(1)}M</TableCell>
                  <TableCell className={`text-right font-medium py-4 ${m.revenue < m.quota ? "text-[var(--ep-primary)]" : "text-primary"}`}>
                    {m.revenue < m.quota ? `-${((m.quota - m.revenue) / 1_000_000).toFixed(1)}M` : "+"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground py-4">{m.progress.toFixed(0)}%</TableCell>
                  <TableCell className="py-4">
                    <EPStatusPill tone="neutral" className={`rounded-full px-3 border-none text-[10px] font-bold ${
                      m.progress >= 100 ? "bg-primary text-white" :
                      m.progress >= 70 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {m.progress >= 100 ? "Bajarildi" : m.progress >= 70 ? "Yaqin" : "Orqada"}
                    </EPStatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
