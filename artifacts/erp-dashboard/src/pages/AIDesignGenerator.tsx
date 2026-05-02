import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, AlertCircle,
  Box, ClipboardList, Wrench, ShieldCheck, History, Eye
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

// ─── Status zanjiri konstantalari ────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  new:                       "Yangi",
  ai_generated:              "AI Generatsiya",
  designer_review:           "Dizayner ko'rmoqda",
  waiting_customer_approval: "Mijoz tasdig'i",
  revision_requested:        "Tahrirlash",
  approved:                  "Tasdiqlangan",
  rejected:                  "Rad etilgan",
  archived:                  "Arxiv",
};

const STATUS_COLORS: Record<string, string> = {
  new:                       "bg-slate-100 text-slate-700 border-slate-300",
  ai_generated:              "bg-purple-100 text-purple-700 border-purple-300",
  designer_review:           "bg-blue-100 text-blue-700 border-blue-300",
  waiting_customer_approval: "bg-yellow-100 text-yellow-700 border-yellow-300",
  revision_requested:        "bg-orange-100 text-orange-700 border-orange-300",
  approved:                  "bg-green-100 text-green-700 border-green-300",
  rejected:                  "bg-red-100 text-red-700 border-red-300",
  archived:                  "bg-gray-100 text-gray-500 border-gray-300",
};

const STATUS_CHAIN = [
  "new", "ai_generated", "designer_review",
  "waiting_customer_approval", "revision_requested", "approved",
];

const AI_CHECK_LABELS: Record<string, string> = {
  spelling_uz:  "UZ imlosi",
  spelling_ru:  "RU imlosi",
  spelling_en:  "EN imlosi",
  bleed:        "Bleed (3mm)",
  cmyk:         "CMYK rang",
  logo_quality: "Logo sifati",
  overall:      "Umumiy",
};

// ─── Interfacelar ─────────────────────────────────────────────────────────────
interface DesignOrder {
  order: {
    id: string; orderNumber: string; productName: string;
    clientName: string; status: string; productType: string;
  };
}

interface GeneratedDesign {
  id: string; imageUrl?: string; title: string;
  slogan?: string; version: number; orderId: string; status: string;
}

interface AiCheckResult {
  check_type: string; status: string; score: number;
  issues: string[]; details: Record<string, unknown>;
}

interface RevisionRecord {
  id: string; revision_number: number; from_status?: string;
  to_status: string; change_summary?: string; requested_by_name?: string;
  requested_at: string; revision_type: string;
}

