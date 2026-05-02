import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Zap, Search, Download, RefreshCw, TrendingDown, Eye, Loader2 } from "lucide-react";

interface BackendOperation {
  step?: number;
  equipmentType?: string;
  duration?: number;
  durationMinutes?: number;
  description?: string;
  operationDescription?: string;
}

interface BackendNorm {
  materialName: string;
  normQuantityPer1000: number;
  unit: string;
  wastePercentage?: number;
}

interface TechCard {
  id: string;
  name: string;
  productType: string;
  formatA: number;
  formatB: number;
  totalDurationMinutes?: number;
  setupDurationMinutes?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  calculatedByAI?: boolean;
  basedOnOrdersCount?: number;
  operations?: Array<{
    operationName: string;
    machineCode: string;
    setupTime: number;
    machineTime: number;
    sequence: number;
  }>;
  materials?: Array<{
    materialName: string;
    quantity: number;
    unit: string;
    wastagePercent: number;
  }>;
}

function mapBackendCard(raw: Record<string, unknown>): TechCard {
  const productType = (raw.productType as string) || "Noma'lum";
  const formatA = Number(raw.formatA) || 0;
  const formatB = Number(raw.formatB) || 0;
  const name = `${productType} — ${formatA}x${formatB} mm`;

  const rawOps: BackendOperation[] = [];
  if (raw.operations) {
    try {
      const parsed = typeof raw.operations === "string" ? JSON.parse(raw.operations) : raw.operations;
      if (Array.isArray(parsed)) rawOps.push(...parsed);
    } catch { /* ignore */ }
  }
  const operations = (rawOps ?? []).map((op, i) => ({
    sequence: (op.step ?? i + 1),
    operationName: op.description || op.operationDescription || op.equipmentType || `Operatsiya ${i + 1}`,
    machineCode: op.equipmentType || "-",
    setupTime: 0,
    machineTime: op.durationMinutes ?? op.duration ?? 0,
  }));

  const rawNorms = (raw.norms as BackendNorm[] | undefined) || [];
  const materials = (Array.isArray(rawNorms) ? rawNorms : []).map((n) => ({
    materialName: n.materialName,
    quantity: Number(n.normQuantityPer1000) || 0,
    unit: n.unit || "kg",
    wastagePercent: Number(n.wastePercentage) || 0,
  }));

  return {
    id: raw.id as string,
    name,
    productType,
    formatA,
    formatB,
    totalDurationMinutes: Number(raw.totalDurationMinutes) || 0,
    setupDurationMinutes: Number(raw.setupDurationMinutes) || 0,
    notes: raw.notes as string | undefined,
    isActive: raw.isActive !== false,
    createdAt: (raw.createdAt as string) || new Date().toISOString(),
    calculatedByAI: Boolean(raw.calculatedByAI),
    basedOnOrdersCount: Number(raw.basedOnOrdersCount) || 0,
    operations,
    materials,
  };
}

interface OptimizeResult {
  cardId: string;
  cardName: string;
  totalMaterialCost: number;
  materialCount: number;
  optimizationSuggestions: Array<{
    material: string;
    currentWastage: number;
    suggestedWastage: number;
    saving: number;
  }>;
  estimatedSaving: number;
  optimizationScore: number;
}

interface PapkaOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  formatA?: number;
  formatB?: number;
  tiraj?: number;
  status: string;
}

