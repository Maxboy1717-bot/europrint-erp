import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { 
  PosProduct, 
  CartItem, 
  PosTransaction, 
  ReceiptData, 
  DashboardData, 
  PaymentDetails 
} from "@/components/pos/types";

export function useCashRegister() {
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [viewTransaction, setViewTransaction] = useState<PosTransaction | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === "pos" && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [activeTab]);

  const { data: sysSettings } = useQuery({
    queryKey: ["/api/system-settings"],
    queryFn: async () => apiRequest<{ qqsRate?: number }>("GET", "/api/system-settings"),
  });

  const { data: products = [], isLoading: productsLoading, isError, refetch } = useQuery({
    queryKey: ["/api/pos/products"],
    queryFn: async () => apiRequest<PosProduct[]>("GET", "/api/pos/products"),
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/pos/transactions"],
    queryFn: async () => apiRequest<PosTransaction[]>("GET", "/api/pos/transactions"),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["/api/pos/dashboard"],
    queryFn: async () => apiRequest<DashboardData>("GET", "/api/pos/dashboard"),
  });

  const searchProducts = useQuery({
    queryKey: ["/api/pos/products", `?search=${productSearch}`],
    queryFn: async () => apiRequest<PosProduct[]>("GET", `/api/pos/products?search=${productSearch}`),
    enabled: productSearch.length > 0,
  });

  const addToCart = useCallback((product: PosProduct) => {
    setCart((prev) => {
      const existing = (prev ?? []).find((item) => item.productId === product.id);
      if (existing) {
        return (prev ?? []).map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id, barcode: product.barcode, name: product.name, nameRu: product.nameRu,
        quantity: 1, unitPrice: product.unitPrice, unit: product.unit, total: product.unitPrice, stockQuantity: product.stockQuantity,
      }];
    });
  }, []);

  const scanMutation = useMutation({
    mutationFn: (barcode: string) => apiRequest<PosProduct>("GET", `/api/pos/scan/${encodeURIComponent(barcode)}`),
    onSuccess: (product) => {
      addToCart(product);
      setBarcodeInput("");
      setTimeout(() => barcodeRef.current?.focus(), 50);
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message || tCommon('noData'), variant: "destructive" });
      setBarcodeInput("");
      setTimeout(() => barcodeRef.current?.focus(), 50);
    },
  });

  const transactionMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest<PosTransaction>("POST", "/api/pos/transactions", data),
    onSuccess: async (transaction) => {
      const receipt = await apiRequest<ReceiptData>("GET", `/api/pos/receipt/${transaction.id}`);
      setReceiptData(receipt);
      setShowReceipt(true);
      setCart([]);
      setDiscountAmount(0);
      setCashAmount(0);
      setCardAmount(0);
      setTransferAmount(0);
      setCustomerName("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/dashboard"] });
      toast({ title: tCommon('success'), description: `${transaction.receiptNumber}` });
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message || tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/pos/transactions/${id}/refund`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/dashboard"] });
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/pos/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/products"] });
      setShowAddProduct(false);
      toast({ title: tCommon('success') });
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" });
    },
  });

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => (prev ?? []).map((item) => {
      if (item.productId !== productId) return item;
      const newQty = Math.max(0, item.quantity + delta);
      return { ...item, quantity: newQty, total: newQty * item.unitPrice };
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => setCart((prev) => (prev ?? []).filter((item) => item.productId !== productId));

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcodeInput.trim()) {
      e.preventDefault();
      scanMutation.mutate(barcodeInput.trim());
    }
  };

  const subtotal = (Array.isArray(cart) ? cart : []).reduce((sum, item) => sum + item.total, 0);
  const taxRate = sysSettings?.qqsRate ?? 12;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round((taxableAmount * taxRate) / (100 + taxRate));
  const totalAmount = subtotal - discountAmount;

  const changeAmount = paymentMethod === "cash" ? Math.max(0, cashAmount - totalAmount) :
    paymentMethod === "mixed" ? Math.max(0, cashAmount + cardAmount + transferAmount - totalAmount) : 0;

  const canComplete = cart.length > 0 && totalAmount > 0 &&
    (paymentMethod === "cash" ? cashAmount >= totalAmount :
     paymentMethod === "card" || paymentMethod === "transfer" ? true :
     paymentMethod === "mixed" ? cashAmount + cardAmount + transferAmount >= totalAmount : false);

  const handleCompleteSale = () => {
    if (!canComplete) return;
    const paymentDetails: PaymentDetails = {};
    if (paymentMethod === "cash") {
      paymentDetails.cashAmount = cashAmount;
      paymentDetails.changeAmount = changeAmount;
    } else if (paymentMethod === "card") {
      paymentDetails.cardAmount = totalAmount;
    } else if (paymentMethod === "transfer") {
      paymentDetails.transferAmount = totalAmount;
    } else if (paymentMethod === "mixed") {
      paymentDetails.cashAmount = cashAmount;
      paymentDetails.cardAmount = cardAmount;
      paymentDetails.transferAmount = transferAmount;
      paymentDetails.changeAmount = changeAmount;
    }
    transactionMutation.mutate({
      items: (Array.isArray(cart) ? cart : []).map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })),
      customerName: customerName || undefined,
      paymentMethod, paymentDetails, discountAmount, notes: notes || undefined, taxRate,
    });
  };

  return {
    activeTab, setActiveTab,
    cart, setCart,
    barcodeInput, setBarcodeInput,
    discountAmount, setDiscountAmount,
    paymentMethod, setPaymentMethod,
    cashAmount, setCashAmount,
    cardAmount, setCardAmount,
    transferAmount, setTransferAmount,
    customerName, setCustomerName,
    notes, setNotes,
    showReceipt, setShowReceipt,
    receiptData, setReceiptData,
    showAddProduct, setShowAddProduct,
    productSearch, setProductSearch,
    viewTransaction, setViewTransaction,
    barcodeRef,
    products, productsLoading, isError, refetch,
    transactions, transactionsLoading,
    dashboard,
    searchProducts,
    scanMutation,
    transactionMutation,
    refundMutation,
    addProductMutation,
    addToCart,
    updateQuantity,
    removeFromCart,
    handleBarcodeScan,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    changeAmount,
    canComplete,
    handleCompleteSale,
  };
}
