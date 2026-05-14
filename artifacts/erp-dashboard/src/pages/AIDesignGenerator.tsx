/** @module AIDesignGenerator @description Route-level page component for the AI Design Generator. Owns state, queries, mutations, and top-level layout. Sub-components live in AIDesignGeneratorPanels, AIDesignGeneratorResults, and AIDesignGeneratorTypes. */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sparkles, ClipboardList, Wrench, History, Eye } from "lucide-react";
import { StatusChain, ToolingTab } from "./AIDesignGeneratorPanels";
import { ResultsTab } from "./AIDesignGeneratorResults";
import {
  DesignOrder, GeneratedDesign, AiCheckResult,
  RevisionRecord, DashboardSummary,
  STATUS_COLORS, STATUS_LABELS,
} from "./AIDesignGeneratorTypes";
import { EPErrorState, EPLoader } from "@/components/ep";

export default function AIDesignGenerator() {
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [count, setCount] = useState(3);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [verifyingDesignId, setVerifyingDesignId] = useState<string | null>(null);
  const [checksMap, setChecksMap] = useState<Record<string, AiCheckResult[]>>({});
  const [mockupMap, setMockupMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("generate");
  const [revisionsOrderId, setRevisionsOrderId] = useState<string | null>(null);

  const { data: orders = [], isError, refetch } = useQuery<DesignOrder[]>({ queryKey: ["/api/design/orders"] });
  const { data: templates = [] } = useQuery<Array<{ id: string; name: string }>>({ queryKey: ["/api/design/templates"] });
  const { data: dashboardData } = useQuery<DashboardSummary>({ queryKey: ["/api/design/dashboard/summary"] });
  const { data: revisions = [] } = useQuery<RevisionRecord[]>({
    queryKey: ["/api/design/orders", revisionsOrderId, "revisions"],
    enabled: !!revisionsOrderId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => apiRequest("POST", "/api/design/generate", data),
    onSuccess: (data) => {
      setGeneratedDesigns(data.designs || []);
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
      toast({ title: "Dizaynlar yaratildi!", description: `${data.designs?.length || 0} ta AI dizayn ${data.generationTime || 0}s ichida yaratildi` });
    },
    onError: () => toast({ title: "Xatolik", description: "Dizayn yaratishda xatolik", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      apiRequest("PATCH", `/api/design/orders/${orderId}/status`, { newStatus }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] }); toast({ title: "Holat yangilandi!" }); },
    onError: (err: Error) => toast({ title: "Xatolik", description: err.message, variant: "destructive" }),
  });

  const activeOrders = (Array.isArray(orders) ? orders : []).filter((o) => !["rejected", "archived"].includes(o.order.status));
  const selectedOrder = (Array.isArray(orders) ? orders : []).find((o) => o.order.id === selectedOrderId);

  const handleGenerate = () => {
    if (!selectedOrderId) { toast({ title: "Buyurtmani tanlang", variant: "destructive" }); return; }
    generateMutation.mutate({ orderId: selectedOrderId, customPrompt, count });
  };

  const handleVerify = async (designId: string) => {
    setVerifyingDesignId(designId);
    try {
      const result = await apiRequest("POST", `/api/design/${designId}/verify`, {
        checkTypes: ["spelling_uz", "spelling_ru", "spelling_en", "bleed", "cmyk", "logo_quality", "overall"],
      });
      const checks: AiCheckResult[] = Object.entries(result.checks || {}).map(([ct, val]) => ({
        check_type: ct,
        status: (val as Record<string, unknown>).passed ? "passed" : "failed",
        score: Number((val as Record<string, unknown>).score || 0),
        issues: ((val as Record<string, unknown>).issues as string[]) || [],
        details: val as Record<string, unknown>,
      }));
      setChecksMap((prev) => ({ ...prev, [designId]: checks }));
      const failedCount = (Array.isArray(checks) ? checks : []).filter((c) => c.status === "failed").length;
      toast({
        title: failedCount === 0 ? "Tekshiruv o'tdi!" : `${failedCount} ta muammo topildi`,
        description: `Umumiy ball: ${result.overallScore?.toFixed(0) || 0}%`,
        variant: failedCount > 2 ? "destructive" : "default",
      });
    } catch { toast({ title: "Tekshiruv xatoligi", variant: "destructive" }); }
    finally { setVerifyingDesignId(null); }
  };

  const handleMockup = async (design: GeneratedDesign) => {
    try {
      const result = await apiRequest("POST", `/api/design/${design.id}/mockup`, { productType: selectedOrder?.order?.productType || "quti" });
      setMockupMap((prev) => ({ ...prev, [design.id]: result.mockupUrl }));
      toast({ title: "3D Mockup yaratildi!" });
    } catch { toast({ title: "Mockup xatoligi", variant: "destructive" }); }
  };

  const handleApprove = async (designId: string, orderId: string) => {
    try {
      await apiRequest("POST", `/api/design/${designId}/approve`, {});
      await statusMutation.mutateAsync({ orderId, newStatus: "approved" });
      toast({ title: "Dizayn tasdiqlandi!", description: "Texnolog moduliga o'tkazildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
    } catch { toast({ title: "Tasdiqlash xatoligi", variant: "destructive" }); }
  };

  const handleReject = async (designId: string) => {
    try {
      await apiRequest("POST", `/api/design/${designId}/reject`, { reason: "Mijoz tomonidan rad etildi" });
      toast({ title: "Dizayn rad etildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
    } catch { toast({ title: "Xatolik", variant: "destructive" }); }
  };

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <div className="flex flex-col flex-1 overflow-auto p-5 lg:p-6 gap-5">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="ep-h1 text-foreground" data-testid="text-page-title">AI Dizayn Generator</h1>
            <p className="text-muted-foreground mt-1">GPT-4o + Gemini 2.5 Flash bilan professional dizaynlar yarating</p>
          </div>
          {dashboardData && (
            <div className="flex gap-3 flex-wrap">
              <Card className="px-4 py-2"><div className="text-xs text-muted-foreground">Jami buyurtmalar</div><div className="text-xl font-bold text-foreground">{dashboardData.totalOrders}</div></Card>
              <Card className="px-4 py-2"><div className="text-xs text-muted-foreground">Tasdiq kutmoqda</div><div className="text-xl font-bold text-[var(--ep-yellow)]">{dashboardData.pendingApproval}</div></Card>
              <Card className="px-4 py-2"><div className="text-xs text-muted-foreground">Muammo topilgan</div><div className="text-xl font-bold text-[var(--ep-red)]">{dashboardData.failedChecks}</div></Card>
              <Card className="px-4 py-2"><div className="text-xs text-muted-foreground">Eskirgan asbob</div><div className="text-xl font-bold text-[var(--ep-primary)]">{dashboardData.wornTooling}</div></Card>
            </div>
          )}
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-main">
            <TabsTrigger value="generate" data-testid="tab-generate"><Sparkles className="h-4 w-4 mr-1" />Generatsiya</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results"><Eye className="h-4 w-4 mr-1" />Natijalar ({generatedDesigns.length})</TabsTrigger>
            <TabsTrigger value="tooling" data-testid="tab-tooling"><Wrench className="h-4 w-4 mr-1" />Asboblar</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history"><History className="h-4 w-4 mr-1" />Revision tarixi</TabsTrigger>
          </TabsList>

          {/* ─── Generatsiya tab ─────────────────────────────────────────── */}
          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-base">Sozlamalar</CardTitle><CardDescription>Dizayn parametrlari</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Buyurtma *</Label>
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger data-testid="select-order" className="h-9"><SelectValue placeholder="Buyurtmani tanlang" /></SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(activeOrders) ? activeOrders : []).map((o) => (
                          <SelectItem key={o.order.id} value={o.order.id}>{o.order.orderNumber} — {o.order.productName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedOrder && (
                    <div className="p-3 bg-muted rounded-md space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Tanlangan buyurtma:</div>
                      <div className="text-sm font-semibold">{selectedOrder.order.productName}</div>
                      <div className="text-xs text-muted-foreground">{selectedOrder.order.clientName}</div>
                      <StatusChain current={selectedOrder.order.status} />
                    </div>
                  )}
                  <div>
                    <Label>Dizaynlar soni</Label>
                    <Select value={String(count)} onValueChange={(v) => setCount(parseInt(v))}>
                      <SelectTrigger data-testid="select-count" className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{([1, 2, 3, 4, 5]).map((n) => <SelectItem key={n} value={String(n)}>{n} ta</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Maxsus Prompt (ixtiyoriy)</Label>
                    <Textarea placeholder="Ranglar, stil, maxsus talablar..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={4} data-testid="textarea-prompt" />
                  </div>
                  <Button onClick={handleGenerate} disabled={!selectedOrderId || generateMutation.isPending} className="w-full" data-testid="button-generate">
                    {generateMutation.isPending ? <><EPLoader className="mr-2" />Yaratilmoqda...</> : <><Sparkles className="mr-2 h-4 w-4" />AI Dizayn Yaratish</>}
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">{templates.length} ta brend shablon mavjud</div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" />Dizayn Holat Zanjiri</CardTitle>
                  <CardDescription>8 bosqichli tasdiqlash jarayoni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {([
                      { status: "new",                       desc: "Yangi dizayn buyurtmasi yaratildi" },
                      { status: "ai_generated",              desc: "AI dizayn generatsiya qilindi (GPT-4o + Gemini)" },
                      { status: "designer_review",           desc: "Dizayner ko'rib chiqmoqda, AI tekshiruv o'tkazilmoqda" },
                      { status: "waiting_customer_approval", desc: "Menejer orqali mijozga taqdim etildi" },
                      { status: "revision_requested",        desc: "Mijoz tahrirlash so'radi — yangi versiya yaratilmoqda" },
                      { status: "approved",                  desc: "Tasdiqlangan — texnolog moduliga avtomatik o'tkazildi" },
                      { status: "rejected",                  desc: "Rad etilgan" },
                      { status: "archived",                  desc: "Arxivlangan" },
                    ]).map(({ status, desc }) => (
                      <div key={status} className="flex items-start gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="text-xs text-[var(--ep-green)] dark:text-green-400 font-medium">Approved → pending_tech trigger</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Dizayn tasdiqlanganda papkaOrders.status = "pending_tech" ga o'zgaradi — texnolog moduli avtomatik signal oladi</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Natijalar tab ───────────────────────────────────────────── */}
          <TabsContent value="results" className="mt-4">
            <ResultsTab
              generatedDesigns={generatedDesigns}
              checksMap={checksMap}
              mockupMap={mockupMap}
              verifyingDesignId={verifyingDesignId}
              onVerify={handleVerify}
              onMockup={handleMockup}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </TabsContent>

          {/* ─── Tooling tab ─────────────────────────────────────────────── */}
          <TabsContent value="tooling" className="mt-4"><ToolingTab /></TabsContent>

          {/* ─── Revision tarixi tab ─────────────────────────────────────── */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Revision Tarixi</CardTitle>
                  <Select value={revisionsOrderId || ""} onValueChange={setRevisionsOrderId}>
                    <SelectTrigger className="w-64 h-9" data-testid="select-revision-order"><SelectValue placeholder="Buyurtmani tanlang" /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(orders) ? orders : []).map((o) => (
                        <SelectItem key={o.order.id} value={o.order.id}>{o.order.orderNumber} — {o.order.productName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {!revisionsOrderId ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Revision tarixini ko'rish uchun buyurtmani tanlang</p>
                  </div>
                ) : revisions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground"><p className="text-sm">Hali revision yozuvi yo'q</p></div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(revisions) ? revisions : []).map((rev) => (
                      <div key={rev.id} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30" data-testid={`revision-${rev.id}`}>
                        <div className="text-xs font-bold text-muted-foreground whitespace-nowrap">#{rev.revision_number}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {rev.from_status && <Badge variant="outline" className={`text-xs ${STATUS_COLORS[rev.from_status] || ""}`}>{STATUS_LABELS[rev.from_status] || rev.from_status}</Badge>}
                            {rev.from_status && <span className="text-gray-400 text-xs">→</span>}
                            <Badge className={`text-xs ${STATUS_COLORS[rev.to_status] || ""}`}>{STATUS_LABELS[rev.to_status] || rev.to_status}</Badge>
                            <Badge variant="outline" className="text-xs">{rev.revision_type}</Badge>
                          </div>
                          {rev.change_summary && <p className="text-xs text-muted-foreground">{rev.change_summary}</p>}
                          <div className="text-xs text-muted-foreground">{rev.requested_by_name || "Tizim"} — {new Date(rev.requested_at).toLocaleString("uz")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
