/**
 * @module SupplyChainDashboard
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import type { GoodsReceipt, PurchaseOrder, ThreeWayMatchResult, VendorInvoice } from "./SupplyChainDashboardTypes";
import { AlertsSection, GRNColumn, InvoiceColumn, POColumn, SummaryCards } from "./SupplyChainDashboardSections";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function SupplyChainDashboard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [matchResults, setMatchResults] = useState<Record<string | number, ThreeWayMatchResult>>({});
  const [matchingId, setMatchingId] = useState<string | number | null>(null);
  const [payingId, setPayingId] = useState<string | number | null>(null);

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/supply-chain/refresh", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supply-chain"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mm/purchase-orders/pending-receipt"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mm/goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({ title: "Yangilandi", description: "Ta'minot zanjiri ma'lumotlari yangilandi." });
    },
    onError: () => toast({ title: "Xatolik", description: "Yangilashda xatolik yuz berdi.", variant: "destructive" }),
  });

  const { data: pendingPOs = [], isLoading: loadingPOs } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/mm/purchase-orders/pending-receipt"],
  });

  const { data: goodsReceipts = [], isLoading: loadingGRs } = useQuery<GoodsReceipt[]>({
    queryKey: ["/api/mm/goods-receipts"],
  });

  const { data: vendorInvoices = [], isLoading: loadingInvoices } = useQuery<VendorInvoice[]>({
    queryKey: ["/api/mm/vendor-invoices"],
  });

  const matchMutation = useMutation({
    mutationFn: async (invoiceId: string | number) => {
      setMatchingId(invoiceId);
      return await apiRequest("POST", `/api/mm/3way-match/${invoiceId}`, { tolerance: 2 });
    },
    onSuccess: (data: ThreeWayMatchResult, invoiceId) => {
      setMatchResults((prev) => ({ ...prev, [invoiceId]: data }));
      setMatchingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({
        title: data.isMatched ? "3-Way Match muvaffaqiyatli" : "3-Way Match farqlari aniqlandi",
        description: data.isMatched ? "Barcha hujjatlar mos keldi" : `${data.deviations.length} ta farq aniqlandi`,
        variant: data.isMatched ? "default" : "destructive",
      });
    },
    onError: (err) => {
      setMatchingId(null);
      toast({ title: "Xatolik", description: String(err), variant: "destructive" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string | number; status: string }) => {
      setPayingId(invoiceId);
      return await apiRequest("POST", `/api/mm/vendor-invoices/${invoiceId}/payment`, { status });
    },
    onSuccess: (_data, { invoiceId: _id }) => {
      setPayingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({ title: "Holat yangilandi", description: "Faktura holati muvaffaqiyatli o'zgartirildi" });
    },
    onError: (err) => {
      setPayingId(null);
      toast({ title: "Xatolik", description: String(err), variant: "destructive" });
    },
  });

  const safePOs = Array.isArray(pendingPOs) ? pendingPOs : [];
  const safeGRs = Array.isArray(goodsReceipts) ? goodsReceipts : [];
  const safeInvoices = Array.isArray(vendorInvoices) ? vendorInvoices : [];

  const pendingMatchInvoices = safeInvoices.filter(
    (inv) => inv.matchStatus === "unmatched" || inv.matchStatus === "mismatch" || inv.matchStatus === "partial_match"
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("taminotZanjiri")}</b></>}
        title={t("taminotZanjiri")}
        subtitle="Xarid tsikli: PO → Qabul (GRN) → Faktura (3-Way Match)"
      />
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="button-supply-chain-refresh"
        >
          {refreshMutation.isPending
            ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            : <RefreshCw className="h-4 w-4 mr-2" />}
          Yangilash
        </Button>
      </div>

      <SummaryCards
        pendingPOs={safePOs}
        goodsReceipts={safeGRs}
        vendorInvoices={safeInvoices}
        pendingMatchCount={pendingMatchInvoices.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <POColumn pendingPOs={safePOs} loading={loadingPOs} />
        <GRNColumn goodsReceipts={safeGRs} loading={loadingGRs} />
        <InvoiceColumn
          vendorInvoices={safeInvoices}
          loading={loadingInvoices}
          matchResults={matchResults}
          matchingId={matchingId}
          payingId={payingId}
          onMatch={(id) => matchMutation.mutate(id)}
          onAdvanceStatus={(invoiceId, status) => paymentMutation.mutate({ invoiceId, status })}
        />
      </div>

      <AlertsSection
        pendingMatchInvoices={pendingMatchInvoices}
        matchingId={matchingId}
        onMatch={(id) => matchMutation.mutate(id)}
      />
    </div>
  );
}
