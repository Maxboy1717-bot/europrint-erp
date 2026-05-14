/**
 * @module SDDashboard
 * @description React page component. Route-level UI.
 * State management, hooks, and orchestration only — sections live in SDDashboardSections.tsx.
 */

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { CrmDashboardAnalysis, Deal, Invoice, Lead } from "./SDDashboardTypes";
import { useTranslation } from '@/lib/i18n';
import {
  KpiSection,
  AiSummaryCard,
  AttentionSection,
  AiAnalysisSection,
} from "./SDDashboardSections";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SDDashboard() {
  const { t } = useTranslation('common');
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
  const healthColor = health === "yaxshi" ? "text-[var(--ep-green)] bg-green-50" :
    health === "yomon" ? "text-[var(--ep-red)] bg-red-50" : "text-[var(--ep-yellow)] bg-amber-50";

  const leadsByStatus: Record<string, number> = {};
  (Array.isArray(leads) ? leads : []).forEach(l => {
    const k = String(l.statusId ?? "yangi");
    leadsByStatus[k] = (leadsByStatus[k] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
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

      <KpiSection
        stats={stats}
        pipelineValue={pipelineValue}
        convRate={convRate}
        loading={loading}
      />

      <AiSummaryCard aiLoad={aiLoad} aiAnalysis={aiAnalysis} />

      <AttentionSection
        leads={leads}
        deals={deals}
        invoices={invoices}
        leadsByStatus={leadsByStatus}
        leadsLoad={leadsLoad}
        dealsLoad={dealsLoad}
        invLoad={invLoad}
      />

      <AiAnalysisSection aiLoad={aiLoad} aiAnalysis={aiAnalysis} />

      {/* Tezkor harakatlar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link href="/crm-workspace">CRM Workspace</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/sd/sales-management">Buyurtmalar</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/sd/dashboard/quota">Kvota</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/sd/dashboard/overview">{t('overview')}</Link></Button>
      </div>
    </div>
  );
}
