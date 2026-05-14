/**
 * @module Customer360View
 * @description React UI component.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, Building2, User, ArrowLeft, Phone, Mail, MapPin,
  ShoppingCart, Wallet, MessageSquare, ShieldAlert, BarChart3, TrendingUp,
  Swords, FileText, Target, Calendar, CreditCard, Hash,
} from "lucide-react";
import { BasicTab } from "./BasicTab";
import { OrdersTab } from "./OrdersTab";
import { FinanceTab } from "./FinanceTab";
import { CommunicationsTab } from "./CommunicationsTab";
import { ComplaintsTab } from "./ComplaintsTab";
import { SegmentationTab } from "./SegmentationTab";
import { GrowthTab } from "./GrowthTab";
import { CompetitorsTab } from "./CompetitorsTab";
import { ContractsTab } from "./ContractsTab";
import { LtvTab } from "./LtvTab";
import { fmtMoney } from "./helpers";
import { useTranslation } from '@/lib/i18n';

const TABS = [
  { value: "basic", label: "Asosiy", icon: Building2 },
  { value: "orders", label: "Buyurtmalar", icon: ShoppingCart },
  { value: "finance", label: "Moliya", icon: Wallet },
  { value: "communications", label: "Muloqot", icon: MessageSquare },
  { value: "complaints", label: "Shikoyatlar", icon: ShieldAlert },
  { value: "segmentation", label: "ABC", icon: BarChart3 },
  { value: "growth", label: "Rivojlanish", icon: TrendingUp },
  { value: "competitors", label: "Raqobat", icon: Swords },
  { value: "contracts", label: "Shartnomalar", icon: FileText },
  { value: "ltv", label: "LTV", icon: Target },
];

const SEG_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  A: { bg: "", text: "text-[var(--ep-green)] dark:text-emerald-300", ring: "ring-emerald-500/30" },
  B: { bg: "", text: "text-[var(--ep-blue)] dark:text-sky-300", ring: "ring-sky-500/30" },
  C: { bg: "", text: "text-[var(--ep-yellow)] dark:text-amber-300", ring: "ring-amber-500/30" },
  D: { bg: "", text: "text-[var(--ep-red)] dark:text-rose-300", ring: "ring-rose-500/30" },
};

const SEG_LABELS: Record<string, string> = { A: "VIP", B: "Doimiy", C: "Oddiy", D: "Xavfli" };

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktiv", cls: "bg-emerald-100 text-[var(--ep-green)] dark:bg-emerald-900/50 dark:text-emerald-300" },
  inactive: { label: "Nofaol", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  blacklist: { label: "Qora ro'yxat", cls: "bg-rose-100 text-[var(--ep-red)] dark:bg-rose-900/50 dark:text-rose-300" },
};

export function Customer360View({ customerId, onBack }: { customerId: number; onBack: () => void }) {
  const { t } = useTranslation("common");
  const { data, isLoading } = useQuery({
    queryKey: ["/api/sd/customers", customerId, "360"],
    queryFn: () => apiRequest("GET", `/api/sd/customers/${customerId}/360`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-medium">{data?.error || "Ma'lumot yuklanmadi"}</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />{t("back")}
        </Button>
      </div>
    );
  }

  const basic = data.basic || {};
  const seg = basic.customerCategory || "C";
  const segColor = SEG_COLORS[seg] || SEG_COLORS.C;
  const statusConf = STATUS_LABELS[basic.status || "active"] || STATUS_LABELS.active;
  const phones = (basic.phones as { value: string }[] | null) || [];
  const emails = (basic.emails as { value: string }[] | null) || [];
  const primaryPhone = phones[0]?.value;
  const primaryEmail = emails[0]?.value;

  // Quick stats from finance/orders
  const totalOrders = data.finance?.totalOrders || data.orders?.totalCount || 0;
  const totalRevenue = data.finance?.totalRevenue || data.ltv?.lifetimeValue || 0;
  const openDebt = data.finance?.openDebt || 0;

  return (
    <div className="space-y-4">
      {/* ── Hero Header Card ── */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        {/* Gradient accent */}
        <div className={`absolute inset-x-0 top-0 h-1 ${segColor.bg}`} />

        <div className="p-4 lg:p-5">
          {/* Top row: back + status */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground -ml-2"
              data-testid="btn-back-to-list">
              <ArrowLeft className="h-4 w-4 mr-1" />{t("royxatga")}
            </Button>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConf.cls}`}>{statusConf.label}</span>
            </div>
          </div>

          {/* Main info row */}
          <div className="flex items-start gap-4 flex-wrap">
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-xl ${segColor.bg} flex items-center justify-center shadow-lg ring-4 ${segColor.ring} shrink-0`}>
              {basic.customerType === "individual"
                ? <User className="h-7 w-7 text-white" />
                : <Building2 className="h-7 w-7 text-white" />}
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight truncate">{basic.title || basic.name || "Nomsiz"}</h2>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ring-1
                  ${SEG_COLORS[seg]?.ring || ""} ${SEG_COLORS[seg]?.text || ""} bg-white/80 dark:bg-black/30`}>
                  {seg} — {SEG_LABELS[seg] || "Oddiy"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap text-sm text-muted-foreground">
                {basic.stir && (
                  <span className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />STIR: {basic.stir}
                  </span>
                )}
                {basic.customerCode && (
                  <code className="text-xs bg-muted px-2 py-0.5 rounded-md font-mono">{basic.customerCode}</code>
                )}
                {primaryPhone && (
                  <a href={`tel:${primaryPhone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Phone className="h-3.5 w-3.5" />{primaryPhone}
                  </a>
                )}
                {primaryEmail && (
                  <a href={`mailto:${primaryEmail}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5" />{primaryEmail}
                  </a>
                )}
                {basic.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{basic.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t">
            {[
              { label: "Buyurtmalar", value: String(totalOrders), icon: ShoppingCart, color: "text-[var(--ep-blue)]" },
              { label: "Jami daromad", value: fmtMoney(totalRevenue), icon: TrendingUp, color: "text-[var(--ep-green)]" },
              { label: "Ochiq qarz", value: fmtMoney(openDebt), icon: CreditCard, color: openDebt > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]" },
              { label: "Kredit limiti", value: fmtMoney(basic.creditLimit || 0), icon: Wallet, color: "text-[var(--ep-purple)]" },
            ].map(kpi => (
              <div key={kpi.label} className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-sm font-bold">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="basic" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="inline-flex w-max gap-0.5 h-auto p-1 bg-muted/60 rounded-xl">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                data-testid={`tab-${t.value}`}>
                <t.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-3">
          <TabsContent value="basic">
            <BasicTab data={basic} contacts={data.contacts || []} decisionMakers={data.decisionMakers || []} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab orders={data.orders} />
          </TabsContent>
          <TabsContent value="finance">
            <FinanceTab finance={data.finance} />
          </TabsContent>
          <TabsContent value="communications">
            <CommunicationsTab customerId={customerId} communications={data.communications} sentiment={data.sentiment} nps={data.nps} />
          </TabsContent>
          <TabsContent value="complaints">
            <ComplaintsTab customerId={customerId} complaints={data.complaints} />
          </TabsContent>
          <TabsContent value="segmentation">
            <SegmentationTab segmentation={data.segmentation} journey={data.journey} internalIntelligence={data.internalIntelligence} />
          </TabsContent>
          <TabsContent value="growth">
            <GrowthTab growth={data.growth} />
          </TabsContent>
          <TabsContent value="competitors">
            <CompetitorsTab customerId={customerId} competitors={data.competitors} />
          </TabsContent>
          <TabsContent value="contracts">
            <ContractsTab customerId={customerId} contracts={data.contracts} />
          </TabsContent>
          <TabsContent value="ltv">
            <LtvTab ltv={data.ltv} orders={data.orders} predictive={data.predictive} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
