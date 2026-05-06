/**
 * PosWarehousePage — POS ↔ Warehouse integratsiya sahifasi.
 *
 * Real-time stok ko'rsatish, movement yaratish, stock alerts.
 * Backend: /api/pos/wh/* endpoints.
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, Search, AlertTriangle, ArrowUpDown, Plus,
  TrendingDown, Boxes, Building2, ScanBarcode, History,
} from "lucide-react";
import { toArray } from "@/lib/safe-array";

interface StockItem {
  id: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  materialNameRu: string;
  category: string;
  materialType: string;
  unit: string;
  quantity: string;
  reserved: string;
  available: string;
  minStock: string;
  maxStock: string;
  unitPrice: string;
  currency: string;
  stockStatus: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVER_STOCK';
}

interface Warehouse {
  id: number;
  code: string;
  name: string;
  type: string;
}

interface MovementHistory {
  id: number;
  materialId: number;
  materialName: string;
  movementType: string;
  quantity: string;
  unit: string;
  performedByName?: string;
  reason?: string;
  createdAt: string;
}

const STOCK_STATUS_LABELS: Record<string, string> = {
  OK: "Yaxshi",
  LOW_STOCK: "Kam qoldi",
  OUT_OF_STOCK: "Tugadi",
  OVER_STOCK: "Ortiqcha",
};

const STOCK_STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OK: "secondary",
  LOW_STOCK: "outline",
  OUT_OF_STOCK: "destructive",
  OVER_STOCK: "default",
};

const MOVEMENT_TYPES = [
  { value: "EXTERNAL_IN",      label: "Tashqi kirim",      requiresFrom: false, requiresTo: true },
  { value: "EXTERNAL_OUT",     label: "Tashqi chiqim",     requiresFrom: true,  requiresTo: false },
  { value: "INTERNAL_ISSUE",   label: "Bo'limga berish",   requiresFrom: true,  requiresTo: true },
  { value: "INTERNAL_RETURN",  label: "Qaytarish",         requiresFrom: false, requiresTo: true },
  { value: "INTERNAL_TRANSFER","label": "Ombor ko'chirish", requiresFrom: true, requiresTo: true } as never,
  { value: "INTERNAL_TRANSFER",label: "Ombor ko'chirish",  requiresFrom: true,  requiresTo: true },
  { value: "DAMAGE",           label: "Zarar akti",         requiresFrom: true,  requiresTo: false },
];

export default function PosWarehousePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Filterlar
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  // Movement modal
  const [movementOpen, setMovementOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [movementForm, setMovementForm] = useState({
    movementType: "INTERNAL_ISSUE",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: "",
    reason: "",
    barcode: "",
  });

  // Real-time stock
  const { data: stockRaw, isLoading } = useQuery({
    queryKey: ["/api/pos/wh/stock", { warehouseId: warehouseFilter !== "all" ? warehouseFilter : "", category: categoryFilter !== "all" ? categoryFilter : "", onlyAvailable: String(onlyAvailable), search }],
  });
  const stockItems = toArray<StockItem>(stockRaw);

  // Warehouses (filter dropdown uchun)
  const { data: warehousesRaw } = useQuery({
    queryKey: ["/api/warehouses"],
  });
  const warehouses = toArray<Warehouse>(warehousesRaw);

  // Stock alerts
  const { data: alertsRaw } = useQuery({
    queryKey: ["/api/pos/wh/alerts"],
  });
  const alerts = toArray<StockItem>(alertsRaw);

  // Movement history
  const { data: historyRaw } = useQuery({
    queryKey: ["/api/pos/wh/movements", { limit: "20" }],
  });
  const history = toArray<MovementHistory>(historyRaw);

  // Movement create
  const createMovement = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest("POST", "/api/pos/wh/movements", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Movement yaratildi", description: "Stok yangilandi" });
      qc.invalidateQueries({ queryKey: ["/api/pos/wh/stock"] });
      qc.invalidateQueries({ queryKey: ["/api/pos/wh/alerts"] });
      qc.invalidateQueries({ queryKey: ["/api/pos/wh/movements"] });
      setMovementOpen(false);
      setMovementForm({ movementType: "INTERNAL_ISSUE", fromWarehouseId: "", toWarehouseId: "", quantity: "", reason: "", barcode: "" });
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Xatolik",
        description: err?.message ?? "Movement yaratish bajarilmadi",
        variant: "destructive",
      });
    },
  });

  // KPI lar
  const kpis = useMemo(() => {
    const totalValue = stockItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);
    const totalQty = stockItems.reduce((sum, i) => sum + Number(i.quantity), 0);
    const lowStock = stockItems.filter(i => i.stockStatus === "LOW_STOCK").length;
    const outOfStock = stockItems.filter(i => i.stockStatus === "OUT_OF_STOCK").length;
    return { totalValue, totalQty, lowStock, outOfStock, itemCount: stockItems.length };
  }, [stockItems]);

  const categories = useMemo(() => {
    const set = new Set(stockItems.map(i => i.category).filter(Boolean));
    return Array.from(set);
  }, [stockItems]);

  const handleQuickIssue = (item: StockItem) => {
    setSelectedItem(item);
    setMovementForm({
      movementType: "INTERNAL_ISSUE",
      fromWarehouseId: String(item.warehouseId),
      toWarehouseId: "",
      quantity: "1",
      reason: "",
      barcode: "",
    });
    setMovementOpen(true);
  };

  const handleSubmitMovement = () => {
    if (!selectedItem) return;
    if (!movementForm.quantity || Number(movementForm.quantity) <= 0) {
      toast({ title: "Miqdor noto'g'ri", variant: "destructive" });
      return;
    }
    createMovement.mutate({
      movementType: movementForm.movementType,
      fromWarehouseId: movementForm.fromWarehouseId ? Number(movementForm.fromWarehouseId) : undefined,
      toWarehouseId: movementForm.toWarehouseId ? Number(movementForm.toWarehouseId) : undefined,
      materialCardId: selectedItem.materialId,
      quantity: Number(movementForm.quantity),
      reason: movementForm.reason,
      barcode: movementForm.barcode || undefined,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            POS — Warehouse
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time stok va movement boshqaruvi
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Material turlari</p>
          <p className="text-2xl font-bold">{kpis.itemCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Jami miqdor</p>
          <p className="text-2xl font-bold">{kpis.totalQty.toLocaleString('uz-UZ', { maximumFractionDigits: 0 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Jami qiymat (UZS)</p>
          <p className="text-xl font-bold">{(kpis.totalValue / 1000000).toFixed(1)}M</p>
        </CardContent></Card>
        <Card className="border-orange-500/50"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Kam qoldi</p>
          <p className="text-2xl font-bold text-orange-500">{kpis.lowStock}</p>
        </CardContent></Card>
        <Card className="border-destructive/50"><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Tugadi</p>
          <p className="text-2xl font-bold text-destructive">{kpis.outOfStock}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock"><Boxes className="h-4 w-4 mr-1" /> Stok</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="h-4 w-4 mr-1" /> Ogohlantirishlar ({alerts.length})</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1" /> Tarix</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Material kod, nom yoki barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-44"><Building2 className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Ombor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha omborlar</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setOnlyAvailable(!onlyAvailable)}>
              {onlyAvailable ? "Faqat mavjud" : "Hammasi"}
            </Button>
          </div>

          {/* Stock table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Ombor</TableHead>
                    <TableHead className="text-right">Miqdor</TableHead>
                    <TableHead className="text-right">Min/Max</TableHead>
                    <TableHead className="text-right">Narx</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                  )}
                  {!isLoading && stockItems.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Hech narsa topilmadi</TableCell></TableRow>
                  )}
                  {stockItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.materialName}</div>
                        <div className="text-xs text-muted-foreground">{item.materialCode} · {item.category}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.warehouseCode}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(item.available).toLocaleString('uz-UZ')} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {Number(item.minStock).toFixed(0)}/{Number(item.maxStock).toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {Number(item.unitPrice).toLocaleString('uz-UZ')} {item.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STOCK_STATUS_COLORS[item.stockStatus]} className="text-xs">
                          {STOCK_STATUS_LABELS[item.stockStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleQuickIssue(item)}>
                          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                          Movement
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Stok ogohlantirishlari</CardTitle></CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Hech qanday ogohlantirish yo'q ✅</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Material</TableHead><TableHead>Ombor</TableHead>
                    <TableHead className="text-right">Mavjud</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {alerts.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">{a.materialName}</TableCell>
                        <TableCell><Badge variant="outline">{a.warehouseCode}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{Number(a.available).toFixed(0)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{Number(a.minStock).toFixed(0)}</TableCell>
                        <TableCell><Badge variant={STOCK_STATUS_COLORS[a.stockStatus]}>{STOCK_STATUS_LABELS[a.stockStatus]}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Oxirgi 20 movement</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Tur</TableHead><TableHead>Material</TableHead>
                  <TableHead className="text-right">Miqdor</TableHead>
                  <TableHead>Foydalanuvchi</TableHead><TableHead>Sabab</TableHead>
                  <TableHead className="text-right">Sana</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell><Badge variant="outline" className="text-xs">{h.movementType}</Badge></TableCell>
                      <TableCell className="text-sm">{h.materialName}</TableCell>
                      <TableCell className="text-right font-mono">{Number(h.quantity).toFixed(2)} {h.unit}</TableCell>
                      <TableCell className="text-xs">{h.performedByName ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.reason ?? '—'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString('uz-UZ', { timeStyle: 'short', dateStyle: 'short' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement modal */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedItem && (
              <div className="p-2 bg-muted rounded text-sm">
                <div className="font-medium">{selectedItem.materialName}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedItem.materialCode} · {selectedItem.warehouseCode} · {selectedItem.available} {selectedItem.unit}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium">Movement turi</label>
              <Select value={movementForm.movementType} onValueChange={(v) => setMovementForm(f => ({ ...f, movementType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.filter((m, i, arr) => arr.findIndex(x => x.value === m.value) === i).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Qaerdan</label>
                <Select value={movementForm.fromWarehouseId} onValueChange={(v) => setMovementForm(f => ({ ...f, fromWarehouseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Ombor" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Qayerga</label>
                <Select value={movementForm.toWarehouseId} onValueChange={(v) => setMovementForm(f => ({ ...f, toWarehouseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Ombor" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Miqdor *</label>
              <Input
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Sabab</label>
              <Input
                value={movementForm.reason}
                onChange={(e) => setMovementForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Nima uchun?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSubmitMovement} disabled={createMovement.isPending}>
              {createMovement.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
