/**
 * @module SDDashboardSections
 * @description Major section components for SDDashboard: KPI cards, status lists,
 * deals list, invoices list, and AI analysis panels.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Users, CheckCircle, Phone, Building2, DollarSign, TrendingUp,
  Star, Layers, ShoppingCart, Package, BarChart3, ArrowUpRight,
  Target,
} from "lucide-react";
import React from "react";
import {
  CrmDashboardAnalysis,
  Deal,
  Invoice,
  Lead,
  LEAD_STATUS_LABELS,
  fmtMoney,
} from "./SDDashboardTypes";

// ─── KpiCard ─────────────────────────────────────────────────────────────────

export function KpiCard({ title, value, sub, icon: Icon, color, loading }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  if (loading) return (
    <Card><CardContent className="p-5">
      <Skeleton className="h-4 w-24 mb-3 rounded-lg" /><Skeleton className="h-8 w-16 mb-2 rounded-lg" /><Skeleton className="h-3 w-20 rounded-lg" />
    </CardContent></Card>
  );
  return (
    <Card><CardContent className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent></Card>
  );
}

// ─── KpiSection ──────────────────────────────────────────────────────────────

interface KpiSectionProps {
  stats: { leads: number; deals: number; contacts: number; companies: number };
  pipelineValue: number;
  convRate: number;
  loading: boolean;
}

export function KpiSection({ stats, pipelineValue, convRate, loading }: KpiSectionProps) {
  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hozirgi holat</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Jami Leadlar" value={stats.leads} icon={Users} color="text-[var(--ep-blue)]" loading={loading} />
        <KpiCard title="Bitimlar" value={stats.deals} icon={CheckCircle} color="text-[var(--ep-green)]" loading={loading} />
        <KpiCard title="Kontaktlar" value={stats.contacts} icon={Phone} color="text-[var(--ep-purple)]" loading={loading} />
        <KpiCard title="Kompaniyalar" value={stats.companies} icon={Building2} color="text-[var(--ep-primary)]" loading={loading} />
        <KpiCard title="Pipeline" value={fmtMoney(pipelineValue)} sub="so'm" icon={DollarSign} color="text-[var(--ep-green)]" loading={loading} />
        <KpiCard title="Konversiya" value={`${convRate}%`} sub="lead → bitim" icon={TrendingUp} color="text-[var(--ep-cyan)]" loading={loading} />
      </div>
    </section>
  );
}

// ─── AiSummaryCard ───────────────────────────────────────────────────────────

interface AiSummaryCardProps {
  aiLoad: boolean;
  aiAnalysis: CrmDashboardAnalysis | undefined;
}

export function AiSummaryCard({ aiLoad, aiAnalysis }: AiSummaryCardProps) {
  if (aiLoad || !aiAnalysis?.analysis?.summary) return null;
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4 flex items-start gap-3">
        <Star className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <p className="text-sm font-semibold">AI Savdo Tahlili</p>
          <p className="text-sm text-muted-foreground">{aiAnalysis.analysis.summary}</p>
          {aiAnalysis.analysis.priorityActions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(Array.isArray(aiAnalysis.analysis.priorityActions) ? aiAnalysis.analysis.priorityActions : []).map((a, i) => (
                <Badge key={`k-${i}`} variant="secondary" className="text-xs">{a}</Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AttentionSection ────────────────────────────────────────────────────────

interface AttentionSectionProps {
  leads: Lead[];
  deals: Deal[];
  invoices: Invoice[];
  leadsByStatus: Record<string, number>;
  leadsLoad: boolean;
  dealsLoad: boolean;
  invLoad: boolean;
}

export function AttentionSection({
  leads, deals, invoices, leadsByStatus, leadsLoad, dealsLoad, invLoad,
}: AttentionSectionProps) {
  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">E'tibor kerak</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lead statuslari */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--ep-blue)]" />
              Lead statuslari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-5 w-full rounded-lg" />)}</div> :
             leads.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Lead yo'q</p> : (
              <div className="space-y-2">
                {Object.entries(leadsByStatus ?? {}).filter((_, i) => i < 6).map(([st, cnt]) => (
                  <div key={st} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{LEAD_STATUS_LABELS[st] || st}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (cnt/Math.max(1,leads.length))*100)}%` }} />
                      </div>
                      <span className="font-semibold w-5 text-right">{cnt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* So'nggi bitimlar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[var(--ep-green)]" />
              So'nggi bitimlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dealsLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
             deals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Bitim yo'q</p> : (
              <div className="space-y-2">
                {(Array.isArray(deals) ? deals : []).slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate max-w-[140px] text-muted-foreground" title={d.title}>{d.title}</span>
                    <span className="font-semibold text-[var(--ep-green)] shrink-0 ml-2">
                      {d.opportunity ? fmtMoney(d.opportunity) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoicelar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--ep-primary)]" />
              Invoicelar
              <Badge variant="outline" className="ml-auto text-xs">{invoices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full rounded-lg" />)}</div> :
             invoices.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Invoice yo'q</p> : (
              <div className="space-y-2">
                {(Array.isArray(invoices) ? invoices : []).slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate max-w-[140px] text-muted-foreground">
                      {inv.title || `Invoice #${inv.id}`}
                    </span>
                    <span className="font-semibold shrink-0 ml-2">
                      {inv.opportunity ? fmtMoney(inv.opportunity) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ─── AiAnalysisSection ───────────────────────────────────────────────────────

interface AiAnalysisSectionProps {
  aiLoad: boolean;
  aiAnalysis: CrmDashboardAnalysis | undefined;
}

export function AiAnalysisSection({ aiLoad, aiAnalysis }: AiAnalysisSectionProps) {
  if (aiLoad || !aiAnalysis?.analysis) return null;
  return (
    <section>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Tahlil</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--ep-blue)]" />Asosiy xulosalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(aiAnalysis.analysis.keyInsights || []).map((s, i) => (
                <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--ep-blue)] mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--ep-purple)]" />Tavsiyalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(aiAnalysis.analysis.recommendations || []).map((r, i) => (
                <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--ep-purple)] mt-0.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
