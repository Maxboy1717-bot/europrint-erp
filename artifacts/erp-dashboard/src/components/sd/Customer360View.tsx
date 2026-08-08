/**
 * @module Customer360View
 * @description React UI component.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, Building2, User, ArrowLeft, Phone, Mail, MapPin,
  ShoppingCart, Wallet, MessageSquare, ShieldAlert, BarChart3, TrendingUp,
  Swords, FileText, Target, Calendar, CreditCard, Hash, Pencil,
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
  { value: "basic",          labelKey: "360.tab.basic",          labelDefault: "Asosiy",       icon: Building2 },
  { value: "orders",         labelKey: "360.tab.orders",         labelDefault: "Buyurtmalar",  icon: ShoppingCart },
  { value: "finance",        labelKey: "360.tab.finance",        labelDefault: "Moliya",       icon: Wallet },
  { value: "communications", labelKey: "360.tab.communications", labelDefault: "Muloqot",      icon: MessageSquare },
  { value: "complaints",     labelKey: "360.tab.complaints",     labelDefault: "Shikoyatlar",  icon: ShieldAlert },
  { value: "segmentation",   labelKey: "360.tab.segmentation",   labelDefault: "ABC",          icon: BarChart3 },
  { value: "growth",         labelKey: "360.tab.growth",         labelDefault: "Rivojlanish",  icon: TrendingUp },
  { value: "competitors",    labelKey: "360.tab.competitors",    labelDefault: "Raqobat",      icon: Swords },
  { value: "contracts",      labelKey: "360.tab.contracts",      labelDefault: "Shartnomalar", icon: FileText },
  { value: "ltv",            labelKey: "360.tab.ltv",            labelDefault: "LTV",          icon: Target },
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
  blacklisted: { label: "Qora ro'yxat", cls: "bg-rose-100 text-[var(--ep-red)] dark:bg-rose-900/50 dark:text-rose-300" },
};

import type {
  SdBasicData,
  SdContactItem,
  SdDecisionMaker,
  SdOrdersData,
  SdFinanceData,
  SdCommunicationsData,
  SdComplaintsData,
  SdSegmentationData,
  SdGrowthData,
  SdCompetitorsData,
  SdContractsData,
  SdLtvData,
  SdNpsData,
  SdSentimentData,
  SdJourneyData,
  SdPredictiveData,
  SdInternalIntelligenceData,
} from "./sd-types";

interface Customer360Data {
  error?: string;
  basic?: SdBasicData;
  finance?: SdFinanceData;
  orders?: SdOrdersData;
  ltv?: SdLtvData;
  contacts?: SdContactItem[];
  decisionMakers?: SdDecisionMaker[];
  communications?: SdCommunicationsData;
  sentiment?: SdSentimentData;
  nps?: SdNpsData;
  complaints?: SdComplaintsData;
  segmentation?: SdSegmentationData;
  journey?: SdJourneyData;
  internalIntelligence?: SdInternalIntelligenceData;
  growth?: SdGrowthData;
  competitors?: SdCompetitorsData;
  contracts?: SdContractsData;
  predictive?: SdPredictiveData;
}

export function Customer360View({ customerId, onBack }: { customerId: number; onBack: () => void }) {
  const { t } = useTranslation("common");
  const { t: tSd } = useTranslation("sd");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInternalEdit, setShowInternalEdit] = useState(false);
  const [relQuality, setRelQuality] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [shareOfWallet, setShareOfWallet] = useState("");

  const updateInternalMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/sd/customers/${customerId}/internal`, {
        relationship_quality: relQuality || undefined,
        internal_notes: internalNotes.trim() || undefined,
        share_of_wallet: shareOfWallet ? Number(shareOfWallet) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/customers", customerId, "360"] });
      toast({ title: t("sd.internalUpdated", "Ichki ma'lumot yangilandi") });
      setShowInternalEdit(false);
    },
    onError: () => toast({ title: t("error", "Xatolik"), variant: "destructive" }),
  });

  const { data, isLoading } = useQuery<Customer360Data>({
    queryKey: ["/api/sd/customers", customerId, "360"],
    queryFn: () => apiRequest<Customer360Data>("GET", `/api/sd/customers/${customerId}/360`),
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

  const basic = (data.basic || {}) as SdBasicData;
  const seg = basic.customerCategory || "C";
  const segColor = SEG_COLORS[seg] || SEG_COLORS.C;
  const statusConf = STATUS_LABELS[basic.status || "active"] || STATUS_LABELS.active;
  const phones = (basic.phones as { value: string }[] | null) || [];
  const emails = (basic.emails as { value: string }[] | null) || [];
  const primaryPhone = phones[0]?.value;
  const primaryEmail = emails[0]?.value;

  // Quick stats from finance/orders
  const totalOrders = (data.finance?.totalOrders || data.orders?.totalCount || 0) as number;
  const totalRevenue = (data.finance?.totalRevenue || data.ltv?.lifetimeValue || 0) as number;
  const openDebt = (data.finance?.openDebt || 0) as number;

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
                <h2 className="text-xl font-bold tracking-tight truncate">{String(basic.title || basic.name || "Nomsiz")}</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t">
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
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                data-testid={`tab-${tab.value}`}>
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tSd(tab.labelKey, tab.labelDefault)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-3">
          <TabsContent value="basic">
            <BasicTab data={basic} contacts={(data.contacts || []) as SdContactItem[]} decisionMakers={(data.decisionMakers || []) as SdDecisionMaker[]} customerId={customerId} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab orders={data.orders as SdOrdersData} />
          </TabsContent>
          <TabsContent value="finance">
            <FinanceTab finance={data.finance as SdFinanceData} />
          </TabsContent>
          <TabsContent value="communications">
            <CommunicationsTab customerId={customerId} communications={data.communications as SdCommunicationsData} sentiment={data.sentiment as unknown as Parameters<typeof CommunicationsTab>[0]["sentiment"]} nps={data.nps} />
          </TabsContent>
          <TabsContent value="complaints">
            <ComplaintsTab customerId={customerId} complaints={data.complaints as SdComplaintsData} />
          </TabsContent>
          <TabsContent value="segmentation">
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const ii = data.internalIntelligence;
                    setRelQuality(ii?.relationshipQuality || "");
                    setInternalNotes("");
                    setShareOfWallet("");
                    setShowInternalEdit(true);
                  }}
                  data-testid="button-edit-internal"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  {t("sd.editInternal", "Ichki ma'lumot")}
                </Button>
              </div>
              <SegmentationTab segmentation={data.segmentation as SdSegmentationData} journey={data.journey as unknown as Parameters<typeof SegmentationTab>[0]["journey"]} internalIntelligence={data.internalIntelligence} />
            </div>
          </TabsContent>
          <TabsContent value="growth">
            <GrowthTab growth={data.growth as SdGrowthData} />
          </TabsContent>
          <TabsContent value="competitors">
            <CompetitorsTab customerId={customerId} competitors={data.competitors as SdCompetitorsData} />
          </TabsContent>
          <TabsContent value="contracts">
            <ContractsTab customerId={customerId} contracts={data.contracts as SdContractsData} />
          </TabsContent>
          <TabsContent value="ltv">
            <LtvTab ltv={data.ltv as SdLtvData} orders={data.orders as SdOrdersData} predictive={data.predictive as unknown as Parameters<typeof LtvTab>[0]["predictive"]} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Internal intelligence edit dialog */}
      <Dialog open={showInternalEdit} onOpenChange={(open) => { if (!open) setShowInternalEdit(false); }}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              {t("sd.editInternalTitle", "Ichki ma'lumotni tahrirlash")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("sd.relationshipQuality", "Munosabat sifati")}</Label>
              <Select value={relQuality} onValueChange={setRelQuality}>
                <SelectTrigger className="h-9" data-testid="select-rel-quality">
                  <SelectValue placeholder={t("sd.selectQuality", "Tanlang...")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">{t("sd.excellent", "A'lo")}</SelectItem>
                  <SelectItem value="good">{t("sd.good", "Yaxshi")}</SelectItem>
                  <SelectItem value="neutral">{t("sd.neutral", "Neytral")}</SelectItem>
                  <SelectItem value="difficult">{t("sd.difficult", "Qiyin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-of-wallet">{t("sd.shareOfWallet", "Hamyon ulushi (%)")}</Label>
              <Input
                id="share-of-wallet"
                type="number"
                min="0"
                max="100"
                step="1"
                value={shareOfWallet}
                onChange={e => setShareOfWallet(e.target.value)}
                placeholder="0–100"
                data-testid="input-share-of-wallet"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internal-notes">{t("sd.internalNotes", "Ichki izoh")}</Label>
              <Textarea
                id="internal-notes"
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder={t("sd.internalNotesPlaceholder", "Ichki ma'lumot, xavf omillar...")}
                className="min-h-[80px]"
                data-testid="input-internal-notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInternalEdit(false)} data-testid="button-cancel-internal">
                {t("cancel", "Bekor")}
              </Button>
              <Button
                onClick={() => updateInternalMutation.mutate()}
                disabled={updateInternalMutation.isPending}
                data-testid="button-save-internal"
              >
                {updateInternalMutation.isPending ? t("saving", "Saqlanmoqda...") : t("save", "Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
