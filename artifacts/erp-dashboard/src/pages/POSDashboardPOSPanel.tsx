/**
 * @module POSDashboardPOSPanel
 * @description The full POS tab panel: left side product search/grid and right
 * side cart with payment method selector and checkout button. All state is
 * passed in from the parent page — this component is purely presentational.
 */

import { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ScanBarcode, Search, Plus, Minus, Trash2, ShoppingCart,
  Package, AlertTriangle, RefreshCw, Receipt, X,
} from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  PAYMENT_METHODS,
  formatUZS,
  type PosProduct,
  type CartItem,
} from "./POSDashboardTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface POSPanelProps {
  products: PosProduct[];
  isProductsLoading: boolean;
  barcodeRef: RefObject<HTMLInputElement | null>;
  barcodeInput: string;
  setBarcodeInput: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isOnline: boolean;
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  finalTotal: number;
  discountAmount: number;
  setDiscountAmount: (v: number) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  isPending: boolean;
  onScan: (barcode: string) => void;
  onAddToCart: (product: PosProduct) => void;
  onUpdateQty: (productId: number, delta: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Full POS tab: product catalogue (left) + shopping cart (right). */
export function POSPanel({
  products, isProductsLoading, barcodeRef, barcodeInput, setBarcodeInput,
  searchQuery, setSearchQuery, isOnline, cart, cartTotal, cartCount, finalTotal,
  discountAmount, setDiscountAmount, paymentMethod, setPaymentMethod, isPending,
  onScan, onAddToCart, onUpdateQty, onRemoveFromCart, onClearCart, onCheckout,
}: POSPanelProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex h-full gap-0">
      {/* ---- Left: product search + grid ---------------------------------- */}
      <div className="flex-1 flex flex-col overflow-hidden border-r">
        <div className="p-4 bg-white dark:bg-gray-800 border-b space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={barcodeRef}
                placeholder={t("barcodeSkanerlashYokiKiriting")}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onScan(barcodeInput); }}
                className="pl-10 font-mono"
              />
            </div>
            <Button onClick={() => onScan(barcodeInput)} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("mahsulotQidirishNomi")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isProductsLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />{t("Yuklanmoqda...")}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Package className="h-12 w-12 mb-2" />
              <p>{t("mahsulotTopilmadi")}</p>
              {!isOnline && (
                <p className="text-xs text-[var(--ep-yellow)] mt-1">
                  {t("oflaynKeshdanKorsatilmoqda")}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  className="text-left p-3 rounded-lg border bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-md transition-all"
                  disabled={Number(product.stockQuantity ?? 0) <= 0}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-[var(--ep-blue)]" />
                    </div>
                    {Number(product.stockQuantity ?? 0) <= Number(product.minStock ?? 0) && (
                      <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
                    )}
                  </div>
                  <p className="font-medium text-sm leading-tight mt-1 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{product.barcode}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[var(--ep-blue)] font-bold text-sm">
                      {formatUZS(Number(product.unitPrice))}
                    </span>
                    <span className={`text-xs ${Number(product.stockQuantity ?? 0) <= 0 ? "text-[var(--ep-red)]" : "text-gray-400"}`}>
                      {Number(product.stockQuantity ?? 0)} {product.unit}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Right: cart -------------------------------------------------- */}
      <div className="w-80 lg:w-96 flex flex-col bg-white dark:bg-gray-800">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Savat
            {cartCount > 0 && <Badge>{cartCount}</Badge>}
          </h2>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearCart} className="text-[var(--ep-red)]">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 p-4">
              <ShoppingCart className="h-10 w-10 mb-2" />
              <p className="text-sm text-center">
                {t("barcodeSkanerlangYokiMahsulotTanlang")}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.productId} className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm leading-tight flex-1 mr-2">
                      {item.name}
                    </p>
                    <button
                      onClick={() => onRemoveFromCart(item.productId)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {formatUZS(item.unitPrice)} × {item.unit}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => onUpdateQty(item.productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => onUpdateQty(item.productId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-[var(--ep-blue)]">
                      {formatUZS(item.total)}
                    </span>
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
                <span className="text-gray-500">
                  Jami (#{cart.length} mahsulot)
                </span>
                <span>{formatUZS(cartTotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 flex-shrink-0">{t("chegirma1")}</span>
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
                <span>{t("umumiy")}</span>
                <span className="text-[var(--ep-green)]">{formatUZS(finalTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === pm.key
                      ? "border-blue-500 bg-blue-50 text-[var(--ep-blue)] dark:bg-blue-900 dark:text-blue-300"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <pm.icon className="h-4 w-4" />
                  {pm.label}
                </button>
              ))}
            </div>

            <Button
              className={`w-full h-12 text-lg font-bold ${!isOnline ? "bg-amber-600 hover:bg-[var(--ep-yellow)]/90" : ""}`}
              onClick={onCheckout}
              disabled={isPending}
            >
              <Receipt className="h-4 w-4 mr-2" />
              {!isOnline ? "Oflayn saqlash · " : "To'lash · "}
              {formatUZS(finalTotal)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
