/**
 * @module TechApproval
 * @description Route-level orchestrator for the Technologist Approval page.
 *              Manages page state, data fetching, approve/reject mutations,
 *              and composes sub-modules: TechApprovalOrderCard, ApprovalDialog,
 *              RejectDialog, HistoryDialog, and QCheckDialog.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { CheckCircle, Clock, Cpu, History } from "lucide-react";
import { QCheckDialog, type QCheckResult } from "@/components/QCheckDialog";
import { useTranslation } from "@/lib/i18n";
import { TechApprovalOrderCard } from "./TechApprovalOrderCard";
import { ApprovalDialog, RejectDialog, HistoryDialog } from "./TechApprovalDialogs";
import type { TechOrderData, ApprovalTab, ReturnTarget } from "./TechApprovalTypes";
import { EPPageHeader } from "@/components/ep";

// ─── Page component ───────────────────────────────────────────────────────────

export default function TechApproval() {
  const { toast } = useToast();
  const { t } = useTranslation("ai");

  // ── Dialog visibility ──
  const [selectedOrder, setSelectedOrder] = useState<TechOrderData | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);

  // ── Approval form state ──
  const [comments, setComments] = useState("");
  const [bomApproved, setBomApproved] = useState(false);
  const [routingApproved, setRoutingApproved] = useState(false);
  const [techCardApproved, setTechCardApproved] = useState(false);
  const [activeTab, setActiveTab] = useState<ApprovalTab>("approval");

  // ── Reject form state ──
  const [rejectReason, setRejectReason] = useState("");
  const [returnTo, setReturnTo] = useState<ReturnTarget>("manager");

  // ── QCheck state ──
  const [qcheckOpen, setQcheckOpen] = useState(false);
  const [qcheckResult, setQcheckResult] = useState<QCheckResult | null>(null);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const allChecked = bomApproved && routingApproved && techCardApproved;

  const resetForm = () => {
    setBomApproved(false);
    setRoutingApproved(false);
    setTechCardApproved(false);
    setComments("");
  };

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: rawOrders, isLoading } = useQuery<unknown>({
    queryKey: ["/api/papka-orders", { status: "pending_tech" }],
    queryFn: async () => {
      const d = await apiRequest<unknown>('GET', "/api/papka-orders?status=pending_tech");
      if (Array.isArray(d)) return d;
      const obj = d as { items?: unknown; data?: unknown; orders?: unknown };
      return obj.items ?? obj.data ?? obj.orders ?? [];
    },
  });
  const orders: TechOrderData[] = Array.isArray(rawOrders) ? rawOrders : [];

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Task #1: Endpoint tuzatildi — `/api/technology/orders/:id/approve`
  const approveMutation = useMutation({
    mutationFn: async (orderId: string) =>
      apiRequest("POST", `/api/technology/orders/${orderId}/approve`, {
        bomApproved, routingApproved, techCardApproved, notes: comments,
      }),
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "3-checkpoint tasdiqlandi. Avans nazorati boshlanmoqda" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setApprovalDialog(false);
      setSelectedOrder(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  // Task #3: Endpoint tuzatildi — `/api/technology/orders/:id/reject` + returnTo
  const rejectMutation = useMutation({
    mutationFn: async (orderId: string) =>
      apiRequest("POST", `/api/technology/orders/${orderId}/reject`, { reason: rejectReason, returnTo }),
    onSuccess: () => {
      toast({ title: "Rad etildi", description: "Buyurtma qaytarildi. Menejerga Telegram signal yuborildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setRejectDialog(false);
      setSelectedOrder(null);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const prepressMutation = useMutation<QCheckResult, Error, { orderId: string; surveyFields: Record<string, unknown> }>({
    mutationFn: ({ orderId, surveyFields }) =>
      apiRequest("POST", "/api/ai-agents/prepress/tech-card", { orderId, surveyFields }),
    onSuccess: (data) => { setQcheckResult(data); setQcheckOpen(true); },
    onError: () => {
      toast({ title: t("qcheck.errorTitle"), description: t("qcheck.errorDesc"), variant: "destructive" });
    },
  });

  function handlePrepressCommit(result: QCheckResult) {
    setQcheckOpen(false);
    toast({
      title: result.autoExecuted ? t("qcheck.commitAutoTitle") : t("qcheck.commitManualTitle"),
      description: t("qcheck.commitDesc", { orderId: result.orderId, pct: Math.round(result.confidence * 100) }),
    });
    void queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
  }

  function handleTechCard(order: TechOrderData) {
    prepressMutation.mutate({
      orderId: order.id,
      surveyFields: {
        print_tech:           order.mahsulotTuri ?? "ofset",
        paper_type:           "kunsht",
        paper_gsm:            150,
        dimensions_mm:        `${order.formatA ?? 0}x${order.formatB ?? 0}`,
        colors_front:         4,
        colors_back:          0,
        finishing:            "laminatsiya",
        qty_ordered:          order.tiraj ?? 1000,
        delivery_deadline:    order.tayyorBolishSanasi ?? "",
        special_requirements: "",
      },
    });
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => <div key={`k-${i}`} className="h-28 bg-muted rounded-lg animate-pulse" />)}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" data-testid="page-tech-approval">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu className="h-8 w-8 text-primary" />
        </div>
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("texnologTasdiqlash")}</b></>}
        title={t("texnologTasdiqlash")}
        subtitle={t("k3CheckpointTasdiqlashAiTahlil")}
      />
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate rounded-full px-4 py-1 text-sm font-semibold">
          <Clock className="h-4 w-4 mr-2" />
          Kutilmoqda: {orders.length}
        </Badge>
        <div className="flex-1" />
        <Button
          size="sm" variant="outline"
          onClick={() => { setSelectedOrder(null); setHistoryDialog(true); }}
          data-testid="button-view-history"
        >
          <History className="h-4 w-4 mr-1" />
          {t("tarixKorish")}
        </Button>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <Card className="bg-card rounded-lg border-none shadow-none">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
            <p className="text-lg font-medium text-foreground">{t("tasdiqlashKutayotganBuyurtmalarYoq")}</p>
            <p className="text-muted-foreground">{t("barchaBuyurtmalarKoribChiqilgan")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(orders) ? orders : []).map((order: TechOrderData) => (
            <TechApprovalOrderCard
              key={order.id}
              order={order}
              techCardLabel={t("qcheck.techCardBtn")}
              isPrepressPending={prepressMutation.isPending}
              onHistory={(o) => { setSelectedOrder(o); setHistoryDialog(true); }}
              onTechCard={handleTechCard}
              onReject={(o) => { setSelectedOrder(o); setRejectReason(""); setRejectDialog(true); }}
              onApprove={(o) => { setSelectedOrder(o); resetForm(); setActiveTab("ai"); setApprovalDialog(true); }}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <ApprovalDialog
        open={approvalDialog}
        onOpenChange={setApprovalDialog}
        selectedOrder={selectedOrder}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bomApproved={bomApproved}
        routingApproved={routingApproved}
        techCardApproved={techCardApproved}
        onBomChange={setBomApproved}
        onRoutingChange={setRoutingApproved}
        onTechCardChange={setTechCardApproved}
        comments={comments}
        onCommentsChange={setComments}
        allChecked={allChecked}
        isPending={approveMutation.isPending}
        onConfirm={() => selectedOrder && approveMutation.mutate(selectedOrder.id)}
      />

      <RejectDialog
        open={rejectDialog}
        onOpenChange={setRejectDialog}
        selectedOrder={selectedOrder}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        returnTo={returnTo}
        onReturnToChange={setReturnTo}
        isPending={rejectMutation.isPending}
        onConfirm={() => selectedOrder && rejectMutation.mutate(selectedOrder.id)}
      />

      <HistoryDialog
        open={historyDialog}
        onOpenChange={setHistoryDialog}
        selectedOrder={selectedOrder}
      />

      <QCheckDialog
        open={qcheckOpen}
        result={qcheckResult}
        timeout={5}
        onCommit={handlePrepressCommit}
        onCancel={() => setQcheckOpen(false)}
      />
    </div>
  );
}
