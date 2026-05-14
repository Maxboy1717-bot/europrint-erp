/**
 * @module usePosCart
 * @description Custom hook that encapsulates POS cart state and barcode-scan
 * logic. Returns cart items, derived totals, and all mutator callbacks used by
 * POSDashboard and POSPanel.
 */

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type PosProduct, type CartItem } from "./POSDashboardTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePosCartReturn {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  addToCart: (product: PosProduct) => void;
  updateQty: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  scanBarcode: (barcode: string) => Promise<void>;
  barcodeInput: string;
  setBarcodeInput: (v: string) => void;
}

interface UsePosCartOptions {
  isOnline: boolean;
  getOfflineProductByBarcode: (barcode: string) => Promise<PosProduct | null | undefined>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePosCart({
  isOnline,
  getOfflineProductByBarcode,
}: UsePosCartOptions): UsePosCartReturn {
  const { toast } = useToast();
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Derived
  const cartItems = Array.isArray(cart) ? cart : [];
  const cartTotal = cartItems.reduce((s, i) => s + i.total, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  // ---- mutators -----------------------------------------------------------

  function addToCart(product: PosProduct) {
    setCart(prev => {
      const safe     = Array.isArray(prev) ? prev : [];
      const existing = safe.find(i => i.productId === product.id);
      if (existing) {
        const maxQty = Number(product.stockQuantity ?? 0);
        if (existing.quantity >= maxQty) {
          toast({ title: "Omborda yetarli mahsulot yo'q", variant: "destructive" });
          return safe;
        }
        return safe.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      if (Number(product.stockQuantity ?? 0) <= 0) {
        toast({ title: "Mahsulot omborda yo'q", variant: "destructive" });
        return safe;
      }
      return [...safe, {
        productId:     product.id,
        barcode:       product.barcode,
        name:          product.name,
        nameRu:        product.nameRu,
        quantity:      1,
        unitPrice:     Number(product.unitPrice),
        unit:          product.unit,
        total:         Number(product.unitPrice),
        stockQuantity: Number(product.stockQuantity ?? 0),
      }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart(prev =>
      (Array.isArray(prev) ? prev : []).map(i => {
        if (i.productId !== productId) return i;
        const newQty = Math.max(
          1,
          Math.min(i.quantity + delta, Number(i.stockQuantity ?? 999))
        );
        return { ...i, quantity: newQty, total: newQty * i.unitPrice };
      })
    );
  }

  function removeFromCart(productId: number) {
    setCart(prev =>
      (Array.isArray(prev) ? prev : []).filter(i => i.productId !== productId)
    );
  }

  function clearCart() {
    setCart([]);
  }

  // ---- barcode scan -------------------------------------------------------

  const scanBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode.trim()) return;
      try {
        if (!isOnline) {
          const product = await getOfflineProductByBarcode(barcode.trim());
          if (!product) {
            toast({
              title: "Mahsulot topilmadi",
              description: `Barcode: ${barcode} (oflayn)`,
              variant: "destructive",
            });
            setBarcodeInput("");
            return;
          }
          addToCart(product as PosProduct);
          setBarcodeInput("");
          return;
        }
        const product = await apiRequest(
          "GET",
          `/api/pos/scan/${encodeURIComponent(barcode.trim())}`
        );
        addToCart(product as PosProduct);
        setBarcodeInput("");
      } catch {
        toast({
          title: "Mahsulot topilmadi",
          description: `Barcode: ${barcode}`,
          variant: "destructive",
        });
        setBarcodeInput("");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOnline, getOfflineProductByBarcode, toast]
  );

  return {
    cart: cartItems,
    cartTotal,
    cartCount,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    scanBarcode,
    barcodeInput,
    setBarcodeInput,
  };
}
