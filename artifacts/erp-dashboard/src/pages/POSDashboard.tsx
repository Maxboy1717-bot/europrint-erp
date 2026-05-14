/**
 * @module POSDashboard
 * @description Route-level POS page. Owns queries, mutations, dialog state,
 * and top-level layout. Heavy sub-components live in sibling modules:
 *   - POSDashboardTypes.ts       — interfaces, constants, formatUZS
 *   - usePosCart.ts              — cart state + barcode-scan logic (custom hook)
 *   - POSDashboardPOSPanel.tsx   — full POS tab (search, product grid, cart)
 *   - POSDashboardCards.tsx      — KPI stat cards (reports tab)
 *   - POSDashboardCharts.tsx     — recharts chart cards + daily sales table
 *   - POSDashboardDialogs.tsx    — PaymentDialog + ReceiptDialog
 */

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePosOffline } from "@/hooks/use-pos-offline";
import {
  OfflineStatusBanner,
  OfflineHeaderBadge,
} from "@/components/pos/OfflineStatusBanner";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, AlertTriangle, BarChart3 } from "lucide-react";

import {
  type PosProduct,
  type DailyData,
  type LastSale,
} from "./POSDashboardTypes";
import { usePosCart } from "./usePosCart";
import { POSPanel } from "./POSDashboardPOSPanel";
import { SaleCountCard, RevenueCard, AvgSaleCard, LowStockCard } from "./POSDashboardCards";
import { MonthlyChartCard, PaymentChartCard, DailySalesTable } from "./POSDashboardCharts";
import { PaymentDialog, ReceiptDialog } from "./POSDashboardDialogs";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function POSDashboard() {
  const { toast } = useToast();
  const {
    isOnline, syncStatus, pendingCount, lastSyncAt,
    saveOfflineSale, triggerSync,
    getOfflineProducts, getOfflineProductByBarcode,
  } = usePosOffline();

  // ---- local state --------------------------------------------------------
  const [searchQuery, setSearchQuery]       = useState("");
  const [paymentMethod, setPaymentMethod]   = useState("cash");
  const [customerName, setCustomerName]     = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSale, setLastSale]             = useState<LastSale | null>(null);
  const [activeTab, setActiveTab]           = useState("pos");
  const [offlineProducts, setOfflineProducts] = useState<PosProduct[]>([]);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // ---- cart hook ----------------------------------------------------------
  const {
    cart, cartTotal, cartCount,
    addToCart, updateQty, removeFromCart, clearCart,
    scanBarcode, barcodeInput, setBarcodeInput,
  } = usePosCart({ isOnline, getOfflineProductByBarcode });

  const finalTotal = Math.max(0, cartTotal - discountAmount);

  // ---- focus + offline product cache -------------------------------------
  useEffect(() => {
    if (activeTab === "pos") barcodeRef.current?.focus();
  }, [activeTab]);

  useEffect(() => {
    if (!isOnline) {
      getOfflineProducts(searchQuery).then(setOfflineProducts);
    }
  }, [isOnline, searchQuery, getOfflineProducts]);

  // ---- queries ------------------------------------------------------------
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/pos/products", searchQuery],
    queryFn: () =>
      apiRequest("GET", `/api/pos/products?search=${encodeURIComponent(searchQuery)}&active=true`),
    enabled: isOnline,
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["/api/pos/sales/daily"],
    queryFn: () => apiRequest("GET", "/api/pos/sales/daily"),
    refetchInterval: 30_000,
    enabled: isOnline,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["/api/pos/inventory/low-stock"],
    queryFn: () => apiRequest("GET", "/api/pos/inventory/low-stock"),
    enabled: isOnline,
  });

  const onlineProducts: PosProduct[] = Array.isArray(productsData) ? productsData : [];
  const products: PosProduct[]       = isOnline ? onlineProducts : offlineProducts;
  const isProductsLoading            = isOnline ? productsLoading : false;
  const daily                        = dailyData as DailyData | undefined;
  const lowStock: PosProduct[]       =
    (lowStockData as { products: PosProduct[] } | undefined)?.products ?? [];

  // ---- mutation -----------------------------------------------------------
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
        saleNumber: saleData.saleNumber, total: finalTotal,
        items: [...cart], paymentMethod, customerName,
        createdAt: new Date().toISOString(),
      });
      clearCart(); setDiscountAmount(0); setCustomerName("");
      setShowPaymentDialog(false); setShowReceiptDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sales/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/inventory/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      toast({ title: "Sotuv amalga oshirildi!", description: saleData.saleNumber });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  // ---- checkout -----------------------------------------------------------
  async function handleConfirmPayment() {
    if (!isOnline) {
      try {
        const localId = await saveOfflineSale({
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod, customerName: customerName || undefined,
          discountAmount: discountAmount || undefined,
          total: finalTotal, cartSnapshot: cart,
        });
        setLastSale({
          saleNumber: `OFLAYN-${localId.slice(0, 8).toUpperCase()}`,
          total: finalTotal, items: [...cart], paymentMethod, customerName,
          createdAt: new Date().toISOString(), isOffline: true,
        });
        clearCart(); setDiscountAmount(0); setCustomerName("");
        setShowPaymentDialog(false); setShowReceiptDialog(true);
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
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod,
      customerName: customerName || undefined,
      discountAmount: discountAmount || undefined,
    });
  }

  // ---- render -------------------------------------------------------------
  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineStatusBanner
        isOnline={isOnline} syncStatus={syncStatus}
        pendingCount={pendingCount} lastSyncAt={lastSyncAt}
        onSync={triggerSync}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-[var(--ep-blue)]" />
          <h1 className="text-xl font-bold">POS Kassa</h1>
          <OfflineHeaderBadge
            isOnline={isOnline} pendingCount={pendingCount} syncStatus={syncStatus}
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
            <TabsTrigger value="pos">
              <ShoppingCart className="h-4 w-4 mr-1" />Kassa
            </TabsTrigger>
            <TabsTrigger value="reports" disabled={!isOnline}>
              <BarChart3 className="h-4 w-4 mr-1" />Hisobot
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "pos" && (
          <POSPanel
            products={products}
            isProductsLoading={isProductsLoading}
            barcodeRef={barcodeRef}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isOnline={isOnline}
            cart={cart}
            cartTotal={cartTotal}
            cartCount={cartCount}
            finalTotal={finalTotal}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isPending={saleMutation.isPending}
            onScan={scanBarcode}
            onAddToCart={addToCart}
            onUpdateQty={updateQty}
            onRemoveFromCart={removeFromCart}
            onClearCart={clearCart}
            onCheckout={() => { if (cart.length > 0) setShowPaymentDialog(true); }}
          />
        )}

        {activeTab === "reports" && (
          <div className="p-4 overflow-y-auto h-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <SaleCountCard loading={dailyLoading} summary={daily?.summary} />
              <RevenueCard   loading={dailyLoading} summary={daily?.summary} />
              <AvgSaleCard   loading={dailyLoading} summary={daily?.summary} />
              <LowStockCard  count={lowStock.length} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MonthlyChartCard rows={daily?.monthlySummary} />
              <PaymentChartCard rows={daily?.byPaymentMethod} />
            </div>
            <DailySalesTable daily={daily} />
          </div>
        )}
      </div>

      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        isOnline={isOnline}
        isPending={saleMutation.isPending}
        cartCount={cartCount}
        cartTotal={cartTotal}
        discountAmount={discountAmount}
        finalTotal={finalTotal}
        customerName={customerName}
        paymentMethod={paymentMethod}
        onCustomerNameChange={setCustomerName}
        onPaymentMethodChange={setPaymentMethod}
        onConfirm={handleConfirmPayment}
      />

      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        lastSale={lastSale}
        onNewSale={() => {
          setShowReceiptDialog(false);
          setActiveTab("pos");
          barcodeRef.current?.focus();
        }}
      />
    </div>
  );
}
