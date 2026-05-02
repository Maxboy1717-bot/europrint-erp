import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Brain, Factory, Clock, AlertTriangle, CheckCircle, Play, RefreshCw,
  TrendingUp, Cpu, Settings, XCircle, Zap, BarChart3, Target, Loader2,
  ChevronRight, Save, ShieldCheck, Printer, Layers, Package, AlertCircle,
  RotateCcw, History,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ErrorState } from "@/components/ui/error-state";

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface PlanDataItem {
  sequence: number;
  papkaNo: string;
  machineName: string;
  startTime: string;
  endTime: string;
  duration: number;
  shift?: string;
  orderId?: string;
}
interface AiRecommendation { type: string; message: string }
interface AiDecision {
  id: string; planId: string; decisionType: string;
  description: string; confidenceScore: number | null;
  impact: string; status: string; createdAt: string;
}
interface AiPlan {
  id: string; planNumber: string; planDate: string; planType: string;
  status: string; confidenceScore: number; autoApproved: boolean;
  autoApprovalThreshold: number | null; totalOrders: number | null;
  totalMachineHours: number | null; estimatedCompletion: string | null;
  planData: PlanDataItem[]; optimizationMetrics: Record<string, number>;
  aiRecommendations: AiRecommendation[]; createdAt: string;
  approvedAt?: string; decisions?: AiDecision[];
}
interface DashboardData {
  activePlans: number; totalPlans: number; avgConfidence: number;
  autoApprovedPct: number; totalOrdersScheduled: number;
  avgMachineUtilization: number; recentPlans: AiPlan[];
}
interface BatchGroup {
  machine: string; count: number; totalDuration: number;
  orders: string[]; changeoverReduction: string; estimatedEnergySaving: string;
}

