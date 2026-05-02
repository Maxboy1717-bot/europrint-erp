import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Users, CheckCircle, Phone, Building2, DollarSign, TrendingUp,
  Star, Layers, ShoppingCart, Package, BarChart3, ArrowUpRight,
  Target, ChevronRight,
} from "lucide-react";
import React from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_STATUS_LABELS: Record<string, string> = {
  "1": "Yangi",
  "2": "Aloqa o'rnatildi",
  "3": "Taklif yuborildi",
  "4": "Muzokara",
  "5": "Yutildi",
  "6": "Yutqazildi",
  yangi: "Yangi",
  aloqa: "Aloqa o'rnatildi",
  taklif: "Taklif yuborildi",
  muzokara: "Muzokara",
  yutildi: "Yutildi",
  yutqazildi: "Yutqazildi",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrmDashboardAnalysis {
  stats: { leads: number; deals: number; contacts: number; companies: number };
  analysis: {
    overallHealth: string;
    keyInsights: string[];
    recommendations: string[];
    priorityActions: string[];
    summary: string;
  };
}

interface Lead {
  id: number;
  title: string;
  statusId?: number;
  opportunity?: number;
}

interface Deal {
  id: number;
  title: string;
  opportunity?: number;
  currencyId?: string;
}

interface Invoice {
  id: number;
  title?: string;
  opportunity?: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, color, loading }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  if (loading) return (
    <Card><CardContent className="p-5">
      <Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-20" />
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

function fmtMoney(v: number) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + " mlrd";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + " mln";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + " ming";
  return String(v);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SDDashboard() {
  const { data: aiAnalysis, isLoading: aiLoad } = useQuery<CrmDashboardAnalysis>({
    queryKey: ["/api/crm/ai/dashboard-analysis"],
  });

  const { data: leadsRaw, isLoading: leadsLoad } = useQuery<{ data?: Lead[] } | Lead[]>({
    queryKey: ["/api/crm/leads"],
  });

  const { data: dealsRaw, isLoading: dealsLoad } = useQuery<{ data?: Deal[] } | Deal[]>({
    queryKey: ["/api/crm/deals"],
  });

  const { data: invRaw, isLoading: invLoad } = useQuery<{ data?: Invoice[] } | Invoice[]>({
    queryKey: ["/api/crm/invoices"],
  });

  const loading = aiLoad || leadsLoad || dealsLoad || invLoad;

  const leads: Lead[] = Array.isArray(leadsRaw) ? leadsRaw : (leadsRaw as { data?: Lead[] })?.data || [];
  const deals: Deal[] = Array.isArray(dealsRaw) ? dealsRaw : (dealsRaw as { data?: Deal[] })?.data || [];
  const invoices: Invoice[] = Array.isArray(invRaw) ? invRaw : (invRaw as { data?: Invoice[] })?.data || [];

  const stats = aiAnalysis?.stats ?? { leads: leads.length, deals: deals.length, contacts: 0, companies: 0 };
  const convRate = stats.leads > 0 ? Math.round((stats.deals / stats.leads) * 100) : 0;
  const pipelineValue = (Array.isArray(deals) ? deals : []).reduce((s, d) => s + (d.opportunity || 0), 0);

  const health = aiAnalysis?.analysis?.overallHealth || "o'rtacha";
  const healthColor = health === "yaxshi" ? "text-green-700 bg-green-50" :
    health === "yomon" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50";

  const leadsByStatus: Record<string, number> = {};
  (Array.isArray(leads) ? leads : []).forEach(l => {
    const k = String(l.statusId ?? "yangi");
    leadsByStatus[k] = (leadsByStatus[k] || 0) + 1;
  });

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM / Savdo Dashbordi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Savdo menejerining kunlik ko'rinishi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!aiLoad && aiAnalysis?.analysis && (
            <Badge className={cn("text-xs font-semibold px-3", healthColor)}>
              Holat: {health}
            </Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/crm-workspace">
              CRM <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ── SECTION 1: Hozirgi holat ────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hozirgi holat</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard title="Jami Leadlar" value={stats.leads} icon={Users} color="text-blue-500" loading={loading} />
          <KpiCard title="Bitimlar" value={stats.deals} icon={CheckCircle} color="text-green-500" loading={loading} />
          <KpiCard title="Kontaktlar" value={stats.contacts} icon={Phone} color="text-violet-500" loading={loading} />
          <KpiCard title="Kompaniyalar" value={stats.companies} icon={Building2} color="text-orange-500" loading={loading} />
          <KpiCard title="Pipeline" value={fmtMoney(pipelineValue)} sub="so'm" icon={DollarSign} color="text-emerald-500" loading={loading} />
          <KpiCard title="Konversiya" value={`${convRate}%`} sub="lead → bitim" icon={TrendingUp} color="text-cyan-500" loading={loading} />
        </div>
      </section>

      {/* AI xulosasi */}
      {!aiLoad && aiAnalysis?.analysis?.summary && (
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
      )}

      {/* ── SECTION 2: E'tibor kerak ─────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">E'tibor kerak</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lead statuslari */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Lead statuslari
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leadsLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-5 w-full" />)}</div> :
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
                <ShoppingCart className="w-4 h-4 text-green-500" />
                So'nggi bitimlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dealsLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full" />)}</div> :
               deals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Bitim yo'q</p> : (
                <div className="space-y-2">
                  {(Array.isArray(deals) ? deals : []).slice(0, 5).map(d => (
                    <div key={d.id} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate max-w-[140px] text-muted-foreground" title={d.title}>{d.title}</span>
                      <span className="font-semibold text-green-600 shrink-0 ml-2">
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
                <Package className="w-4 h-4 text-orange-500" />
                Invoicelar
                <Badge variant="outline" className="ml-auto text-xs">{invoices.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invLoad ? <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-8 w-full" />)}</div> :
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

      {/* ── SECTION 3: Tahlil va tavsiyalar ─────────────────── */}
      {!aiLoad && aiAnalysis?.analysis && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Tahlil</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />Asosiy xulosalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(aiAnalysis.analysis.keyInsights || []).map((s, i) => (
                    <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" />Tavsiyalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(aiAnalysis.analysis.recommendations || []).map((r, i) => (
                    <li key={`k-${i}`} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Tezkor harakatlar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link href="/crm-workspace">CRM Workspace</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/sd/sales-management">Buyurtmalar</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/sd/dashboard/quota">Kvota</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/sd/dashboard/overview">Overview</Link></Button>
      </div>
    </div>
  );
}
