import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, Settings2, BarChart3, List,
  Search,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PosProduct {
  id: number;
  barcode: string;
  name: string;
  nameRu: string | null;
  category: string | null;
  unitPrice: number;
  unit: string;
  stockQuantity: number | null;
  minStock: number | null;
  isActive: boolean;
}

interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_barcode: string;
  quantity: number;
  type: string;
  reason: string | null;
  before_qty: number;
  after_qty: number;
  performed_by_name: string | null;
  created_at: string;
}

function formatUZS(amount: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(amount) + " so'm";
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  in: { label: "Kirim", color: "text-green-600" },
  out: { label: "Chiqim", color: "text-red-600" },
  adjustment: { label: "Tuzatish", color: "text-blue-600" },
  sale: { label: "Sotuv", color: "text-purple-600" },
  refund: { label: "Qaytarish", color: "text-orange-600" },
};

export default function POSInventoryPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("movements");
  const [adjustProduct, setAdjustProduct] = useState<PosProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState("in");
  const [adjustReason, setAdjustReason] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState("");

  const { data: movementsData, isLoading: movementsLoading, refetch: refetchMovements } = useQuery({
    queryKey: ["/api/pos/inventory/movements", movementFilter],
    queryFn: () => apiRequest("GET", `/api/pos/inventory/movements?type=${movementFilter}&limit=100`),
    refetchInterval: 30000,
  });

  const { data: lowStockData, refetch: refetchLowStock } = useQuery({
    queryKey: ["/api/pos/inventory/low-stock"],
    queryFn: () => apiRequest("GET", "/api/pos/inventory/low-stock"),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["/api/pos/inventory/monthly-report"],
    queryFn: () => apiRequest("GET", "/api/pos/inventory/monthly-report"),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/pos/products", productSearch],
    queryFn: () => apiRequest("GET", `/api/pos/products?search=${encodeURIComponent(productSearch)}&active=all`),
  });

  const movements: InventoryMovement[] = (movementsData as { data: InventoryMovement[] } | undefined)?.data ?? [];
  const lowStock: PosProduct[] = (lowStockData as { products: PosProduct[] } | undefined)?.products ?? [];
  const products: PosProduct[] = Array.isArray(productsData) ? productsData : [];
  const monthlyRows = (monthlyData as { data: Array<{ day: string; type: string; count: string; qty: string }> } | undefined)?.data ?? [];

  const adjustMutation = useMutation({
    mutationFn: ({ productId, quantity, type, reason }: {
      productId: number;
      quantity: number;
      type: string;
      reason: string;
    }) =>
      apiRequest("PATCH", `/api/pos/inventory/${productId}/adjust`, { quantity, type, reason }),
    onSuccess: () => {
      toast({ title: "Inventar yangilandi!" });
      setAdjustProduct(null);
      setAdjustQty("");
      setAdjustReason("");
      setAdjustType("in");
      queryClient.invalidateQueries({ queryKey: ["/api/pos/inventory/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  function handleAdjust() {
    if (!adjustProduct || !adjustQty) return;
    adjustMutation.mutate({
      productId: adjustProduct.id,
      quantity: Number(adjustQty),
      type: adjustType,
      reason: adjustReason,
    });
  }

  const chartData = Object.entries(
    monthlyRows.reduce<Record<string, { day: string; in: number; out: number; sale: number; adjustment: number }>>((acc, row) => {
      const day = new Date(row.day).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
      if (!acc[day]) acc[day] = { day, in: 0, out: 0, sale: 0, adjustment: 0 };
      const typeKey = row.type as keyof typeof acc[string];
      if (typeKey in acc[day]) (acc[day] as unknown as Record<string, number>)[typeKey] += Number(row.qty);
      return acc;
    }, {})
  ).map(([, v]) => v).slice(-14);

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-bold">Inventar Boshqaruvi</h1>
          {lowStock.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStock.length} kam qoldiq
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchMovements(); refetchLowStock(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />Yangilash
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-3 bg-white dark:bg-gray-800 border-b">
            <TabsList>
              <TabsTrigger value="movements"><List className="h-4 w-4 mr-1" />Harakatlar</TabsTrigger>
              <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" />Mahsulotlar</TabsTrigger>
              <TabsTrigger value="low-stock" className="relative">
                <AlertTriangle className="h-4 w-4 mr-1" />Kam qoldiq
                {lowStock.length > 0 && <Badge className="ml-1 h-5 px-1 text-xs bg-red-500">{lowStock.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="chart"><BarChart3 className="h-4 w-4 mr-1" />Grafik</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="movements" className="m-0 p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {(["", "in", "out", "sale", "adjustment", "refund"]).map(t => (
                  <Button
                    key={t}
                    variant={movementFilter === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMovementFilter(t)}
                  >
                    {t === "" ? "Barchasi" : TYPE_LABELS[t]?.label ?? t}
                  </Button>
                ))}
              </div>

              <Card>
                <CardContent className="p-0">
                  {movementsLoading ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />Yuklanmoqda...
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <List className="h-10 w-10 mb-2" />
                      <p>Harakatlar yo'q</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahsulot</TableHead>
                          <TableHead>Tur</TableHead>
                          <TableHead className="text-right">Miqdor</TableHead>
                          <TableHead className="text-right">Oldin</TableHead>
                          <TableHead className="text-right">Keyin</TableHead>
                          <TableHead>Sabab</TableHead>
                          <TableHead>Kim</TableHead>
                          <TableHead>Sana</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(movements) ? movements : []).map(m => {
                          const typeInfo = TYPE_LABELS[m.type] ?? { label: m.type, color: "text-gray-600" };
                          const qty = Number(m.quantity);
                          return (
                            <TableRow key={m.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{m.product_name}</p>
                                  <p className="text-xs text-gray-400 font-mono">{m.product_barcode}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                              </TableCell>
                              <TableCell className={`text-right font-bold ${qty >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {qty >= 0 ? "+" : ""}{qty}
                              </TableCell>
                              <TableCell className="text-right text-gray-500">{m.before_qty ?? "—"}</TableCell>
                              <TableCell className="text-right">{m.after_qty ?? "—"}</TableCell>
                              <TableCell className="text-sm text-gray-500 max-w-32 truncate">{m.reason ?? "—"}</TableCell>
                              <TableCell className="text-sm">{m.performed_by_name ?? "—"}</TableCell>
                              <TableCell className="text-xs text-gray-400">
                                {new Date(m.created_at).toLocaleString("uz-UZ")}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="m-0 p-4 space-y-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Mahsulot qidirish..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card>
                <CardContent className="p-0">
                  {productsLoading ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />Yuklanmoqda...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahsulot</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead>Kategoriya</TableHead>
                          <TableHead className="text-right">Narx</TableHead>
                          <TableHead className="text-right">Qoldiq</TableHead>
                          <TableHead className="text-right">Min</TableHead>
                          <TableHead>Holat</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(products) ? products : []).map(product => {
                          const stock = Number(product.stockQuantity ?? 0);
                          const minStock = Number(product.minStock ?? 0);
                          const isLow = stock <= minStock;
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                              <TableCell>{product.category ?? "—"}</TableCell>
                              <TableCell className="text-right">{formatUZS(Number(product.unitPrice))}</TableCell>
                              <TableCell className={`text-right font-bold ${isLow ? "text-red-600" : "text-green-600"}`}>
                                {stock} {product.unit}
                              </TableCell>
                              <TableCell className="text-right text-gray-400">{minStock}</TableCell>
                              <TableCell>
                                {!product.isActive ? (
                                  <Badge variant="secondary">Nofaol</Badge>
                                ) : isLow ? (
                                  <Badge variant="destructive">Kam</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-600">OK</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAdjustProduct(product)}
                                >
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="low-stock" className="m-0 p-4">
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                  <Package className="h-12 w-12 mb-3 text-green-400" />
                  <p className="text-lg font-medium text-green-600">Barcha mahsulotlar yetarli!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">{lowStock.length} ta mahsulot minimal qoldiqdan kam yoki teng</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(Array.isArray(lowStock) ? lowStock : []).map(product => {
                      const stock = Number(product.stockQuantity ?? 0);
                      const minStock = Number(product.minStock ?? 0);
                      const pct = minStock > 0 ? Math.min(100, (stock / minStock) * 100) : 0;
                      return (
                        <Card key={product.id} className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500 font-mono">{product.barcode}</p>
                              </div>
                              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Mavjud:</span>
                                <span className="font-bold text-red-600">{stock} {product.unit}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Minimal:</span>
                                <span>{minStock} {product.unit}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 border-red-300 text-red-700 hover:bg-red-100"
                              onClick={() => { setAdjustProduct(product); setAdjustType("in"); }}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-1" />
                              Kirim qo'shish
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chart" className="m-0 p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>14 kunlik inventar harakatlari grafigi</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <p>Ma'lumot yo'q</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="in" name="Kirim" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                        <Bar dataKey="sale" name="Sotuv" fill="#8b5cf6" radius={[0, 0, 0, 0]} stackId="b" />
                        <Bar dataKey="out" name="Chiqim" fill="#ef4444" radius={[0, 0, 0, 0]} stackId="b" />
                        <Bar dataKey="adjustment" name="Tuzatish" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="c" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { key: "in", label: "Umumiy kirim", icon: ArrowUpCircle, color: "text-green-600 bg-green-100" },
                  { key: "sale", label: "Sotuv orqali", icon: TrendingDown, color: "text-purple-600 bg-purple-100" },
                  { key: "out", label: "Umumiy chiqim", icon: ArrowDownCircle, color: "text-red-600 bg-red-100" },
                  { key: "adjustment", label: "Tuzatishlar", icon: Settings2, color: "text-blue-600 bg-blue-100" },
                ]).map(({ key, label, icon: Icon, color }) => {
                  const total = (Array.isArray(monthlyRows) ? monthlyRows : []).filter(r => r.type === key).reduce((s, r) => s + Number(r.qty), 0);
                  return (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-xl font-bold">{total.toFixed(0)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Adjust Dialog */}
      <Dialog open={!!adjustProduct} onOpenChange={open => !open && setAdjustProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Inventar tuzatish</DialogTitle>
          </DialogHeader>
          {adjustProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold">{adjustProduct.name}</p>
                <p className="text-gray-500 font-mono">{adjustProduct.barcode}</p>
                <p className="text-gray-500">
                  Joriy qoldiq:
                  <span className="font-bold ml-1">{Number(adjustProduct.stockQuantity ?? 0)} {adjustProduct.unit}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Harakat turi</Label>
                <Select value={adjustType} onValueChange={setAdjustType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Kirim (qo'shish)</SelectItem>
                    <SelectItem value="out">Chiqim (ayirish)</SelectItem>
                    <SelectItem value="adjustment">Tuzatish (aniq qiymat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {adjustType === "adjustment" ? "Yangi miqdor" : "Miqdor"}
                </Label>
                <Input
                  type="number"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>Sabab (ixtiyoriy)</Label>
                <Textarea
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Tuzatish sababi..."
                  rows={2}
                />
              </div>

              {adjustQty && (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm">
                  <p className="text-blue-600">
                    {adjustType === "adjustment"
                      ? `${Number(adjustProduct.stockQuantity ?? 0)} → ${Number(adjustQty)}`
                      : adjustType === "in"
                      ? `${Number(adjustProduct.stockQuantity ?? 0)} + ${adjustQty} = ${Number(adjustProduct.stockQuantity ?? 0) + Number(adjustQty)}`
                      : `${Number(adjustProduct.stockQuantity ?? 0)} - ${adjustQty} = ${Math.max(0, Number(adjustProduct.stockQuantity ?? 0) - Number(adjustQty))}`}
                    {" "}
                    {adjustProduct.unit}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProduct(null)}>Bekor</Button>
            <Button
              onClick={handleAdjust}
              disabled={!adjustQty || Number(adjustQty) < 0 || adjustMutation.isPending}
            >
              {adjustMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