// ─── Gantt Chart komponenti ───────────────────────────────────────────────────
function GanttChart({ items }: { items: PlanDataItem[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-8">Jadval bo'sh</p>;

  const COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
    "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6",
  ];
  const machines = [...new Set((Array.isArray(items) ? items : []).map(i => i.machineName))];
  const parseTime = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const totalWidth = 24 * 60; // 1440 minutes
  const rowH = 48;
  const labelW = 140;
  const chartW = 900;

  return (
    <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3" data-testid="gantt-chart">
      <div className="text-xs font-semibold text-muted-foreground mb-2">Gantt chart — kunlik reja</div>
      {/* Hour markers */}
      <div className="flex ml-[140px] mb-1">
        {([0, 4, 8, 12, 16, 20, 24]).map(h => (
          <div key={h} style={{ width: `${(h === 24 ? 0 : 4 * 60 / totalWidth) * chartW}px` }} className="relative">
            <span className="text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {(Array.isArray(machines) ? machines : []).map((machine, mi) => {
          const machineItems = (Array.isArray(items) ? items : []).filter(i => i.machineName === machine);
          return (
            <div key={machine} className="flex items-center gap-2">
              <div className="text-xs font-medium text-muted-foreground truncate" style={{ width: labelW, minWidth: labelW }}>
                {machine}
              </div>
              <div className="relative rounded bg-muted/50" style={{ width: chartW, height: rowH }}>
                {(Array.isArray(machineItems) ? machineItems : []).map((item, idx) => {
                  const start = parseTime(item.startTime);
                  const end = parseTime(item.endTime);
                  const width = Math.max(((end - start) / totalWidth) * chartW, 30);
                  const left = (start / totalWidth) * chartW;
                  const color = COLORS[mi % COLORS.length];
                  return (
                    <div
                      key={idx}
                      title={`${item.papkaNo} | ${item.startTime}-${item.endTime} | ${item.duration} min`}
                      style={{ left, width, backgroundColor: color + "cc", borderLeft: `3px solid ${color}` }}
                      className="absolute top-1 bottom-1 rounded text-white text-[10px] font-bold flex items-center px-1 overflow-hidden"
                      data-testid={`gantt-bar-${item.papkaNo}`}
                    >
                      {item.papkaNo}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PDF print funksiyasi ─────────────────────────────────────────────────────
function printPlan(plan: AiPlan) {
  const rows = plan.planData?.map((item, i) => `
    <tr>
      <td>${item.sequence || i + 1}</td>
      <td><strong>${item.papkaNo}</strong></td>
      <td>${item.machineName}</td>
      <td>${item.shift || "1-smena"}</td>
      <td>${item.startTime} – ${item.endTime}</td>
      <td>${item.duration || 0} min</td>
    </tr>`).join("");

  const metrics = Object.entries(plan.optimizationMetrics || {})
    .map(([k, v]) => `<li>${k.replace(/([A-Z])/g, " $1")}: <strong>${v}%</strong></li>`)
    .join("");

  const html = `<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8">
  <title>PP Reja — ${plan.planNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin: 0; } h2 { font-size: 13px; margin: 12px 0 4px; color: #444; border-bottom: 1px solid #ddd; }
    .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .logo { font-weight: bold; font-size: 20px; } .meta { display: flex; gap: 30px; flex-wrap: wrap; font-size: 11px; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f0f0f0; padding: 5px 8px; text-align: left; border: 1px solid #ccc; font-size: 10px; text-transform: uppercase; }
    td { padding: 4px 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 16px; border-top: 1px solid #ccc; padding-top: 6px; color: #888; font-size: 10px; display: flex; justify-content: space-between; }
    ul { margin: 0; padding-left: 18px; }
    @media print { body { margin: 8px; } }
  </style></head><body>
  <div class="header">
    <div class="logo">EUROPRINT ERP</div>
    <h1>PP Ishlab chiqarish rejasi — ${plan.planNumber}</h1>
    <div class="meta">
      <span>Sana: <strong>${plan.planDate}</strong></span>
      <span>Turi: <strong>${plan.planType === "daily" ? "Kunlik" : "Haftalik"}</strong></span>
      <span>Holat: <strong>${plan.status}</strong></span>
      <span>Ishonch: <strong>${plan.confidenceScore}%</strong></span>
      <span>Buyurtmalar: <strong>${plan.totalOrders}</strong></span>
      <span>Mashina soat: <strong>${plan.totalMachineHours}</strong></span>
    </div>
  </div>
  <h2>Ishlab chiqarish jadvali</h2>
  <table>
    <thead><tr><th>#</th><th>Papka raqami</th><th>Mashina</th><th>Smena</th><th>Vaqt</th><th>Davomiylik</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Optimallashtirish ko'rsatkichlari</h2>
  <ul>${metrics}</ul>
  <div class="footer">
    <span>Europrint ERP — PP Reja eksporti</span>
    <span>Sana: ${new Date().toLocaleDateString("uz-UZ")} ${new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
  </div>
  <script>window.onload = () => window.print();</script>
  </body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
export default function AIProductionPlanning() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<AiPlan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showBlockMaterial, setShowBlockMaterial] = useState(false);
  const [detailTab, setDetailTab] = useState<"schedule" | "gantt" | "batch" | "decisions">("schedule");
  const [threshold, setThreshold] = useState<number>(85);
  const [overrideReason, setOverrideReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleType, setRescheduleType] = useState<"machine_stop" | "material_shortage" | "priority_change" | "manual">("manual");
  const [blockMaterial, setBlockMaterial] = useState("");
  const [blockOrderId, setBlockOrderId] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const { data: dashboard, isLoading: dashLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/ai-planning/dashboard"],
  });
  const { data: plans, isLoading: plansLoading } = useQuery<AiPlan[]>({
    queryKey: ["/api/ai-planning/plans"],
  });
  const { data: config } = useQuery<Record<string, string>>({
    queryKey: ["/api/ai-planning/config"],
  });
  const { data: batchGroups } = useQuery<{ batchGroups: BatchGroup[]; totalMachines: number }>({
    queryKey: ["/api/ai-planning/plans", selectedPlan?.id, "batch-groups"],
    queryFn: async () => {
      if (!selectedPlan) return { batchGroups: [], totalMachines: 0 };
      const r = await fetch(`/api/ai-planning/plans/${selectedPlan.id}/batch-groups`, { credentials: "include" });
      return r.json();
    },
    enabled: !!selectedPlan && detailTab === "batch",
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai-planning/generate", { planType: "daily" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      toast({ title: "AI Reja yaratildi", description: "Yangi reja muvaffaqiyatli yaratildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, isOverride, reason }: { id: string; isOverride?: boolean; reason?: string }) =>
      apiRequest("POST", `/api/ai-planning/plans/${id}/approve`, { isOverride, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      setShowDetail(false); setShowOverride(false);
      toast({ title: "Tasdiqlandi", description: "Reja tasdiqlandi va Telegram yuborildi" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/ai-planning/plans/${id}/reject`, { reason: "Qo'lda rad etildi" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      setShowDetail(false);
      toast({ title: "Rad etildi" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/ai-planning/plans/${id}/execute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/dashboard"] });
      setShowDetail(false);
      toast({ title: "Bajarilmoqda", description: "Machine tasks yaratildi va Telegram yuborildi" });
    },
  });

  const acceptDecisionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/ai-planning/decisions/${id}/accept`),
    onSuccess: () => {
      if (selectedPlan) queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans", selectedPlan.id] });
      toast({ title: "Qaror qabul qilindi" });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, reason, type }: { id: string; reason: string; type: string }) =>
      apiRequest("POST", `/api/ai-planning/plans/${id}/reschedule`, { reason, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/plans"] });
      setShowReschedule(false); setRescheduleReason("");
      toast({ title: "Qayta rejalashtirildi", description: "Barcha buyurtmalar 2 soat kechiktirildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const blockMaterialMutation = useMutation({
    mutationFn: ({ orderId, materialName, reason }: { orderId: string; materialName: string; reason: string }) =>
      apiRequest("POST", `/api/ai-planning/orders/${orderId}/block-material`, { materialName, reason, requiredQuantity: 1 }),
    onSuccess: (data: { purchaseRequisitionNumber?: string }) => {
      setShowBlockMaterial(false); setBlockMaterial(""); setBlockOrderId(""); setBlockReason("");
      toast({ title: "Bloklandi", description: data.purchaseRequisitionNumber ? `Xarid talabi: ${data.purchaseRequisitionNumber}` : "MM ga xabar yuborildi" });
    },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const saveConfigMutation = useMutation({
    mutationFn: (data: Record<string, string>) => apiRequest("PATCH", "/api/ai-planning/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-planning/config"] });
      setShowConfig(false);
      toast({ title: "Sozlamalar saqlandi" });
    },
  });

  const getConfidenceColor = (score: number) =>
    score >= 85 ? "text-green-600 dark:text-green-400" : score >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: "Qoralama", cls: "bg-surface-container text-on-surface" },
      pending_review: { label: "Tekshiruvda", cls: "bg-amber-100 text-amber-800" },
      auto_approved: { label: "Avto-tasdiqlangan", cls: "bg-green-100 text-green-800" },
      manually_approved: { label: "Tasdiqlangan", cls: "bg-green-100 text-green-800" },
      rejected: { label: "Rad etilgan", cls: "bg-red-100 text-red-800" },
      executing: { label: "Bajarilmoqda", cls: "bg-blue-100 text-blue-800" },
      executed: { label: "Bajarilgan", cls: "bg-green-100 text-green-800" },
    };
    const s = map[status] || { label: status, cls: "bg-surface-container text-on-surface" };
    return <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold no-default-hover-elevate", s.cls)} data-testid={`badge-status-${status}`}>{s.label}</Badge>;
  };

  const openDetail = async (plan: AiPlan) => {
    try {
      const detail = await apiRequest<AiPlan>("GET", `/api/ai-planning/plans/${plan.id}`);
      setSelectedPlan(detail);
    } catch { setSelectedPlan(plan); }
    setDetailTab("schedule");
    setShowDetail(true);
  };

  const stats = [
    { label: "Faol rejalar", value: dashboard?.activePlans ?? 0, icon: Zap },
    { label: "O'rtacha ishonch", value: `${dashboard?.avgConfidence ?? 0}%`, icon: Target },
    { label: "Avto-tasdiqlangan", value: `${dashboard?.autoApprovedPct ?? 0}%`, icon: ShieldCheck },
    { label: "Rejalashtirilgan buyurtmalar", value: dashboard?.totalOrdersScheduled ?? 0, icon: BarChart3 },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="page-ai-planning">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              AI <span className="font-bold text-primary">Rejalashtirish</span>
            </h1>
            <p className="text-on-surface-variant">VIP-First · FIFO · Batch grouping · Dynamic reschedule</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowBlockMaterial(true)} data-testid="button-block-material">
            <Package className="h-4 w-4 mr-1" />
            Material blok
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setThreshold(config?.auto_approval_threshold ? parseInt(config.auto_approval_threshold) : 85); setShowConfig(true); }} data-testid="button-open-config">
            <Settings className="h-4 w-4 mr-1" />
            Sozlamalar
          </Button>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-plan">
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cpu className="h-4 w-4 mr-2" />}
            AI Reja yaratish
          </Button>
        </div>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(Array.isArray(stats) ? stats : []).map((stat, i) => (
          <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold tracking-tight text-on-surface" data-testid={`text-stat-value-${i}`}>{dashLoading ? "..." : stat.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="plans">
        <TabsList className="mb-4">
          <TabsTrigger value="plans" data-testid="tab-plans">Rejalar</TabsTrigger>
          <TabsTrigger value="recommendations" data-testid="tab-recommendations">AI Tavsiyalar</TabsTrigger>
        </TabsList>

        {/* Rejalar */}
        <TabsContent value="plans">
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {([1, 2, 3]).map(i => <div key={`k-${i}`} className="h-48 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : !plans || plans.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-lg p-12 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4" data-testid="text-no-plans">Hali reja yaratilmagan</p>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} data-testid="button-generate-first">
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cpu className="h-4 w-4 mr-2" />}
                Birinchi rejani yaratish
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(Array.isArray(plans) ? plans : []).map((plan) => (
                <div key={plan.id} className="bg-surface-container-lowest rounded-lg p-5 cursor-pointer hover-elevate" onClick={() => openDetail(plan)} data-testid={`card-plan-${plan.id}`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="text-base font-bold text-on-surface">{plan.planNumber}</h4>
                    {getStatusBadge(plan.status)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Sana</span><span className="font-medium">{plan.planDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Buyurtmalar</span><span className="font-medium" data-testid={`text-orders-${plan.id}`}>{plan.totalOrders ?? 0}</span></div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Ishonch</span>
                        <span className={cn("font-bold", getConfidenceColor(plan.confidenceScore))} data-testid={`text-confidence-${plan.id}`}>{plan.confidenceScore}%</span>
                      </div>
                      <Progress value={plan.confidenceScore} className="h-1.5" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {plan.autoApproved ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Avto-tasdiqlangan</div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Qo'lda tasdiq kerak</div>
                      )}
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Tavsiyalar */}
        <TabsContent value="recommendations">
          {plans?.filter(p => p.aiRecommendations?.length > 0).slice(0, 5).map(plan => (
            <div key={plan.id} className="bg-surface-container-lowest rounded-lg p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{plan.planNumber}</span>
                <Badge className="text-[10px] no-default-hover-elevate">{plan.planDate}</Badge>
              </div>
              <div className="space-y-2">
                {(Array.isArray(plan.aiRecommendations) ? plan.aiRecommendations : []).map((rec, i) => (
                  <div key={`k-${i}`} className="flex items-start gap-2 text-sm" data-testid={`text-recommendation-${plan.id}-${i}`}>
                    {rec.type === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> :
                      rec.type === "optimization" ? <TrendingUp className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> :
                        <Cpu className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                    <span className="text-muted-foreground">{rec.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )) || (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-recommendations">Tavsiyalar mavjud emas</div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Plan detail dialog ──────────────────────────────────────────── */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPlan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span data-testid="text-detail-plan-number" className="font-bold">{selectedPlan.planNumber}</span>
                  {getStatusBadge(selectedPlan.status)}
                </DialogTitle>
              </DialogHeader>

              {/* Meta stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {([
                  { label: "Ishonch", value: `${selectedPlan.confidenceScore}%`, color: getConfidenceColor(selectedPlan.confidenceScore) },
                  { label: "Buyurtmalar", value: String(selectedPlan.totalOrders ?? 0), color: "" },
                  { label: "Mashina soat", value: String(selectedPlan.totalMachineHours ?? 0), color: "" },
                  { label: "Bajarilish", value: selectedPlan.estimatedCompletion ?? "-", color: "" },
                ]).map((s, i) => (
                  <div key={`k-${i}`} className="bg-muted/40 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={cn("text-xl font-bold", s.color)} data-testid={`text-detail-${s.label.toLowerCase().replace(/ /g, "-")}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              {selectedPlan.optimizationMetrics && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedPlan.optimizationMetrics).map(([k, v]) => (
                    <div key={k} className="flex justify-between p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="font-bold" data-testid={`text-metric-${k}`}>{v}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Inner tabs */}
              <div className="flex border-b gap-0">
                {([["schedule", "Jadval"], ["gantt", "Gantt"], ["batch", "Batch Grupp"], ["decisions", "Log"]] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => setDetailTab(tab as typeof detailTab)}
                    className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                      detailTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    data-testid={`detail-tab-${tab}`}
                  >{label}</button>
                ))}
              </div>

              {/* Schedule tab */}
              {detailTab === "schedule" && selectedPlan.planData?.length > 0 && (
                <ScrollArea className="max-h-64 rounded-lg border bg-muted/20">
                  <div className="divide-y">
                    {(Array.isArray(selectedPlan.planData) ? selectedPlan.planData : []).map((item, i) => (
                      <div key={`k-${i}`} className="flex items-center gap-3 p-3 text-sm" data-testid={`row-schedule-${i}`}>
                        <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-bold no-default-hover-elevate shrink-0">{item.sequence}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{item.papkaNo}</p>
                          <p className="text-xs text-muted-foreground">{item.machineName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-primary">{item.startTime} – {item.endTime}</p>
                          <p className="text-xs text-muted-foreground">{item.duration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Gantt tab */}
              {detailTab === "gantt" && <GanttChart items={selectedPlan.planData || []} />}

              {/* Batch groups tab */}
              {detailTab === "batch" && (
                <div className="space-y-2" data-testid="batch-groups">
                  {batchGroups?.batchGroups?.map((g, i) => (
                    <div key={`k-${i}`} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{g.machine}</span>
                        <Badge className="text-xs no-default-hover-elevate">{g.count} buyurtma</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Tejash: <strong className="text-green-600">{g.changeoverReduction}</strong></span>
                        <span>Energiya: <strong className="text-blue-600">{g.estimatedEnergySaving}</strong></span>
                        <span>Jami: {Math.round(g.totalDuration / 60)} soat</span>
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground text-center py-4">Yuklanmoqda...</p>}
                </div>
              )}

              {/* Decisions / Log tab */}
              {detailTab === "decisions" && (
                <div className="space-y-2">
                  {selectedPlan.decisions?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Log yozuvlari yo'q</p>}
                  {selectedPlan.decisions?.map((dec) => (
                    <div key={dec.id} className={cn("p-3 rounded-lg text-sm border", dec.decisionType === "override" ? "border-amber-300 bg-amber-50" : dec.decisionType === "reschedule" ? "border-blue-300 bg-blue-50" : "bg-muted/30")} data-testid={`row-decision-${dec.id}`}>
                      <div className="flex justify-between gap-2 mb-1">
                        <Badge className={cn("text-[10px] no-default-hover-elevate", dec.decisionType === "override" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800")}>
                          {dec.decisionType === "override" ? "OVERRIDE" : dec.decisionType === "reschedule" ? "RESCHEDULE" : dec.decisionType.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(dec.createdAt).toLocaleString("uz-UZ")}</span>
                      </div>
                      <p className="text-muted-foreground">{dec.description}</p>
                      {dec.status === "proposed" && (
                        <Button size="sm" className="mt-2" onClick={() => acceptDecisionMutation.mutate(dec.id)} disabled={acceptDecisionMutation.isPending} data-testid={`button-accept-decision-${dec.id}`}>
                          Qabul qilish
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <DialogFooter className="flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => printPlan(selectedPlan)} data-testid="button-print-plan">
                  <Printer className="h-4 w-4 mr-1" />
                  PDF chop etish
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowReschedule(true); setRescheduleReason(""); }} data-testid="button-reschedule">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Qayta rejalash
                </Button>

                {selectedPlan.status === "pending_review" && (
                  <>
                    <Button size="sm" onClick={() => { setOverrideReason(""); setShowOverride(true); }} data-testid="button-approve-plan">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Tasdiqlash
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate(selectedPlan.id)} disabled={rejectMutation.isPending} data-testid="button-reject-plan">
                      <XCircle className="h-4 w-4 mr-1" />
                      Rad etish
                    </Button>
                  </>
                )}
                {(selectedPlan.status === "auto_approved" || selectedPlan.status === "manually_approved") && (
                  <Button size="sm" onClick={() => executeMutation.mutate(selectedPlan.id)} disabled={executeMutation.isPending} data-testid="button-execute-plan">
                    {executeMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    Bajarish
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Super admin override dialog ─────────────────────────────────── */}
      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Rejani Tasdiqlash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Reja: <strong>{selectedPlan?.planNumber}</strong></p>
            <div className="p-3 bg-amber-50 rounded-md text-xs text-amber-700">
              Super admin override: sabab kiritish majburiy (kamida 10 belgi). Log yoziladi.
            </div>
            <div>
              <Label>Override sababi (majburiy)</Label>
              <Textarea
                className="mt-1"
                placeholder="Nima uchun bu reja qo'lda tasdiqlanmoqda?..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                data-testid="input-override-reason"
              />
              <p className="text-xs text-muted-foreground mt-1">{overrideReason.trim().length}/10 belgi minimal</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverride(false)}>Bekor qilish</Button>
            <Button
              onClick={() => selectedPlan && approveMutation.mutate({ id: selectedPlan.id, isOverride: true, reason: overrideReason })}
              disabled={approveMutation.isPending || overrideReason.trim().length < 10}
              data-testid="button-confirm-override"
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Tasdiqlash va Log yozish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dynamic reschedule dialog ───────────────────────────────────── */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              Qayta Rejalash — Dynamic Reschedule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-md text-xs text-blue-700">
              Reja qayta rejalashtiriladi: barcha buyurtmalar 2 soat kechiktiriladi. Log yoziladi va Telegram yuboriladi.
            </div>
            <div>
              <Label>Sabab turi</Label>
              <Select value={rescheduleType} onValueChange={(v) => setRescheduleType(v as typeof rescheduleType)}>
                <SelectTrigger className="mt-1" data-testid="select-reschedule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="machine_stop">Mashina to'xtashi</SelectItem>
                  <SelectItem value="material_shortage">Material yetishmovchi</SelectItem>
                  <SelectItem value="priority_change">Ustuvorlik o'zgarishi</SelectItem>
                  <SelectItem value="manual">Qo'lda o'zgartirish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sabab (kamida 5 belgi)</Label>
              <Textarea
                className="mt-1"
                placeholder="Qayta rejalash sababi..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
                data-testid="input-reschedule-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReschedule(false)}>Bekor qilish</Button>
            <Button
              onClick={() => selectedPlan && rescheduleMutation.mutate({ id: selectedPlan.id, reason: rescheduleReason, type: rescheduleType })}
              disabled={rescheduleMutation.isPending || rescheduleReason.trim().length < 5}
              data-testid="button-confirm-reschedule"
            >
              {rescheduleMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
              Qayta Rejalash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── blocked_by_material dialog ──────────────────────────────────── */}
      <Dialog open={showBlockMaterial} onOpenChange={setShowBlockMaterial}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Material yetishmovchi — PP bloklash
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-md text-xs text-amber-700">
              Buyurtma <strong>blocked_by_material</strong> holatiga o'tkaziladi. MM ga avtomatik xarid talabi yuboriladi va managerga Telegram signal jo'natiladi.
            </div>
            <div>
              <Label>Buyurtma ID</Label>
              <Input className="mt-1" placeholder="papkaOrder ID yoki papka raqami" value={blockOrderId} onChange={(e) => setBlockOrderId(e.target.value)} data-testid="input-block-order-id" />
            </div>
            <div>
              <Label>Yetishmayotgan material nomi</Label>
              <Input className="mt-1" placeholder="masalan: gofrokarton, PP lenta..." value={blockMaterial} onChange={(e) => setBlockMaterial(e.target.value)} data-testid="input-block-material" />
            </div>
            <div>
              <Label>Sabab (ixtiyoriy)</Label>
              <Input className="mt-1" placeholder="Ko'rsatilmagan" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} data-testid="input-block-reason" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockMaterial(false)}>Bekor qilish</Button>
            <Button
              className="bg-amber-600 text-white"
              onClick={() => blockMaterialMutation.mutate({ orderId: blockOrderId, materialName: blockMaterial, reason: blockReason })}
              disabled={blockMaterialMutation.isPending || !blockOrderId || !blockMaterial}
              data-testid="button-confirm-block-material"
            >
              {blockMaterialMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Package className="h-4 w-4 mr-1" />}
              MM ga Xarid Talabi Yuborish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Config dialog ───────────────────────────────────────────────── */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>AI Rejalashtirish Sozlamalari</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Avto-tasdiqlash chegarasi</label>
                <span className={cn("text-lg font-bold", getConfidenceColor(threshold))} data-testid="text-config-threshold">{threshold}%</span>
              </div>
              <Slider value={[threshold]} onValueChange={(v) => setThreshold(v[0])} min={0} max={100} step={5} data-testid="slider-threshold" />
              <p className="text-xs text-muted-foreground mt-1">{threshold}% dan yuqori ishonch bo'lsa avtomatik tasdiqlanadi</p>
            </div>
            <Button className="w-full" onClick={() => saveConfigMutation.mutate({ auto_approval_threshold: String(threshold) })} disabled={saveConfigMutation.isPending} data-testid="button-save-config">
              {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