export default function TechCards() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<TechCard | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [genDialog, setGenDialog] = useState(false);
  const [genOrder, setGenOrder] = useState<PapkaOrder | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  const { data: cards = [], isLoading } = useQuery<TechCard[]>({
    queryKey: ["/api/technology/cards"],
    queryFn: async () => {
      const res = await fetch("/api/technology/cards", { credentials: "include" });
      if (!res.ok) throw new Error("Kartalarni yuklashda xatolik");
      const raw: Record<string, unknown>[] = await res.json();
      return (Array.isArray(raw) ? raw : []).map(mapBackendCard);
    }
  });

  const { data: orders = [] } = useQuery<PapkaOrder[]>({
    queryKey: ["/api/papka-orders", "pending_tech"],
    queryFn: async () => {
      const res = await fetch("/api/papka-orders?status=pending_tech", { credentials: "include" });
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await fetch(`/api/technology/cards/${cardId}/optimize`, { credentials: "include" });
      if (!res.ok) throw new Error("Optimizatsiya xatoligi");
      return res.json() as Promise<OptimizeResult>;
    },
    onSuccess: (data) => {
      setOptimizeResult(data);
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
  });

  const generateCard = async (order: PapkaOrder) => {
    setGenLoading(true);
    try {
      await apiRequest("POST", "/api/technology/cards/generate", {
        formatA: order.formatA || 400,
        formatB: order.formatB || 300,
        productType: "3_layer",
        papkaOrderId: order.id,
      });
      toast({ title: "Muvaffaqiyat", description: "AI texnologik karta yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/technology/cards"] });
      setGenDialog(false);
    } catch (err: unknown) {
      const e = err as Error;
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setGenLoading(false);
    }
  };

  const viewCard = async (card: TechCard) => {
    try {
      const res = await fetch(`/api/technology/cards/${card.id}`, { credentials: "include" });
      if (res.ok) {
        const raw = await res.json();
        setSelectedCard(mapBackendCard(raw));
      } else {
        setSelectedCard(card);
      }
    } catch {
      setSelectedCard(card);
    }
    setShowViewModal(true);
  };

  const exportPDF = (card: TechCard) => {
    const opsRows = card.operations && card.operations.length > 0
      ? card.operations?.map((op, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${op.operationName}</td>
          <td>${op.machineCode}</td>
          <td style="text-align:center">${op.setupTime}</td>
          <td style="text-align:center">${op.machineTime}</td>
        </tr>`).join("")
      : `<tr><td colspan="5" style="text-align:center;color:#888">Operatsiyalar mavjud emas</td></tr>`;

    const matRows = card.materials && card.materials.length > 0
      ? card.materials?.map((m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${m.materialName}</td>
          <td style="text-align:center">${m.quantity}</td>
          <td style="text-align:center">${m.unit}</td>
          <td style="text-align:center">${m.wastagePercent}%</td>
        </tr>`).join("")
      : `<tr><td colspan="5" style="text-align:center;color:#888">Materiallar mavjud emas</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>Texnologik Karta — ${card.name}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
    .logo { font-weight: bold; font-size: 20px; color: #333; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 16px; }
    .meta-item { display: flex; gap: 6px; }
    .meta-label { color: #666; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f0f0f0; padding: 6px 8px; text-align: left; border: 1px solid #ccc; font-size: 11px; text-transform: uppercase; }
    td { padding: 5px 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #fafafa; }
    h3 { font-size: 13px; text-transform: uppercase; color: #444; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; color: #888; font-size: 11px; display: flex; justify-content: space-between; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; background: ${card.isActive ? "#d1fae5" : "#f3f4f6"}; color: ${card.isActive ? "#065f46" : "#374151"}; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">EUROPRINT ERP</div>
    <h1>Texnologik Karta</h1>
    <div>${card.name} <span class="badge">${card.isActive ? "Faol" : "Nofaol"}</span></div>
  </div>

  <h3>Umumiy ma'lumotlar</h3>
  <div class="meta">
    <div class="meta-item"><span class="meta-label">Mahsulot turi:</span> ${card.productType}</div>
    <div class="meta-item"><span class="meta-label">Format:</span> ${card.formatA} × ${card.formatB} mm</div>
    <div class="meta-item"><span class="meta-label">Jami davomiylik:</span> ${card.totalDurationMinutes || 0} daqiqa</div>
    <div class="meta-item"><span class="meta-label">Setup vaqti:</span> ${card.setupDurationMinutes || 0} daqiqa</div>
    <div class="meta-item"><span class="meta-label">AI generatsiya:</span> ${card.calculatedByAI ? "Ha" : "Yo'q"}</div>
    <div class="meta-item"><span class="meta-label">Yaratilgan:</span> ${new Date(card.createdAt).toLocaleDateString("uz-UZ")}</div>
    ${card.notes ? `<div class="meta-item" style="grid-column:span 2"><span class="meta-label">Izoh:</span> ${card.notes}</div>` : ""}
  </div>

  <h3>Operatsiyalar (Routing)</h3>
  <table>
    <thead><tr><th>#</th><th>Operatsiya nomi</th><th>Mashina kodi</th><th>Setup (min)</th><th>Mashina (min)</th></tr></thead>
    <tbody>${opsRows}</tbody>
  </table>

  <h3>Materiallar (BOM)</h3>
  <table>
    <thead><tr><th>#</th><th>Material nomi</th><th>Miqdor/1000</th><th>Birlik</th><th>Chiqindi</th></tr></thead>
    <tbody>${matRows}</tbody>
  </table>

  <div class="footer">
    <span>Europrint ERP — Texnologik karta eksporti</span>
    <span>Sana: ${new Date().toLocaleDateString("uz-UZ")} ${new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</span>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      toast({ title: "PDF chop etish", description: `${card.name} — chop etish oynasi ochildi` });
    }
  };

  const filtered = (Array.isArray(cards) ? cards : []).filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.productType?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-6">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6 bg-surface" data-testid="page-tech-cards">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface" data-testid="text-tech-cards-title">
            Texnologik <span className="font-bold text-primary">Kartalar</span>
          </h1>
          <p className="text-on-surface-variant">Ishlab chiqarish texnologik kartalari va AI generatsiya</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami kartalar</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-total-cards">{cards.length}</p>
        </Card>
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Faol</p>
          <p className="text-4xl font-bold tracking-tight text-primary" data-testid="text-active-cards">{(Array.isArray(cards) ? cards : []).filter(c => c.isActive).length}</p>
        </Card>
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Texnolog kutilmoqda</p>
          <p className="text-4xl font-bold tracking-tight text-amber-600" data-testid="text-pending-orders">{orders.length}</p>
        </Card>
      </div>

      {orders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-on-surface">AI Karta Generatsiya qilish</h2>
          <div className="grid gap-2">
            {(Array.isArray(orders) ? orders : []).map(order => (
              <Card key={order.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none" data-testid={`order-tech-${order.id}`}>
                <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-on-surface">{order.papkaNo} — {order.mijozNomi}</p>
                    <p className="text-sm text-on-surface-variant">
                      {order.mahsulotNomi} · Format: {order.formatA || "-"} x {order.formatB || "-"} mm
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
                    onClick={() => { setGenOrder(order); setGenDialog(true); }}
                    data-testid={`btn-generate-card-${order.id}`}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    AI Karta yaratish
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-semibold text-on-surface">Barcha kartalar</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              placeholder="Qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-surface-container-lowest border-none"
              data-testid="input-search-cards"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
            <CardContent className="py-10 text-center">
              <FileText className="h-10 w-10 mx-auto text-on-surface-variant mb-3" />
              <p className="text-on-surface-variant" data-testid="text-no-cards">Texnologik kartalar topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(Array.isArray(filtered) ? filtered : []).map(card => (
              <Card key={card.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none" data-testid={`card-tech-${card.id}`}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base text-on-surface">{card.name}</CardTitle>
                    <p className="text-sm text-on-surface-variant">{card.productType}</p>
                  </div>
                  <Badge className={card.isActive ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" : "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold"}>
                    {card.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-on-surface-variant">Format: </span>
                      <span className="font-medium text-on-surface">{card.formatA || "-"} x {card.formatB || "-"}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Davomiylik: </span>
                      <span className="font-medium text-on-surface">{card.totalDurationMinutes || "-"} min</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">AI: </span>
                      <span className="font-medium text-on-surface">{card.calculatedByAI ? "Ha" : "Yo'q"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
                      onClick={() => viewCard(card)}
                      data-testid={`btn-view-${card.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ko'rish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
                      onClick={() => optimizeMutation.mutate(card.id)}
                      disabled={optimizeMutation.isPending}
                      data-testid={`btn-optimize-${card.id}`}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Optimallashtirish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
                      onClick={() => exportPDF(card)}
                      data-testid={`btn-export-${card.id}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {optimizeResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Optimizatsiya: {optimizeResult.cardName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" data-testid="text-opt-score">{optimizeResult.optimizationScore}%</p>
                <p className="text-sm text-muted-foreground">Samaradorlik bali</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-opt-saving">
                  {(optimizeResult.estimatedSaving / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-muted-foreground">Tejamkorlik (UZS)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" data-testid="text-opt-materials">{optimizeResult.materialCount}</p>
                <p className="text-sm text-muted-foreground">Material turlari</p>
              </div>
            </div>
            {optimizeResult.optimizationSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tavsiyalar:</p>
                {(Array.isArray(optimizeResult.optimizationSuggestions) ? optimizeResult.optimizationSuggestions : []).map((s, i) => (
                  <div key={`k-${i}`} className="text-sm bg-muted/50 rounded-md p-2" data-testid={`text-suggestion-${i}`}>
                    <span className="font-medium">{s.material}</span>: Chiqindi {s.currentWastage}% →{" "}
                    {s.suggestedWastage}% (tejam: {(s.saving / 1000).toFixed(0)}K UZS)
                  </div>
                ))}
              </div>
            )}
            {optimizeResult.optimizationSuggestions.length === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400">Karta allaqachon optimallashtirilgan!</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap" data-testid="text-view-card-title">
                  <FileText className="h-5 w-5" />
                  {selectedCard.name}
                  <Badge variant={selectedCard.isActive ? "default" : "secondary"}>
                    {selectedCard.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Mahsulot turi</p>
                    <p className="font-medium" data-testid="text-view-product-type">{selectedCard.productType}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Format</p>
                    <p className="font-medium" data-testid="text-view-format">{selectedCard.formatA} x {selectedCard.formatB} mm</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Davomiylik</p>
                    <p className="font-medium" data-testid="text-view-layers">{selectedCard.totalDurationMinutes || 0} min</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Setup vaqti</p>
                    <p className="font-medium" data-testid="text-view-cycle">{selectedCard.setupDurationMinutes || 0} min</p>
                  </div>
                </div>

                {selectedCard.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Izoh</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-view-notes">{selectedCard.notes}</p>
                    </div>
                  </>
                )}

                {selectedCard.operations && selectedCard.operations.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Operatsiyalar ({selectedCard.operations.length})</p>
                      <ScrollArea className="max-h-[200px]">
                        <div className="space-y-2">
                          {(Array.isArray(selectedCard.operations) ? selectedCard.operations : []).map((op, i) => (
                            <div key={`k-${i}`} className="flex items-center gap-3 p-2 rounded border text-sm" data-testid={`row-operation-${i}`}>
                              <Badge variant="outline" className="shrink-0">{op.sequence}</Badge>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{op.operationName}</p>
                                <p className="text-xs text-muted-foreground">Mashina: {op.machineCode}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs">Setup: {op.setupTime} min</p>
                                <p className="text-xs text-muted-foreground">Mashina: {op.machineTime} min</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}

                {selectedCard.materials && selectedCard.materials.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Materiallar ({selectedCard.materials.length})</p>
                      <ScrollArea className="max-h-[200px]">
                        <div className="space-y-2">
                          {(Array.isArray(selectedCard.materials) ? selectedCard.materials : []).map((m, i) => (
                            <div key={`k-${i}`} className="flex items-center justify-between gap-3 p-2 rounded border text-sm" data-testid={`row-material-${i}`}>
                              <span className="font-medium">{m.materialName}</span>
                              <div className="text-right shrink-0">
                                <span>{m.quantity} {m.unit}</span>
                                {m.wastagePercent > 0 && (
                                  <span className="text-xs text-muted-foreground ml-2">(chiqindi: {m.wastagePercent}%)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      optimizeMutation.mutate(selectedCard.id);
                      setShowViewModal(false);
                    }}
                    data-testid="btn-modal-optimize"
                  >
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Optimallashtirish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportPDF(selectedCard)}
                    data-testid="btn-modal-export"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={genDialog} onOpenChange={setGenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Texnologik Karta Yaratish</DialogTitle>
          </DialogHeader>
          {genOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                <p><strong>Buyurtma:</strong> {genOrder.papkaNo}</p>
                <p><strong>Mijoz:</strong> {genOrder.mijozNomi}</p>
                <p><strong>Mahsulot:</strong> {genOrder.mahsulotNomi}</p>
                <p><strong>Format:</strong> {genOrder.formatA || "?"} x {genOrder.formatB || "?"} mm</p>
                <p><strong>Tiraj:</strong> {genOrder.tiraj?.toLocaleString() || "?"} dona</p>
              </div>
              <p className="text-sm text-muted-foreground">
                AI avtomatik ravishda format, qatlamlar soni, tsikl vaqti va material normalari asosida texnologik karta yaratadi.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setGenDialog(false)}>Bekor qilish</Button>
            <Button
              onClick={() => genOrder && generateCard(genOrder)}
              disabled={genLoading}
              data-testid="btn-confirm-generate"
            >
              {genLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generatsiya...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  AI bilan yaratish
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
