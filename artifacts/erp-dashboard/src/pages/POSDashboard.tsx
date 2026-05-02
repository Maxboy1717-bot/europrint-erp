import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { usePosOffline } from "@/hooks/use-pos-offline";
import { OfflineStatusBanner, OfflineHeaderBadge } from "@/components/pos/OfflineStatusBanner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import {
  ScanBarcode, Search, Plus, Minus, Trash2, ShoppingCart,
  Banknote, CreditCard, Smartphone, Receipt, Printer, X,
  Package, AlertTriangle, BarChart3, RefreshCw, ChevronRight,
  TrendingUp, DollarSign, CheckCircle2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

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
  imageUrl: string | null;
}

interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  nameRu: string | null;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  stockQuantity: number | null;
}

const PAYMENT_METHODS = [
  { key: "cash", label: "Naqd", icon: Banknote },
  { key: "card", label: "Karta", icon: CreditCard },
  { key: "transfer", label: "O'tkazma", icon: Smartphone },
];

function formatUZS(amount: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(amount) + " so'm";
}

export default function POSDashboard() {
  const { toast } = useToast();
  const {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncAt,
    saveOfflineSale,
    triggerSync,
    getOfflineProducts,
    getOfflineProductByBarcode,
  } = usePosOffline();

  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSale, setLastSale] = useState<{
    saleNumber: string;
    total: number;
    items: CartItem[];
    paymentMethod: string;
    customerName: string;
    createdAt: string;
    isOffline?: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("pos");
  const [offlineProducts, setOfflineProducts] = useState<PosProduct[]>([]);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "pos" && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isOnline) {
      getOfflineProducts(searchQuery).then(setOfflineProducts);
    }
  }, [isOnline, searchQuery, getOfflineProducts]);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/pos/products", searchQuery],
    queryFn: () =>
      apiRequest("GET", `/api/pos/products?search=${encodeURIComponent(searchQuery)}&active=true`),
    enabled: isOnline,
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["/api/pos/sales/daily"],
    queryFn: () => apiRequest("GET", "/api/pos/sales/daily"),
    refetchInterval: 30000,
    enabled: isOnline,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["/api/pos/inventory/low-stock"],
    queryFn: () => apiRequest("GET", "/api/pos/inventory/low-stock"),
    enabled: isOnline,
  });

  const onlineProducts: PosProduct[] = Array.isArray(productsData) ? productsData : [];
  const products: PosProduct[] = isOnline ? onlineProducts : offlineProducts;
  const isProductsLoading = isOnline ? productsLoading : false;

  const daily = dailyData as {
    summary: {
      saleCount: number;
      totalRevenue: number;
      avgSale: number;
      totalDiscounts: number;
    };
    byPaymentMethod: Array<{ payment_method: string; count: string; total: string }>;
    sales: Array<{ id: string; sale_number: string; cashier_name: string; customer_name: string; total: number; payment_method: string; created_at: string }>;
    monthlySummary: Array<{ day: string; sale_count: string; total: string }>;
  } | undefined;

  const lowStock: PosProduct[] = (lowStockData as { products: PosProduct[] } | undefined)?.products ?? [];

  const saleMutation = useMutation({
    mutationFn: (data: {
      items: Array<{ productId: number; quantity: number }>;
      paymentMethod: string;
      customerName?: string;
      discountAmount?: number;
    }) => apiRequest("POST", "/api/pos/sales", data),
    onSuccess: (data) => {
      const saleData = data as { saleNumber: string; sale: { id: string } };
      setLastSale({
        saleNumber: saleData.saleNumber,
        total: cartTotal - discountAmount,
        items: [...cart],
        paymentMethod,
        customerName,
        createdAt: new Date().toISOString(),
      });
      setCart([]);
      setDiscountAmount(0);
      setCustomerName("");
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sales/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      toast({ title: "Sotuv amalga oshirildi!", description: `${saleData.saleNumber}` });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const scanBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    try {
      if (!isOnline) {
        const product = await getOfflineProductByBarcode(barcode.trim());
        if (!product) {
          toast({ title: "Mahsulot topilmadi", description: `Barcode: ${barcode} (oflayn)`, variant: "destructive" });
          setBarcodeInput("");
          return;
        }
        addToCart(product as unknown as PosProduct);
        setBarcodeInput("");
        return;
      }
      const product = await apiRequest("GET", `/api/pos/scan/${encodeURIComponent(barcode.trim())}`);
      addToCart(product as PosProduct);
      setBarcodeInput("");
    } catch {
      toast({ title: "Mahsulot topilmadi", description: `Barcode: ${barcode}`, variant: "destructive" });
      setBarcodeInput("");
    }
  }, [toast, isOnline, getOfflineProductByBarcode]);

  function addToCart(product: PosProduct) {
    setCart(prev => {
      const existing = (prev ?? []).find(i => i.productId === product.id);
      if (existing) {
        const maxQty = Number(product.stockQuantity ?? 0);
        if (existing.quantity >= maxQty) {
          toast({ title: "Omborda yetarli mahsulot yo'q", variant: "destructive" });
          return prev;
        }
        return (prev ?? []).map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      if (Number(product.stockQuantity ?? 0) <= 0) {
        toast({ title: "Mahsulot omborda yo'q", variant: "destructive" });
        return prev;
      }
      return [...prev, {
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        nameRu: product.nameRu,
        quantity: 1,
        unitPrice: Number(product.unitPrice),
        unit: product.unit,
        total: Number(product.unitPrice),
        stockQuantity: Number(product.stockQuantity ?? 0),
      }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart(prev => (prev ?? []).map(i => {
      if (i.productId !== productId) return i;
      const newQty = Math.max(1, Math.min(i.quantity + delta, Number(i.stockQuantity ?? 999)));
      return { ...i, quantity: newQty, total: newQty * i.unitPrice };
    }));
  }

  function removeFromCart(productId: number) {
    setCart(prev => (prev ?? []).filter(i => i.productId !== productId));
  }

  const cartTotal = (Array.isArray(cart) ? cart : []).reduce((s, i) => s + i.total, 0);
  const cartCount = (Array.isArray(cart) ? cart : []).reduce((s, i) => s + i.quantity, 0);
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  function handleCheckout() {
    if (cart.length === 0) return;
    setShowPaymentDialog(true);
  }

  async function handleConfirmPayment() {
    if (!isOnline) {
      try {
        const localId = await saveOfflineSale({
          items: (Array.isArray(cart) ? cart : []).map(i => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod,
          customerName: customerName || undefined,
          discountAmount: discountAmount || undefined,
          total: finalTotal,
          cartSnapshot: cart,
        });
        setLastSale({
          saleNumber: `OFLAYN-${localId.slice(0, 8).toUpperCase()}`,
          total: finalTotal,
          items: [...cart],
          paymentMethod,
          customerName,
          createdAt: new Date().toISOString(),
          isOffline: true,
        });
        setCart([]);
        setDiscountAmount(0);
        setCustomerName("");
        setShowPaymentDialog(false);
        setShowReceiptDialog(true);
        toast({
          title: "Sotuv saqlandi (oflayn)",
          description: "Internet ulanganida serverga yuboriladi",
        });
      } catch (err: unknown) {
        toast({
          title: "Xatolik",
          description: err instanceof Error ? err.message : "Noma'lum xato",
          variant: "destructive",
        });
      }
      return;
    }

    saleMutation.mutate({
      items: (Array.isArray(cart) ? cart : []).map(i => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod,
      customerName: customerName || undefined,
      discountAmount: discountAmount || undefined,
    });
  }

  const monthlySummaryChartData = (Array.isArray(daily?.monthlySummary) ? daily?.monthlySummary : []).map(row => ({
    day: new Date(row.day).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }),
    total: Number(row.total),
    count: Number(row.sale_count),
  }));

  const paymentBreakdownData = (Array.isArray(daily?.byPaymentMethod) ? daily?.byPaymentMethod : []).map(row => ({
    method: row.payment_method === "cash" ? "Naqd" : row.payment_method === "card" ? "Karta" : "O'tkazma",
    total: Number(row.total),
    count: Number(row.count),
  }));

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineStatusBanner
        isOnline={isOnline}
        syncStatus={syncStatus}
        pendingCount={pendingCount}
        lastSyncAt={lastSyncAt}
        onSync={triggerSync}
      />

      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold">POS Kassa</h1>
          <OfflineHeaderBadge
            isOnline={isOnline}
            pendingCount={pendingCount}
            syncStatus={syncStatus}
          />
          {lowStock.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStock.length} mahsulot kam
            </Badge>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pos"><ShoppingCart className="h-4 w-4 mr-1" />Kassa</TabsTrigger>
            <TabsTrigger value="reports" disabled={!isOnline}><BarChart3 className="h-4 w-4 mr-1" />Hisobot</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "pos" && (
          <div className="flex h-full gap-0">
            {/* Left panel: search + products */}
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              <div className="p-4 bg-white dark:bg-gray-800 border-b space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={barcodeRef}
                      placeholder="Barcode skanerlash yoki kiriting..."
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") scanBarcode(barcodeInput); }}
                      className="pl-10 font-mono"
                    />
                  </div>
                  <Button onClick={() => scanBarcode(barcodeInput)} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Mahsulot qidirish (nomi)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {isProductsLoading ? (
                  <div className="flex items-center justify-center h-40 text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />Yuklanmoqda...
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Package className="h-12 w-12 mb-2" />
                    <p>Mahsulot topilmadi</p>
                    {!isOnline && (
                      <p className="text-xs text-amber-500 mt-1">Oflayn — keshdan ko'rsatilmoqda</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(Array.isArray(products) ? products : []).map(product => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="text-left p-3 rounded-lg border bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-md transition-all group"
                        disabled={Number(product.stockQuantity ?? 0) <= 0}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                          {Number(product.stockQuantity ?? 0) <= Number(product.minStock ?? 0) && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="font-medium text-sm leading-tight mt-1 line-clamp-2">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{product.barcode}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-blue-600 font-bold text-sm">{formatUZS(Number(product.unitPrice))}</span>
                          <span className={`text-xs ${Number(product.stockQuantity ?? 0) <= 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {Number(product.stockQuantity ?? 0)} {product.unit}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: cart */}
            <div className="w-80 lg:w-96 flex flex-col bg-white dark:bg-gray-800">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Savat
                  {cartCount > 0 && <Badge>{cartCount}</Badge>}
                </h2>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCart([])} className="text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400 p-4">
                    <ShoppingCart className="h-10 w-10 mb-2" />
                    <p className="text-sm text-center">Barcode skanerlang yoki mahsulot tanlang</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {(Array.isArray(cart) ? cart : []).map(item => (
                      <div key={item.productId} className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-sm leading-tight flex-1 mr-2">{item.name}</p>
                          <button onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{formatUZS(item.unitPrice)} × {item.unit}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-blue-600">{formatUZS(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Jami (#{cart.length} mahsulot)</span>
                      <span>{formatUZS(cartTotal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 flex-shrink-0">Chegirma</span>
                      <Input
                        type="number"
                        value={discountAmount || ""}
                        onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="h-7 text-sm"
                      />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Umumiy</span>
                      <span className="text-green-600">{formatUZS(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {(Array.isArray(PAYMENT_METHODS) ? PAYMENT_METHODS : []).map(pm => (
                      <button
                        key={pm.key}
                        onClick={() => setPaymentMethod(pm.key)}
                        className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === pm.key
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <pm.icon className="h-4 w-4" />
                        {pm.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    className={`w-full h-12 text-lg font-bold ${!isOnline ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                    onClick={handleCheckout}
                    disabled={saleMutation.isPending}
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    {!isOnline ? "Oflayn saqlash · " : "To'lash · "}{formatUZS(finalTotal)}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="p-4 overflow-y-auto h-full space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bugungi sotuvlar</p>
                      <p className="text-2xl font-bold">{dailyLoading ? "..." : daily?.summary?.saleCount ?? 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bugungi daromad</p>
                      <p className="text-lg font-bold">{dailyLoading ? "..." : formatUZS(daily?.summary?.totalRevenue ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">O'rtacha sotuv</p>
                      <p className="text-lg font-bold">{dailyLoading ? "..." : formatUZS(daily?.summary?.avgSale ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Kam qoldiq</p>
                      <p className="text-2xl font-bold text-red-600">{lowStock.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">30 kunlik sotuv grafigi</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlySummaryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(1) + "M"} />
                      <Tooltip formatter={(v: number) => formatUZS(v)} />
                      <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">To'lov usullari bo'yicha</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={paymentBreakdownData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => (v / 1000000).toFixed(1) + "M"} />
                      <YAxis dataKey="method" type="category" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip formatter={(v: number) => formatUZS(v)} />
                      <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bugungi sotuvlar ro'yxati</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Raqam</TableHead>
                      <TableHead>Kassir</TableHead>
                      <TableHead>Mijoz</TableHead>
                      <TableHead>To'lov</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(daily?.sales ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-400 py-8">Bugun sotuv yo'q</TableCell>
                      </TableRow>
                    ) : (Array.isArray(daily?.sales) ? daily?.sales : []).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.sale_number}</TableCell>
                        <TableCell>{sale.cashier_name ?? "—"}</TableCell>
                        <TableCell>{sale.customer_name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatUZS(Number(sale.total))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>To'lovni tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!isOnline && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Oflayn rejim — sotuv qurilmada saqlanadi va internet qayta ulanganda serverga yuboriladi</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mijoz ismi (ixtiyoriy)</label>
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Mijoz ismi..."
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mahsulotlar:</span>
                <span>{cartCount} dona</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span>{formatUZS(cartTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Chegirma:</span>
                  <span>-{formatUZS(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Jami:</span>
                <span className="text-green-600">{formatUZS(finalTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To'lov usuli</label>
              <div className="grid grid-cols-3 gap-2">
                {(Array.isArray(PAYMENT_METHODS) ? PAYMENT_METHODS : []).map(pm => (
                  <button
                    key={pm.key}
                    onClick={() => setPaymentMethod(pm.key)}
                    className={`p-3 rounded-lg border font-medium flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === pm.key
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <pm.icon className="h-5 w-5" />
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Bekor</Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={saleMutation.isPending}
              className={!isOnline ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {saleMutation.isPending
                ? "Saqlanmoqda..."
                : !isOnline
                  ? "Oflayn saqlash"
                  : "Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Sotuv cheki
              {lastSale?.isOffline && (
                <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">Oflayn</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="font-mono text-sm space-y-2">
              <div className="text-center border-b pb-2">
                <p className="font-bold text-lg">EUROPRINT</p>
                <p className="text-xs text-gray-500">Toshkent shahri, O'zbekiston</p>
                <p className="text-xs text-gray-500">+998 71 123 45 67</p>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Chek #:</span>
                  <span className="font-bold">{lastSale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sana:</span>
                  <span>{new Date(lastSale.createdAt).toLocaleString("uz-UZ")}</span>
                </div>
                {lastSale.customerName && (
                  <div className="flex justify-between">
                    <span>Mijoz:</span>
                    <span>{lastSale.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>To'lov:</span>
                  <span>{lastSale.paymentMethod === "cash" ? "Naqd" : lastSale.paymentMethod === "card" ? "Karta" : "O'tkazma"}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                {(Array.isArray(lastSale.items) ? lastSale.items : []).map(item => (
                  <div key={item.productId} className="flex justify-between text-xs">
                    <span className="flex-1 mr-2 truncate">{item.name}</span>
                    <span>{item.quantity}×{formatUZS(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>JAMI:</span>
                <span>{formatUZS(lastSale.total)}</span>
              </div>
              {lastSale.isOffline && (
                <p className="text-center text-xs text-amber-500 pt-1">
                  ⚡ Internet ulanganida serverga yuboriladi
                </p>
              )}
              <p className="text-center text-xs text-gray-400 pt-1">Xarid uchun rahmat!</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
            <Button onClick={() => { setShowReceiptDialog(false); setActiveTab("pos"); barcodeRef.current?.focus(); }}>
              Yangi sotuv
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