// ─── Status zanjiri komponenti ────────────────────────────────────────────────
function StatusChain({ current }: { current: string }) {
  const idx = STATUS_CHAIN.indexOf(current);
  return (
    <div className="flex items-center gap-1 flex-wrap" data-testid="status-chain">
      {(Array.isArray(STATUS_CHAIN) ? STATUS_CHAIN : []).map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
            s === current
              ? STATUS_COLORS[s]
              : i < idx
              ? "bg-green-50 text-green-600 border-green-200"
              : "bg-gray-50 text-gray-400 border-gray-200"
          }`}>
            {i < idx && s !== current ? "✓ " : ""}{STATUS_LABELS[s] || s}
          </span>
          {i < STATUS_CHAIN.length - 1 && (
            <span className="text-gray-300 text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── AI Tekshiruv paneli ─────────────────────────────────────────────────────
function AiCheckPanel({
  designId, checks, isVerifying, onVerify,
}: {
  designId: string;
  checks: AiCheckResult[];
  isVerifying: boolean;
  onVerify: (designId: string) => void;
}) {
  const allChecks = ["spelling_uz", "spelling_ru", "spelling_en", "bleed", "cmyk", "logo_quality", "overall"];
  const checkMap: Record<string, AiCheckResult> = {};
  for (const c of checks) checkMap[c.check_type] = c;

  return (
    <div className="space-y-3" data-testid="ai-check-panel">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          AI Sifat Tekshiruvi
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onVerify(designId)}
          disabled={isVerifying}
          data-testid="button-ai-verify"
        >
          {isVerifying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
          Tekshirish
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Array.isArray(allChecks) ? allChecks : []).map((ct) => {
          const result = checkMap[ct];
          return (
            <div key={ct} className={`flex items-center justify-between p-2 rounded-md border text-xs ${
              !result ? "bg-gray-50 border-gray-200" :
              result.status === "passed" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`} data-testid={`check-${ct}`}>
              <span className="font-medium text-gray-700">{AI_CHECK_LABELS[ct]}</span>
              {!result ? (
                <span className="text-gray-400">—</span>
              ) : result.status === "passed" ? (
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {result.score?.toFixed(0)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-700">
                  <XCircle className="h-3 w-3" />
                  {result.score?.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {checks.length > 0 && (
        <div className="space-y-2">
          {(Array.isArray(checks) ? checks : []).filter((c) => c.status === "failed" && (c.issues?.length ?? 0) > 0)
            .map((c) => (
              <div key={c.check_type} className="text-xs text-red-600 bg-red-50 rounded-md p-2 border border-red-200">
                <span className="font-medium">{AI_CHECK_LABELS[c.check_type]}:</span>
                <ul className="mt-1 list-disc ml-4 space-y-0.5">
                  {(c.issues || []).map((issue, i) => (
                    <li key={`k-${i}`}>{issue}</li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Asosiy komponent ─────────────────────────────────────────────────────────
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

  const { data: orders = [], isError, refetch } = useQuery<DesignOrder[]>({
    queryKey: ["/api/design/orders"],
  });

  const { data: templates = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/design/templates"],
  });

  const { data: dashboardData } = useQuery<{
    byStatus: Record<string, number>;
    totalOrders: number;
    pendingApproval: number;
    failedChecks: number;
    wornTooling: number;
  }>({
    queryKey: ["/api/design/dashboard/summary"],
  });

  const { data: revisions = [] } = useQuery<RevisionRecord[]>({
    queryKey: ["/api/design/orders", revisionsOrderId, "revisions"],
    enabled: !!revisionsOrderId,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/design/generate", data),
    onSuccess: (data) => {
      setGeneratedDesigns(data.designs || []);
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
      toast({
        title: "Dizaynlar yaratildi!",
        description: `${data.designs?.length || 0} ta AI dizayn ${data.generationTime || 0}s ichida yaratildi`,
      });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Dizayn yaratishda xatolik", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      apiRequest("PATCH", `/api/design/orders/${orderId}/status`, { newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
      toast({ title: "Holat yangilandi!" });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const activeOrders = (Array.isArray(orders) ? orders : []).filter((o) =>
    !["rejected", "archived"].includes(o.order.status)
  );

  const selectedOrder = (Array.isArray(orders) ? orders : []).find((o) => o.order.id === selectedOrderId);

  const handleGenerate = () => {
    if (!selectedOrderId) {
      toast({ title: "Buyurtmani tanlang", variant: "destructive" });
      return;
    }
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
    } catch {
      toast({ title: "Tekshiruv xatoligi", variant: "destructive" });
    } finally {
      setVerifyingDesignId(null);
    }
  };

  const handleMockup = async (design: GeneratedDesign) => {
    try {
      const result = await apiRequest("POST", `/api/design/${design.id}/mockup`, {
        productType: selectedOrder?.order?.productType || "quti",
      });
      setMockupMap((prev) => ({ ...prev, [design.id]: result.mockupUrl }));
      toast({ title: "3D Mockup yaratildi!" });
    } catch {
      toast({ title: "Mockup xatoligi", variant: "destructive" });
    }
  };

  const handleApprove = async (designId: string, orderId: string) => {
    try {
      await apiRequest("POST", `/api/design/${designId}/approve`, {});
      await statusMutation.mutateAsync({ orderId, newStatus: "approved" });
      toast({ title: "Dizayn tasdiqlandi!", description: "Texnolog moduliga o'tkazildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
    } catch {
      toast({ title: "Tasdiqlash xatoligi", variant: "destructive" });
    }
  };

  const handleReject = async (designId: string) => {
    try {
      await apiRequest("POST", `/api/design/${designId}/reject`, { reason: "Mijoz tomonidan rad etildi" });
      toast({ title: "Dizayn rad etildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/design/orders"] });
    } catch {
      toast({ title: "Xatolik", variant: "destructive" });
    }
  };

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              AI Dizayn Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              GPT-4o + Gemini 2.5 Flash bilan professional dizaynlar yarating
            </p>
          </div>
          {dashboardData && (
            <div className="flex gap-3 flex-wrap">
              <Card className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Jami buyurtmalar</div>
                <div className="text-xl font-bold text-foreground">{dashboardData.totalOrders}</div>
              </Card>
              <Card className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Tasdiq kutmoqda</div>
                <div className="text-xl font-bold text-yellow-600">{dashboardData.pendingApproval}</div>
              </Card>
              <Card className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Muammo topilgan</div>
                <div className="text-xl font-bold text-red-600">{dashboardData.failedChecks}</div>
              </Card>
              <Card className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Eskirgan asbob</div>
                <div className="text-xl font-bold text-orange-600">{dashboardData.wornTooling}</div>
              </Card>
            </div>
          )}
        </div>

        {/* ─── Asosiy tabs ─────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-main">
            <TabsTrigger value="generate" data-testid="tab-generate">
              <Sparkles className="h-4 w-4 mr-1" />
              Generatsiya
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">
              <Eye className="h-4 w-4 mr-1" />
              Natijalar ({generatedDesigns.length})
            </TabsTrigger>
            <TabsTrigger value="tooling" data-testid="tab-tooling">
              <Wrench className="h-4 w-4 mr-1" />
              Asboblar
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-1" />
              Revision tarixi
            </TabsTrigger>
          </TabsList>

          {/* ─── Generatsiya tab ────────────────────────────────────────────── */}
          <TabsContent value="generate" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Sozlamalar</CardTitle>
                  <CardDescription>Dizayn parametrlari</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Buyurtma *</Label>
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger data-testid="select-order">
                        <SelectValue placeholder="Buyurtmani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(activeOrders) ? activeOrders : []).map((o) => (
                          <SelectItem key={o.order.id} value={o.order.id}>
                            {o.order.orderNumber} — {o.order.productName}
                          </SelectItem>
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
                      <SelectTrigger data-testid="select-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {([1, 2, 3, 4, 5]).map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} ta</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Maxsus Prompt (ixtiyoriy)</Label>
                    <Textarea
                      placeholder="Ranglar, stil, maxsus talablar..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={4}
                      data-testid="textarea-prompt"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedOrderId || generateMutation.isPending}
                    className="w-full"
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yaratilmoqda...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" />AI Dizayn Yaratish</>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    {templates.length} ta brend shablon mavjud
                  </div>
                </CardContent>
              </Card>

              {/* Holat zanjiri haqida ma'lumot */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Dizayn Holat Zanjiri
                  </CardTitle>
                  <CardDescription>
                    8 bosqichli tasdiqlash jarayoni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {([
                      { status: "new", desc: "Yangi dizayn buyurtmasi yaratildi" },
                      { status: "ai_generated", desc: "AI dizayn generatsiya qilindi (GPT-4o + Gemini)" },
                      { status: "designer_review", desc: "Dizayner ko'rib chiqmoqda, AI tekshiruv o'tkazilmoqda" },
                      { status: "waiting_customer_approval", desc: "Menejer orqali mijozga taqdim etildi" },
                      { status: "revision_requested", desc: "Mijoz tahrirlash so'radi — yangi versiya yaratilmoqda" },
                      { status: "approved", desc: "Tasdiqlangan — texnolog moduliga avtomatik o'tkazildi" },
                      { status: "rejected", desc: "Rad etilgan" },
                      { status: "archived", desc: "Arxivlangan" },
                    ]).map(({ status, desc }) => (
                      <div key={status} className="flex items-start gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap ${STATUS_COLORS[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-700 dark:text-green-400 font-medium">
                      Approved → pending_tech trigger
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Dizayn tasdiqlanganda papkaOrders.status = "pending_tech" ga o'zgaradi — texnolog moduli avtomatik signal oladi
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Natijalar tab ──────────────────────────────────────────────── */}
          <TabsContent value="results" className="mt-4">
            {generatedDesigns.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Hali dizayn yaratilmagan. "Generatsiya" tabiga o'ting va AI Dizayn Yaratish tugmasini bosing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {(Array.isArray(generatedDesigns) ? generatedDesigns : []).map((design) => (
                  <Card key={design.id} data-testid={`card-design-${design.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <CardTitle className="text-base">{design.title}</CardTitle>
                          {design.slogan && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">{design.slogan}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">v{design.version}</Badge>
                          <Badge className={`text-xs ${STATUS_COLORS[design.status] || ""}`}>
                            {STATUS_LABELS[design.status] || design.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Dizayn rasmi */}
                      <div className="aspect-square max-h-64 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        {design.imageUrl ? (
                          <img
                            src={design.imageUrl}
                            alt={design.title}
                            className="w-full h-full object-cover"
                            data-testid={`img-design-${design.id}`}
                          />
                        ) : (
                          <Sparkles className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>

                      {/* 3D Mockup */}
                      {mockupMap[design.id] && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Box className="h-3 w-3" /> 3D Mockup
                          </div>
                          <div className="aspect-square max-h-48 bg-muted rounded-md overflow-hidden">
                            <img src={mockupMap[design.id]} alt="3D Mockup" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      )}

                      {/* AI Tekshiruv */}
                      <AiCheckPanel
                        designId={design.id}
                        checks={checksMap[design.id] || []}
                        isVerifying={verifyingDesignId === design.id}
                        onVerify={handleVerify}
                      />

                      {/* Amallar */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMockup(design)}
                          data-testid={`button-mockup-${design.id}`}
                        >
                          <Box className="h-3 w-3 mr-1" />
                          3D Mockup
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(design.id, design.orderId)}
                          data-testid={`button-approve-${design.id}`}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Tasdiqlash
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleReject(design.id)}
                          data-testid={`button-reject-${design.id}`}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rad etish
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Tooling tab ────────────────────────────────────────────────── */}
          <TabsContent value="tooling" className="mt-4">
            <ToolingTab />
          </TabsContent>

          {/* ─── Revision tarixi tab ─────────────────────────────────────────── */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Revision Tarixi
                  </CardTitle>
                  <Select value={revisionsOrderId || ""} onValueChange={setRevisionsOrderId}>
                    <SelectTrigger className="w-64" data-testid="select-revision-order">
                      <SelectValue placeholder="Buyurtmani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(orders) ? orders : []).map((o) => (
                        <SelectItem key={o.order.id} value={o.order.id}>
                          {o.order.orderNumber} — {o.order.productName}
                        </SelectItem>
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
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="text-sm">Hali revision yozuvi yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(revisions) ? revisions : []).map((rev) => (
                      <div
                        key={rev.id}
                        className="flex items-start gap-3 p-3 rounded-md border bg-muted/30"
                        data-testid={`revision-${rev.id}`}
                      >
                        <div className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                          #{rev.revision_number}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {rev.from_status && (
                              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[rev.from_status] || ""}`}>
                                {STATUS_LABELS[rev.from_status] || rev.from_status}
                              </Badge>
                            )}
                            {rev.from_status && <span className="text-gray-400 text-xs">→</span>}
                            <Badge className={`text-xs ${STATUS_COLORS[rev.to_status] || ""}`}>
                              {STATUS_LABELS[rev.to_status] || rev.to_status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{rev.revision_type}</Badge>
                          </div>
                          {rev.change_summary && (
                            <p className="text-xs text-muted-foreground">{rev.change_summary}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {rev.requested_by_name || "Tizim"} —{" "}
                            {new Date(rev.requested_at).toLocaleString("uz")}
                          </div>
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

// ─── Tooling sub-komponent ───────────────────────────────────────────────────
function ToolingTab() {
  const { toast } = useToast();
  const [forecastId, setForecastId] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<Record<string, unknown> | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const { data: toolingList = [], isLoading } = useQuery<Array<Record<string, unknown>>>({
    queryKey: ["/api/design/tooling"],
  });

  const handleForecast = async (id: string) => {
    setForecastId(id);
    setForecastLoading(true);
    try {
      const result = await apiRequest("GET", `/api/design/tooling/${id}/wear-forecast`);
      setForecastData(result);
      toast({ title: "Eskirish prognozi hisoblandi!" });
    } catch {
      toast({ title: "Prognoz xatoligi", variant: "destructive" });
    } finally {
      setForecastLoading(false);
    }
  };

  const TOOLING_LABELS: Record<string, string> = {
    cliche: "Kleche", plate: "Plastina", mold: "Qolip",
    die_cut: "Biglovka", cylinder: "Silindr", screen: "Trubka",
    flexo: "Flexo val", gravure: "Gravür", offset: "Offset", digital: "Raqamli",
  };

  const STATUS_BADGE: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    maintenance: "bg-blue-100 text-blue-700",
    worn: "bg-red-100 text-red-700",
    retired: "bg-gray-100 text-gray-500",
    ordered: "bg-yellow-100 text-yellow-700",
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Bosma Asboblar va Qoliplar</h3>
          <p className="text-xs text-muted-foreground">10 tur — eskirish prognozi bilan</p>
        </div>
        <Badge variant="outline">{toolingList.length} ta asbob</Badge>
      </div>

      {toolingList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Hali asbob/qolip ro'yxati bo'sh</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(Array.isArray(toolingList) ? toolingList : []).map((tool) => {
            const wear = Number(tool.wear_percentage || 0);
            const isForecastShown = forecastId === tool.id && forecastData;
            return (
              <Card key={tool.id as string} data-testid={`card-tooling-${tool.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm">{tool.name as string}</div>
                      <div className="text-xs text-muted-foreground">{tool.tooling_number as string}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {TOOLING_LABELS[tool.tooling_type as string] || tool.tooling_type as string}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_BADGE[tool.status as string] || "bg-gray-100 text-gray-600"}`}>
                        {tool.status as string}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Eskirish</span>
                      <span className={`font-medium ${wear >= 90 ? "text-red-600" : wear >= 70 ? "text-orange-600" : "text-green-600"}`}>
                        {wear.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={wear}
                      className={`h-2 ${wear >= 90 ? "[&>div]:bg-red-500" : wear >= 70 ? "[&>div]:bg-orange-500" : "[&>div]:bg-green-500"}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Number(tool.total_usage_count || 0).toLocaleString()} ta</span>
                      <span>Maks: {Number(tool.max_usage_count || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {!!tool.location && (
                    <div className="text-xs text-muted-foreground">
                      Joylashuv: {String(tool.location)}
                    </div>
                  )}

                  {isForecastShown && forecastData && (
                    <div className="mt-2 p-3 bg-muted rounded-md space-y-2 border">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <AlertCircle className={`h-3 w-3 ${forecastData.riskLevel === 'critical' ? 'text-red-600' : forecastData.riskLevel === 'high' ? 'text-orange-500' : 'text-green-600'}`} />
                        Risk: {String(forecastData.riskLevel ?? "")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Taxminiy eskirish: {String(forecastData.forecastDate ?? "")} ({Number(forecastData.daysLeft ?? 0)} kun)
                      </div>
                      {!!forecastData.aiRecommendation && (
                        <div className="text-xs text-foreground">{String(forecastData.aiRecommendation)}</div>
                      )}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleForecast(tool.id as string)}
                    disabled={forecastLoading && forecastId === tool.id}
                    data-testid={`button-forecast-${tool.id}`}
                  >
                    {forecastLoading && forecastId === tool.id ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Hisoblanmoqda...</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Eskirish Prognozi (AI)</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
