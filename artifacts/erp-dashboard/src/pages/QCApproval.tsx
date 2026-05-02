import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, ShieldCheck, Eye, FlaskConical, AlertTriangle, Send } from "lucide-react";

interface QCOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  mahsulotTuri?: string;
  formatA?: number;
  formatB?: number;
  tiraj?: number;
  status: string;
}

interface QCTestResult {
  id: string;
  orderId: string;
  category: string;
  parameter: string;
  result: string;
  status: string;
}

export default function QCApproval() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<QCOrder | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [inspectorSubmitDialog, setInspectorSubmitDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [inspectorTestId, setInspectorTestId] = useState("");
  // TZ_04 (04-02): 4 ta majburiy sifat nazorati checkboxlari
  const [visualOk, setVisualOk] = useState(false);
  const [dimensionsOk, setDimensionsOk] = useState(false);
  const [printOk, setPrintOk] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);
  const allChecked = visualOk && dimensionsOk && printOk && packagingOk;

  // Fetch orders in BOTH pending_qc (awaiting inspector) AND pending_review (awaiting manager)
  const { data: orders = [], isLoading } = useQuery<QCOrder[]>({
    queryKey: ["/api/qc/pending/qc"],
    queryFn: async () => {
      const res = await fetch("/api/qc/pending/qc", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    }
  });

  const { data: testResults = [] } = useQuery<QCTestResult[]>({
    queryKey: ["/api/qc/tests", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return [];
      const res = await fetch(`/api/qc/tests/${selectedOrder.id}`, { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedOrder?.id
  });

  // Inspector submits completed test → moves order to pending_review for manager review
  const inspectorSubmitMutation = useMutation({
    mutationFn: async ({ orderId, qcTestId }: { orderId: string; qcTestId: string }) => {
      return apiRequest("POST", `/api/qc/inspector-submit/${orderId}`, { qcTestId, comments });
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
    }
  });

  // Manager approves order from pending_review → ready_for_planning
  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/qc/approve/qc/${orderId}`, {
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
    }
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
    }
  });

  const [testInputs, setTestInputs] = useState<Record<string, Record<string, string>>>({});
  const [activeTestCategory, setActiveTestCategory] = useState("physical");

  const saveTestsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("Buyurtma tanlanmagan");
      const testResults = Object.entries(testInputs[activeTestCategory] || {})
        .filter(([, val]) => val.trim())
        .map(([parameter, value]) => ({
          parameterId: parameter,
          value,
          status: "passed" as const,
          deviation: 0,
        }));
      if (testResults.length === 0) throw new Error("Kamida bitta test natijasi kiriting");
      const today = new Date().toISOString().split("T")[0];
      const result = await apiRequest("POST", `/api/qc/tests`, {
        orderId: selectedOrder.id,
        testCategory: activeTestCategory,
        testDate: today,
        testResults,
        overallStatus: "pending",
      }) as { id?: string };
      return result;
    },
    onSuccess: (data) => {
      toast({ title: "Muvaffaqiyat", description: "Test natijalari saqlandi. Inspeksiyani yakunlash uchun testni yuboring." });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/tests", selectedOrder?.id] });
      // Pre-fill the test ID for inspector submit
      if (data?.id) setInspectorTestId(String(data.id));
      setTestDialog(false);
      setTestInputs({});
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return <div className="p-6">Yuklanmoqda...</div>;
  }

  const testCategories = [
    { id: "physical", name: "Fizik" },
    { id: "mechanical", name: "Mexanik" },
    { id: "printability", name: "Bosma" },
    { id: "chemical", name: "Kimyoviy" },
    { id: "environmental", name: "Atrof-muhit" },
  ];

  const testParamsByCategory: Record<string, string[]> = {
    physical: ["Qalinlik (mm)", "Gramaj (g/m²)", "Namlik (%)", "Zich'lik"],
    mechanical: ["ECT (kN/m)", "FCT (kN/m)", "BST (kPa)", "CMT (N)"],
    printability: ["Sirt silliqlik", "Oqlik (%)", "Bo'yash sifati", "Rasmlar aniqligi"],
    chemical: ["pH daraja", "Namlik singdirish (%)", "Kimyoviy tarkib"],
    environmental: ["Harorat bardoshligi", "Namlik bardoshligi", "UV bardoshligi"],
  };

  const pendingQcOrders = (Array.isArray(orders) ? orders : []).filter(o => o.status === "pending_qc");
  const pendingReviewOrders = (Array.isArray(orders) ? orders : []).filter(o => o.status === "pending_review");

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Sifat <span className="font-bold text-primary">Tasdiqlash</span>
          </h1>
          <p className="text-on-surface-variant">Sifat nazorati bo'limi - material testlari va tasdiqlash</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-primary-container text-on-primary-container rounded-full px-4 py-1 text-sm font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Inspeksiyada: {pendingQcOrders.length} | Menejer ko'ruvida: {pendingReviewOrders.length}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-lg font-medium text-on-surface">Tasdiqlash kutayotgan buyurtmalar yo'q</p>
          <p className="text-on-surface-variant">Barcha buyurtmalar ko'rib chiqilgan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(orders) ? orders : []).map((order: QCOrder) => (
            <div key={order.id} className="bg-surface-container-lowest rounded-xl p-6" data-testid={`order-card-${order.id}`}>
              <div className="flex flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">{order.papkaNo}</h3>
                  <p className="text-sm text-on-surface-variant">{order.mijozNomi}</p>
                </div>
                <div className="flex gap-2">
                  {order.status === "pending_review" ? (
                    <span className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Menejer ko'ruvi kutilmoqda
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Inspeksiya kutilmoqda
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Mahsulot</p>
                  <p className="font-medium text-on-surface">{order.mahsulotNomi}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Turi</p>
                  <p className="font-medium text-on-surface">{order.mahsulotTuri || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Format</p>
                  <p className="font-medium text-on-surface">{order.formatA} x {order.formatB}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Tiraj</p>
                  <p className="font-medium text-on-surface">{order.tiraj?.toLocaleString()}</p>
                </div>
              </div>

              {order.status === "pending_qc" && (
                <div className="bg-surface-container p-3 rounded-lg mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Test kategoriyalari:</p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(testCategories) ? testCategories : []).map(cat => (
                      <span key={cat.id} className="bg-surface-container-high text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedOrder(order); setApprovalDialog(true); }}
                  data-testid={`btn-view-${order.id}`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ko'rish
                </Button>

                {order.status === "pending_qc" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedOrder(order); setTestDialog(true); }}
                      data-testid={`btn-test-${order.id}`}
                    >
                      <FlaskConical className="h-4 w-4 mr-1" />
                      Test kiritish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedOrder(order); setInspectorSubmitDialog(true); }}
                      data-testid={`btn-inspector-submit-${order.id}`}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Inspeksiyani yakunlash
                    </Button>
                  </>
                )}

                {order.status === "pending_review" && (
                  <Button
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setApprovalDialog(true); }}
                    data-testid={`btn-approve-${order.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Menejer tasdiqlash
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => { setSelectedOrder(order); setRejectDialog(true); }}
                  data-testid={`btn-reject-${order.id}`}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rad etish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspector Submit Dialog */}
      <Dialog open={inspectorSubmitDialog} onOpenChange={setInspectorSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inspeksiyani Yakunlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Test ID ni kiriting. Test bu buyurtmaga tegishli bo'lishi shart. Yuborilgandan so'ng QC menejer ko'rib chiqadi.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">QC Test ID *</label>
              <Input
                placeholder="Test ID kiriting"
                value={inspectorTestId}
                onChange={(e) => setInspectorTestId(e.target.value)}
                data-testid="input-test-id"
              />
            </div>
            <Textarea
              placeholder="Inspeksiya izohi (ixtiyoriy)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              data-testid="input-inspector-comments"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectorSubmitDialog(false)}>Bekor qilish</Button>
            <Button
              onClick={() => selectedOrder && inspectorSubmitMutation.mutate({ orderId: selectedOrder.id, qcTestId: inspectorTestId })}
              disabled={inspectorSubmitMutation.isPending || !inspectorTestId.trim()}
              data-testid="btn-confirm-inspector-submit"
            >
              {inspectorSubmitMutation.isPending ? "Yuklanmoqda..." : "Menejrga yuborish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Approval Dialog (pending_review only) */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.status === "pending_review" ? "QC Menejer Tasdiqlash" : "QC Ko'rish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>

            {selectedOrder?.status !== "pending_review" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <p className="text-sm text-amber-700">Bu buyurtma hali inspeksiya yakunlanishini kutmoqda. Tasdiqlash uchun inspeksiya birinchi yuborilishi kerak.</p>
              </div>
            )}

            {selectedOrder?.status === "pending_review" && (
              <>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Diqqat!</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Barcha 4 ta nazorat nuqtasini tasdiqlang. Aks holda tasdiqlash mumkin emas.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 border rounded-md p-3">
                  <p className="text-sm font-medium text-muted-foreground">Sifat nazorati chek-listasi:</p>
                  <div className="flex items-center gap-2">
                    <Checkbox id="visual-ok" checked={visualOk} onCheckedChange={(v) => setVisualOk(!!v)} data-testid="checkbox-visual" />
                    <label htmlFor="visual-ok" className="text-sm cursor-pointer">Vizual tekshiruv — rangi, yuzasi, nuqsonlar yo'q</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="dimensions-ok" checked={dimensionsOk} onCheckedChange={(v) => setDimensionsOk(!!v)} data-testid="checkbox-dimensions" />
                    <label htmlFor="dimensions-ok" className="text-sm cursor-pointer">O'lchamlar — format, qalinlik, gramaj norma doirasida</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="print-ok" checked={printOk} onCheckedChange={(v) => setPrintOk(!!v)} data-testid="checkbox-print" />
                    <label htmlFor="print-ok" className="text-sm cursor-pointer">Bosma sifati — rasm, matn, ranglar to'g'ri</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="packaging-ok" checked={packagingOk} onCheckedChange={(v) => setPackagingOk(!!v)} data-testid="checkbox-packaging" />
                    <label htmlFor="packaging-ok" className="text-sm cursor-pointer">Qadoqlash — qutilash, yig'ish, etiketka to'g'ri</label>
                  </div>
                </div>
                <Textarea
                  placeholder="QC izoh (ixtiyoriy)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  data-testid="input-comments"
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>Yopish</Button>
            {selectedOrder?.status === "pending_review" && (
              <Button
                onClick={() => selectedOrder && approveMutation.mutate(selectedOrder.id)}
                disabled={approveMutation.isPending || !allChecked}
                data-testid="btn-confirm-approve"
              >
                {approveMutation.isPending ? "Yuklanmoqda..." : !allChecked ? "Barcha boxlarni belgilang" : "Tasdiqlash"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QC Rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>
            <Textarea
              placeholder="Rad etish sababi - qaysi test muvaffaqiyatsiz bo'ldi? (majburiy)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Bekor qilish</Button>
            <Button
              variant="destructive"
              onClick={() => selectedOrder && rejectMutation.mutate(selectedOrder.id)}
              disabled={rejectMutation.isPending || !comments.trim()}
              data-testid="btn-confirm-reject"
            >
              {rejectMutation.isPending ? "Yuklanmoqda..." : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Input Dialog */}
      <Dialog open={testDialog} onOpenChange={setTestDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Material Test Kiritish - {selectedOrder?.papkaNo}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="physical" onValueChange={(v) => setActiveTestCategory(v)}>
            <TabsList className="grid grid-cols-5">
              {(Array.isArray(testCategories) ? testCategories : []).map(cat => (
                <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
              ))}
            </TabsList>
            {(Array.isArray(testCategories) ? testCategories : []).map(cat => (
              <TabsContent key={cat.id} value={cat.id} className="p-4 space-y-3">
                {(testParamsByCategory[cat.id] || []).map(param => (
                  <div key={param} className="flex items-center gap-3">
                    <label className="text-sm w-40 shrink-0">{param}</label>
                    <Input
                      placeholder="Natija kiriting"
                      value={testInputs[cat.id]?.[param] || ""}
                      onChange={(e) => setTestInputs(prev => ({
                        ...prev,
                        [cat.id]: { ...(prev[cat.id] || {}), [param]: e.target.value }
                      }))}
                      data-testid={`input-test-${cat.id}-${param}`}
                    />
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialog(false)}>Yopish</Button>
            <Button
              onClick={() => saveTestsMutation.mutate()}
              disabled={saveTestsMutation.isPending}
              data-testid="btn-save-tests"
            >
              {saveTestsMutation.isPending ? "Saqlanmoqda..." : "Saqlash va Menejrga yuborish uchun tayyor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
