import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  CheckCircle, XCircle, Clock, Cpu, Eye, FileText, AlertTriangle,
  Zap, History, ChevronRight, Info, User,
} from "lucide-react";
import { QCheckDialog, type QCheckResult } from "@/components/QCheckDialog";
import { useTranslation } from "@/lib/i18n";

interface TechOrderData {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  mahsulotTuri: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  tayyorBolishSanasi: string | null;
  status: string;
}

interface AiCheckWarning {
  code: string;
  level: "error" | "warning" | "info";
  message: string;
}

interface AiCheckResult {
  orderId: string;
  orderNo: string;
  score: number;
  status: "passed" | "warnings" | "failed";
  warnings: AiCheckWarning[];
  techCardFound: boolean;
  recommendation: string;
}

interface ApprovalLog {
  orderId: string;
  orderNo: string;
  currentStatus: string;
  techAction: "pending" | "approved" | "rejected";
  checkpoints: { bomApproved: boolean; routingApproved: boolean; techCardApproved: boolean };
  approvedAt: string | null;
  approvedBy: string | null;
  notes: string | null;
  isRejected: boolean;
}

interface MaterialAlt {
  name: string; saving: string; note: string;
}

// ─── AI Check Panel ───────────────────────────────────────────────────────────
function AiCheckPanel({ orderId, onClose }: { orderId: string; onClose?: () => void }) {
  const [result, setResult] = useState<AiCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/technology/orders/${orderId}/ai-check`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) setResult(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { run(); }, [orderId]);

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="h-4 w-4 animate-pulse" />AI tekshirmoqda...</div>;
  if (!result) return null;

  const scoreColor = result.score >= 80 ? "text-green-600" : result.score >= 50 ? "text-amber-600" : "text-red-600";
  const statusColor = result.status === "passed" ? "bg-green-100 text-green-700" : result.status === "warnings" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  return (
    <div className="space-y-3 p-4 bg-muted rounded-lg" data-testid="ai-check-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Tahlil Natijasi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>{result.score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
          <Badge className={`text-xs ${statusColor}`}>
            {result.status === "passed" ? "O'tdi" : result.status === "warnings" ? "Ogohlantirishlar" : "Rad"}
          </Badge>
        </div>
      </div>

      {result.warnings.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          {result.recommendation}
        </div>
      ) : (
        <div className="space-y-1">
          {(Array.isArray(result.warnings) ? result.warnings : []).map((w, i) => (
            <div key={`k-${i}`} className={`flex items-start gap-2 text-xs p-2 rounded ${w.level === "error" ? "bg-red-50 text-red-700" : w.level === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`} data-testid={`ai-warning-${w.code}`}>
              {w.level === "error" ? <XCircle className="h-3 w-3 shrink-0 mt-0.5" /> : <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />}
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{result.recommendation}</p>
    </div>
  );
}

// ─── Tasdiqlash tarixi (Log) ──────────────────────────────────────────────────
function ApprovalHistory({ orderId }: { orderId: string }) {
  const { data: log } = useQuery<ApprovalLog>({
    queryKey: ["/api/technology/orders", orderId, "approval-log"],
    queryFn: async () => {
      const r = await fetch(`/api/technology/orders/${orderId}/approval-log`, { credentials: "include" });
      if (!r.ok) throw new Error("Log topilmadi");
      return r.json();
    },
  });

  if (!log || log.techAction === "pending") {
    return <p className="text-sm text-muted-foreground italic">Hali texnolog harakati yo'q</p>;
  }

  return (
    <div className="space-y-2 text-sm" data-testid="approval-history">
      <div className="flex items-center gap-2">
        <Badge className={log.isRejected ? "bg-red-100 text-red-700 no-default-hover-elevate" : "bg-green-100 text-green-700 no-default-hover-elevate"}>
          {log.isRejected ? "Rad etildi" : "Tasdiqlandi"}
        </Badge>
        {log.approvedAt && <span className="text-muted-foreground text-xs">{new Date(log.approvedAt).toLocaleString("uz-UZ")}</span>}
      </div>
      {log.approvedBy && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{log.approvedBy}</span>
        </div>
      )}
      {!log.isRejected && (
        <div className="flex gap-3 text-xs">
          <span className={log.checkpoints.bomApproved ? "text-green-600" : "text-muted-foreground"}>
            {log.checkpoints.bomApproved ? "✓" : "○"} BOM
          </span>
          <span className={log.checkpoints.routingApproved ? "text-green-600" : "text-muted-foreground"}>
            {log.checkpoints.routingApproved ? "✓" : "○"} Routing
          </span>
          <span className={log.checkpoints.techCardApproved ? "text-green-600" : "text-muted-foreground"}>
            {log.checkpoints.techCardApproved ? "✓" : "○"} Texkarta
          </span>
        </div>
      )}
      {log.notes && <p className="text-xs text-muted-foreground italic">Izoh: {log.notes}</p>}
    </div>
  );
}

// ─── Material muqobili panel ──────────────────────────────────────────────────
function MaterialAlternatives() {
  const [material, setMaterial] = useState("gofrokarton");
  const { data, refetch, isFetching } = useQuery<{ material: string; alternatives: MaterialAlt[]; note: string }>({
    queryKey: ["/api/technology/materials/alternatives", material],
    queryFn: async () => {
      const r = await fetch(`/api/technology/materials/alternatives?material=${encodeURIComponent(material)}`, { credentials: "include" });
      return r.json();
    },
    enabled: false,
  });

  return (
    <div className="space-y-3" data-testid="material-alternatives">
      <div className="flex gap-2">
        <input
          className="flex-1 text-sm px-3 py-1.5 rounded-md border bg-background"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Material nomi (masalan: gofrokarton)"
          data-testid="input-material-name"
        />
        <Button size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-find-alternatives">
          {isFetching ? "Qidirilmoqda..." : "Muqobil topish"}
        </Button>
      </div>
      {data?.alternatives && (
        <div className="space-y-2">
          {(Array.isArray(data.alternatives) ? data.alternatives : []).map((alt, i) => (
            <div key={`k-${i}`} className="p-3 bg-muted rounded-lg flex items-start justify-between gap-2" data-testid={`material-alt-${i}`}>
              <div>
                <p className="font-medium text-sm">{alt.name}</p>
                <p className="text-xs text-muted-foreground">{alt.note}</p>
              </div>
              <Badge className="text-xs bg-green-100 text-green-700 no-default-hover-elevate shrink-0">{alt.saving}</Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{data.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
export default function TechApproval() {
  const { toast } = useToast();
  const { t } = useTranslation('ai');
  const [selectedOrder, setSelectedOrder] = useState<TechOrderData | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [returnTo, setReturnTo] = useState<"manager" | "designer">("manager");
  const [bomApproved, setBomApproved] = useState(false);
  const [routingApproved, setRoutingApproved] = useState(false);
  const [techCardApproved, setTechCardApproved] = useState(false);
  const [activeTab, setActiveTab] = useState<"approval" | "ai" | "materials">("approval");
  const [qcheckOpen, setQcheckOpen] = useState(false);
  const [qcheckResult, setQcheckResult] = useState<QCheckResult | null>(null);

  const prepressMutation = useMutation<QCheckResult, Error, { orderId: string; surveyFields: Record<string, unknown> }>({
    mutationFn: ({ orderId, surveyFields }) =>
      apiRequest("POST", "/api/ai-agents/prepress/tech-card", { orderId, surveyFields }),
    onSuccess: (data) => {
      setQcheckResult(data);
      setQcheckOpen(true);
    },
    onError: () => {
      toast({ title: t('qcheck.errorTitle'), description: t('qcheck.errorDesc'), variant: "destructive" });
    },
  });

  function handlePrepressCommit(result: QCheckResult) {
    setQcheckOpen(false);
    toast({
      title: result.autoExecuted ? t('qcheck.commitAutoTitle') : t('qcheck.commitManualTitle'),
      description: t('qcheck.commitDesc', { orderId: result.orderId, pct: Math.round(result.confidence * 100) }),
    });
    void queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
  }

  const { data: rawOrders, isLoading } = useQuery<unknown>({
    queryKey: ["/api/papka-orders", { status: "pending_tech" }],
    queryFn: async () => {
      const res = await fetch("/api/papka-orders?status=pending_tech", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    }
  });
  const orders: TechOrderData[] = Array.isArray(rawOrders) ? rawOrders : [];

  // Task #1: Endpoint tuzatildi — `/api/technology/orders/:id/approve`
  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/technology/orders/${orderId}/approve`, {
        bomApproved,
        routingApproved,
        techCardApproved,
        notes: comments,
      });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "3-checkpoint tasdiqlandi. Avans nazorati boshlanmoqda" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setApprovalDialog(false);
      setSelectedOrder(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  });

  // Task #3: Endpoint tuzatildi — `/api/technology/orders/:id/reject` + returnTo
  const rejectMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/technology/orders/${orderId}/reject`, {
        reason: rejectReason,
        returnTo,
      });
    },
    onSuccess: () => {
      toast({ title: "Rad etildi", description: "Buyurtma qaytarildi. Menejerga Telegram signal yuborildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setRejectDialog(false);
      setSelectedOrder(null);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  });

  const allChecked = bomApproved && routingApproved && techCardApproved;

  const resetForm = () => {
    setBomApproved(false);
    setRoutingApproved(false);
    setTechCardApproved(false);
    setComments("");
  };

  const openApprovalDialog = (order: TechOrderData) => {
    setSelectedOrder(order);
    resetForm();
    setActiveTab("ai");
    setApprovalDialog(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        {([1, 2, 3]).map(i => <div key={`k-${i}`} className="h-28 bg-muted rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-surface" data-testid="page-tech-approval">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Texnolog <span className="font-bold text-primary">Tasdiqlash</span>
          </h1>
          <p className="text-on-surface-variant">3-checkpoint tasdiqlash · AI tahlil · Material muqobili</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate rounded-full px-4 py-1 text-sm font-semibold">
          <Clock className="h-4 w-4 mr-2" />
          Kutilmoqda: {orders.length}
        </Badge>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setSelectedOrder(null); setHistoryDialog(true); }}
          data-testid="button-view-history"
        >
          <History className="h-4 w-4 mr-1" />
          Tarix ko'rish
        </Button>
      </div>

      {/* ─── Buyurtmalar ro'yxati ────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-on-surface">Tasdiqlash kutayotgan buyurtmalar yo'q</p>
            <p className="text-on-surface-variant">Barcha buyurtmalar ko'rib chiqilgan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(orders) ? orders : []).map((order: TechOrderData) => (
            <Card key={order.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none" data-testid={`order-card-${order.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg text-on-surface">{order.papkaNo}</CardTitle>
                  <p className="text-sm text-on-surface-variant">{order.mijozNomi}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 no-default-hover-elevate rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  <Clock className="h-3 w-3 mr-1" />
                  Texnolog kutilmoqda
                </Badge>
              </CardHeader>
              <CardContent>
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
                    <p className="font-medium text-on-surface">{order.formatA} × {order.formatB} mm</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Tiraj</p>
                    <p className="font-medium text-on-surface">{order.tiraj?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setHistoryDialog(true); }}
                    data-testid={`btn-history-${order.id}`}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Tarix
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`btn-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ko'rish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`btn-tech-card-${order.id}`}
                    disabled={prepressMutation.isPending}
                    onClick={() => prepressMutation.mutate({
                      orderId: order.id,
                      surveyFields: {
                        print_tech:           order.mahsulotTuri ?? 'ofset',
                        paper_type:           'kunsht',
                        paper_gsm:            150,
                        dimensions_mm:        `${order.formatA ?? 0}x${order.formatB ?? 0}`,
                        colors_front:         4,
                        colors_back:          0,
                        finishing:            'laminatsiya',
                        qty_ordered:          order.tiraj ?? 1000,
                        delivery_deadline:    order.tayyorBolishSanasi ?? '',
                        special_requirements: '',
                      },
                    })}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {t('qcheck.techCardBtn')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setRejectReason(""); setRejectDialog(true); }}
                    data-testid={`btn-reject-${order.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rad etish
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openApprovalDialog(order)}
                    data-testid={`btn-approve-${order.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Tasdiqlash
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Tasdiqlash dialog ───────────────────────────────────────────── */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Texnolog Tasdiqlash — {selectedOrder?.papkaNo}
            </DialogTitle>
          </DialogHeader>

          {/* Tab header */}
          <div className="flex border-b">
            {([["ai", "AI Tahlil", Zap], ["approval", "3-Checkpoint", CheckCircle], ["materials", "Material Muqobili", Info]] as const).map(([tab, label, Icon]) => (
              <button
                key={tab}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                data-testid={`tab-${tab}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4 min-h-[200px]">
            {/* AI Tahlil tab */}
            {activeTab === "ai" && selectedOrder && (
              <div className="space-y-3">
                <AiCheckPanel orderId={selectedOrder.id} />
                <Button size="sm" variant="outline" className="w-full" onClick={() => setActiveTab("approval")} data-testid="button-proceed-to-checkpoint">
                  Checkpoint ga o'tish <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* 3-Checkpoint tab */}
            {activeTab === "approval" && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-md border p-4 bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground">Barcha 3 ta checkpoint belgilanishi shart:</p>

                  <div className="flex items-start gap-3">
                    <Checkbox id="bom-approved" checked={bomApproved} onCheckedChange={(v) => setBomApproved(!!v)} data-testid="checkbox-bom-approved" />
                    <div>
                      <Label htmlFor="bom-approved" className="cursor-pointer font-medium">BOM — Material to'plami tekshirildi</Label>
                      <p className="text-xs text-muted-foreground">Barcha materiallar miqdori va normalar to'g'ri</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox id="routing-approved" checked={routingApproved} onCheckedChange={(v) => setRoutingApproved(!!v)} data-testid="checkbox-routing-approved" />
                    <div>
                      <Label htmlFor="routing-approved" className="cursor-pointer font-medium">Routing — Operatsiyalar ketma-ketligi</Label>
                      <p className="text-xs text-muted-foreground">Ishlab chiqarish jarayoni bosqichlari to'g'ri</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox id="tech-card-approved" checked={techCardApproved} onCheckedChange={(v) => setTechCardApproved(!!v)} data-testid="checkbox-tech-card-approved" />
                    <div>
                      <Label htmlFor="tech-card-approved" className="cursor-pointer font-medium">Texnologik karta tayyorlandi</Label>
                      <p className="text-xs text-muted-foreground">AI karta generatsiya qilingan va to'g'ri</p>
                    </div>
                  </div>
                </div>

                {!allChecked && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Barcha 3 ta checkbox belgilanmasa backend tasdiqni rad etadi</span>
                  </div>
                )}

                <Textarea
                  placeholder="Texnik izoh (ixtiyoriy)"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  data-testid="input-comments"
                  rows={2}
                />
              </div>
            )}

            {/* Material muqobili tab */}
            {activeTab === "materials" && <MaterialAlternatives />}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>Bekor qilish</Button>
            {activeTab === "approval" && (
              <Button
                onClick={() => selectedOrder && approveMutation.mutate(selectedOrder.id)}
                disabled={approveMutation.isPending || !allChecked}
                data-testid="btn-confirm-approve"
              >
                {approveMutation.isPending ? "Saqlanmoqda..." : "3-Checkpoint Tasdiqlash"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Rad etish dialog ────────────────────────────────────────────── */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Texnolog Rad etish — returned_for_fix
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Buyurtma: <strong>{selectedOrder?.papkaNo}</strong> — {selectedOrder?.mijozNomi}
            </p>
            <div className="p-3 bg-amber-50 rounded-md text-xs text-amber-700">
              Rad etgandan so'ng buyurtma <strong>returned_for_fix</strong> holati bilan menejerga qaytariladi va Telegram signal yuboriladi.
            </div>
            <div>
              <Label>Rad etish sababi (majburiy, kamida 5 belgi)</Label>
              <Textarea
                placeholder="Nima xato? Nima tuzatish kerak?..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                rows={3}
                data-testid="input-reject-reason"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kimga qaytarish?</Label>
              <Select value={returnTo} onValueChange={(v) => setReturnTo(v as "manager" | "designer")}>
                <SelectTrigger className="mt-1" data-testid="select-return-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Menejerga qaytarish</SelectItem>
                  <SelectItem value="designer">Dizaynerga qaytarish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Bekor qilish</Button>
            <Button
              variant="destructive"
              onClick={() => selectedOrder && rejectMutation.mutate(selectedOrder.id)}
              disabled={rejectMutation.isPending || rejectReason.trim().length < 5}
              data-testid="btn-confirm-reject"
            >
              {rejectMutation.isPending ? "Yuklanmoqda..." : "Rad etish va Qaytarish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Tarix dialog ────────────────────────────────────────────────── */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Tasdiqlash Tarixi — {selectedOrder?.papkaNo || "Buyurtma"}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <ApprovalHistory orderId={selectedOrder.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Buyurtma tanlanmagan</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialog(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
