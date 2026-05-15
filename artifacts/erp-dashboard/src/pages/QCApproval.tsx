/**
 * @module QCApproval
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { QCOrder, QCTestResult } from "./QCApprovalTypes";
import { QCApprovalHeader, QCOrdersList } from "./QCApprovalSections";
import { useTranslation } from '@/lib/i18n';
import {
  InspectorSubmitDialog,
  ApprovalDialog,
  RejectDialog,
  TestInputDialog,
} from "./QCApprovalDialogs";

export default function QCApproval() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  // ─── Selected order & dialog visibility ─────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<QCOrder | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [inspectorSubmitDialog, setInspectorSubmitDialog] = useState(false);

  // ─── Shared text inputs ──────────────────────────────────────────────────────
  const [comments, setComments] = useState("");
  const [inspectorTestId, setInspectorTestId] = useState("");

  // ─── QC checklist (TZ_04 / 04-02) ───────────────────────────────────────────
  const [visualOk, setVisualOk] = useState(false);
  const [dimensionsOk, setDimensionsOk] = useState(false);
  const [printOk, setPrintOk] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);
  const allChecked = visualOk && dimensionsOk && printOk && packagingOk;

  // ─── Test inputs ─────────────────────────────────────────────────────────────
  const [testInputs, setTestInputs] = useState<Record<string, Record<string, string>>>({});
  const [activeTestCategory, setActiveTestCategory] = useState("physical");

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const { data: orders = [], isLoading } = useQuery<QCOrder[]>({
    queryKey: ["/api/qc/pending/qc"],
    queryFn: async () => {
      const res = (await apiRequest('GET', "/api/qc/pending/qc")) as unknown as Response;
      if (!res.ok) throw new Error("Failed to fetch orders");
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    },
  });

  const { data: testResults = [] } = useQuery<QCTestResult[]>({
    queryKey: ["/api/qc/tests", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return [];
      const res = (await apiRequest('GET', `/api/qc/tests/${selectedOrder.id}`)) as unknown as Response;
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedOrder?.id,
  });

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const inspectorSubmitMutation = useMutation({
    mutationFn: async ({ orderId, qcTestId }: { orderId: string; qcTestId: string }) => {
      return apiRequest("PATCH", `/api/qc/inspector-submit/${orderId}`, { qcTestId, comments });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Inspeksiya yuborildi — QC menejer ko'rib chiqishini kutmoqda" });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/pending/qc"] });
      setInspectorSubmitDialog(false);
      setSelectedOrder(null);
      setComments("");
      setInspectorTestId("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("PATCH", `/api/qc/approve/qc/${orderId}`, {
        comments,
        materialApproved: true,
        visualOk,
        dimensionsOk,
        printOk,
        packagingOk,
      });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "QC tasdiqlandi, rejalashtirish bosqichiga o'tdi" });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/pending/qc"] });
      setApprovalDialog(false);
      setSelectedOrder(null);
      setComments("");
      setVisualOk(false);
      setDimensionsOk(false);
      setPrintOk(false);
      setPackagingOk(false);
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/qc/reject/${orderId}`, { stage: "qc", rejectionReason: comments, comments });
    },
    onSuccess: () => {
      toast({ title: "Rad etildi", description: "Buyurtma qaytarildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/pending/qc"] });
      setRejectDialog(false);
      setSelectedOrder(null);
      setComments("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const saveTestsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("Buyurtma tanlanmagan");
      const results = Object.entries(testInputs[activeTestCategory] || {})
        .filter(([, val]) => val.trim())
        .map(([parameter, value]) => ({
          parameterId: parameter,
          value,
          status: "passed" as const,
          deviation: 0,
        }));
      if (results.length === 0) throw new Error("Kamida bitta test natijasi kiriting");
      const today = new Date().toISOString().split("T")[0];
      const result = await apiRequest("POST", `/api/qc/tests`, {
        orderId: selectedOrder.id,
        testCategory: activeTestCategory,
        testDate: today,
        testResults: results,
        overallStatus: "pending",
      }) as { id?: string };
      return result;
    },
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyat", description: "Test natijalari saqlandi. Inspeksiyani yakunlash uchun testni yuboring." });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/tests", selectedOrder?.id] });
      if (data?.id) setInspectorTestId(String(data.id));
      setTestDialog(false);
      setTestInputs({});
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  // ─── Derived state ───────────────────────────────────────────────────────────

  const safeOrders = Array.isArray(orders) ? orders : [];
  const pendingQcOrders = safeOrders.filter(o => o.status === "pending_qc");
  const pendingReviewOrders = safeOrders.filter(o => o.status === "pending_review");

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleView = (order: QCOrder) => { setSelectedOrder(order); setApprovalDialog(true); };
  const handleTest = (order: QCOrder) => { setSelectedOrder(order); setTestDialog(true); };
  const handleInspectorSubmit = (order: QCOrder) => { setSelectedOrder(order); setInspectorSubmitDialog(true); };
  const handleApprove = (order: QCOrder) => { setSelectedOrder(order); setApprovalDialog(true); };
  const handleReject = (order: QCOrder) => { setSelectedOrder(order); setRejectDialog(true); };

  const handleTestInputChange = (category: string, param: string, value: string) => {
    setTestInputs(prev => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [param]: value },
    }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div className="p-6">{t("Yuklanmoqda...")}</div>;
  }

  // Suppress unused-variable warning for testResults (kept for future use / query cache)
  void testResults;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <QCApprovalHeader
        pendingQcCount={pendingQcOrders.length}
        pendingReviewCount={pendingReviewOrders.length}
      />

      <QCOrdersList
        orders={safeOrders}
        onView={handleView}
        onTest={handleTest}
        onInspectorSubmit={handleInspectorSubmit}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <InspectorSubmitDialog
        open={inspectorSubmitDialog}
        onOpenChange={setInspectorSubmitDialog}
        selectedOrder={selectedOrder}
        inspectorTestId={inspectorTestId}
        onInspectorTestIdChange={setInspectorTestId}
        comments={comments}
        onCommentsChange={setComments}
        isPending={inspectorSubmitMutation.isPending}
        onSubmit={() => selectedOrder && inspectorSubmitMutation.mutate({ orderId: selectedOrder.id, qcTestId: inspectorTestId })}
      />

      <ApprovalDialog
        open={approvalDialog}
        onOpenChange={setApprovalDialog}
        selectedOrder={selectedOrder}
        comments={comments}
        onCommentsChange={setComments}
        visualOk={visualOk}
        onVisualOkChange={setVisualOk}
        dimensionsOk={dimensionsOk}
        onDimensionsOkChange={setDimensionsOk}
        printOk={printOk}
        onPrintOkChange={setPrintOk}
        packagingOk={packagingOk}
        onPackagingOkChange={setPackagingOk}
        allChecked={allChecked}
        isPending={approveMutation.isPending}
        onApprove={() => selectedOrder && approveMutation.mutate(selectedOrder.id)}
      />

      <RejectDialog
        open={rejectDialog}
        onOpenChange={setRejectDialog}
        selectedOrder={selectedOrder}
        comments={comments}
        onCommentsChange={setComments}
        isPending={rejectMutation.isPending}
        onReject={() => selectedOrder && rejectMutation.mutate(selectedOrder.id)}
      />

      <TestInputDialog
        open={testDialog}
        onOpenChange={setTestDialog}
        selectedOrder={selectedOrder}
        testInputs={testInputs}
        onTestInputChange={handleTestInputChange}
        onCategoryChange={setActiveTestCategory}
        isPending={saveTestsMutation.isPending}
        onSave={() => saveTestsMutation.mutate()}
      />
    </div>
  );
}
