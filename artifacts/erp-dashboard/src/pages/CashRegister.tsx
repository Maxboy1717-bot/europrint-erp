import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ScanBarcode, CreditCard, Banknote, Building2, Shuffle, Package, BarChart3, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ErrorState } from "@/components/ui/error-state";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PosProduct, PosTransaction, ReceiptData, TransactionItem } from "@/components/pos/types";
import { ProductCatalog } from "@/components/pos/ProductCatalog";
import { CartPanel } from "@/components/pos/CartPanel";
import { PaymentDialog } from "@/components/pos/PaymentDialog";
import { TransactionHistory } from "@/components/pos/TransactionHistory";
import { PosReports } from "@/components/pos/PosReports";
import { AddProductDialog } from "@/components/pos/AddProductDialog";
import { PaymentPanel } from "@/components/pos/PaymentPanel";
import { ProductList } from "@/components/pos/ProductList";
import { TransactionDetailDialog } from "@/components/pos/TransactionDetailDialog";
import { useCashRegister } from "@/components/pos/hooks/useCashRegister";

const paymentMethodLabels: Record<string, { uz: string; ru: string; icon: React.ComponentType<{ className?: string }> }> = {
  cash: { uz: "Naqd", ru: "Наличные", icon: Banknote },
  card: { uz: "Karta", ru: "Карта", icon: CreditCard },
  transfer: { uz: "O'tkazma", ru: "Перевод", icon: Building2 },
  mixed: { uz: "Aralash", ru: "Смешанная", icon: Shuffle },
};

const productFormSchema = z.object({
  barcode: z.string().min(1, "Barcode kerak"),
  name: z.string().min(1, "Nom kerak"),
  nameRu: z.string().default(""),
  category: z.string().default(""),
  unitPrice: z.coerce.number().min(0, "Narx 0 dan katta bo'lishi kerak"),
  unit: z.string().default("dona"),
  stockQuantity: z.coerce.number().default(0),
  minStock: z.coerce.number().default(0),
});

export default function CashRegister() {
  const { t } = useTranslation('finance');
  const cr = useCashRegister();

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow || !cr.receiptData) return;
    const itemsHtml = cr.receiptData.items?.map((item: TransactionItem) =>
      `<tr><td>${item.name}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatCurrency(item.unitPrice)}</td><td style="text-align:right">${formatCurrency(item.total)}</td></tr>`
    ).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Chek</title><style>body{font-family:monospace;font-size:12px;width:300px;margin:0 auto;padding:10px}.center{text-align:center}.right{text-align:right}.line{border-top:1px dashed #000;margin:5px 0}table{width:100%;border-collapse:collapse}td{padding:2px 0}h2,h3{margin:5px 0}</style></head><body><div class="center"><h2>${cr.receiptData.companyName}</h2><p>${cr.receiptData.companyAddress}</p><p>Tel: ${cr.receiptData.companyPhone}</p><p>INN: ${cr.receiptData.companyInn}</p></div><div class="line"></div><p>Chek: ${cr.receiptData.receiptNumber}</p><p>Tranzaksiya: ${cr.receiptData.transactionNumber}</p><p>Sana: ${formatDateTime(cr.receiptData.createdAt)}</p>${cr.receiptData.customerName ? `<p>Mijoz: ${cr.receiptData.customerName}</p>` : ""}<div class="line"></div><table><tr><th>Mahsulot</th><th>Soni</th><th>Narx</th><th>Jami</th></tr>${itemsHtml}</table><div class="line"></div><div class="right"><p>Jami: ${formatCurrency(cr.receiptData.subtotal)}</p>${cr.receiptData.discountAmount ? `<p>Chegirma: -${formatCurrency(cr.receiptData.discountAmount)}</p>` : ""}<p>QQS (${cr.receiptData.taxRate}%): ${formatCurrency(cr.receiptData.taxAmount)}</p><p><strong>UMUMIY: ${formatCurrency(cr.receiptData.totalAmount)}</strong></p><p>To'lov: ${paymentMethodLabels[cr.receiptData.paymentMethod]?.uz || cr.receiptData.paymentMethod}</p>${cr.receiptData.paymentDetails?.changeAmount ? `<p>Qaytim: ${formatCurrency(cr.receiptData.paymentDetails.changeAmount)}</p>` : ""}</div><div class="line"></div><div class="center"><p>Xaridingiz uchun rahmat!</p></div></body></html>`);
    printWindow.document.close(); printWindow.print();
  };

  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { barcode: "", name: "", nameRu: "", category: "", unitPrice: 0, unit: "dona", stockQuantity: 0, minStock: 0 },
  });

  if (cr.isError) return <ErrorState onRetry={cr.refetch} />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 flex-wrap p-4 pb-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold" data-testid="text-page-title">{t('cashRegister')}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {cr.dashboard && (
            <Badge variant="secondary" data-testid="badge-sales-today">
              Bugun: {formatCurrency(cr.dashboard.salesToday)} ({cr.dashboard.transactionsToday} ta)
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => cr.refetch()} title="Yangilash">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={cr.activeTab} onValueChange={cr.setActiveTab} className="flex-1 flex flex-col px-4">
        <TabsList data-testid="tabs-pos-nav">
          <TabsTrigger value="pos" data-testid="tab-pos"><ScanBarcode className="h-4 w-4 mr-1" /> {t('cashRegister')}</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products"><Package className="h-4 w-4 mr-1" /> {t('products')}</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history"><History className="h-4 w-4 mr-1" /> {t('transactions')}</TabsTrigger>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><BarChart3 className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="flex-1 mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <ProductCatalog products={cr.products} searchProducts={cr.searchProducts} productSearch={cr.productSearch} setProductSearch={cr.setProductSearch} addToCart={cr.addToCart} barcodeInput={cr.barcodeInput} setBarcodeInput={cr.setBarcodeInput} handleBarcodeScan={cr.handleBarcodeScan} barcodeRef={cr.barcodeRef} />
              <CartPanel cart={cr.cart} setCart={cr.setCart} updateQuantity={cr.updateQuantity} removeFromCart={cr.removeFromCart} />
            </div>
            <div className="flex flex-col gap-4">
              <PaymentPanel subtotal={cr.subtotal} discountAmount={cr.discountAmount} setDiscountAmount={cr.setDiscountAmount} taxRate={cr.taxRate} taxAmount={cr.taxAmount} totalAmount={cr.totalAmount} paymentMethod={cr.paymentMethod} setPaymentMethod={cr.setPaymentMethod} paymentMethodLabels={paymentMethodLabels} cashAmount={cr.cashAmount} setCashAmount={cr.setCashAmount} cardAmount={cr.cardAmount} setCardAmount={cr.setCardAmount} transferAmount={cr.transferAmount} setTransferAmount={cr.setTransferAmount} changeAmount={cr.changeAmount} customerName={cr.customerName} setCustomerName={cr.setCustomerName} canComplete={cr.canComplete} isPending={cr.transactionMutation.isPending} onComplete={cr.handleCompleteSale} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-2">
          <ProductList products={cr.products} isLoading={cr.productsLoading} onAddProduct={() => cr.setShowAddProduct(true)} />
        </TabsContent>

        <TabsContent value="history" className="mt-2">
          <TransactionHistory transactions={cr.transactions} setViewTransaction={cr.setViewTransaction} refundMutation={cr.refundMutation} paymentMethodLabels={paymentMethodLabels} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-2">
          {cr.dashboard && <PosReports dashboard={cr.dashboard} />}
        </TabsContent>
      </Tabs>

      <PaymentDialog showReceipt={cr.showReceipt} setShowReceipt={cr.setShowReceipt} receiptData={cr.receiptData} handlePrintReceipt={handlePrintReceipt} paymentMethodLabels={paymentMethodLabels} />
      <AddProductDialog open={cr.showAddProduct} onOpenChange={cr.setShowAddProduct} form={productForm} onSubmit={(data) => cr.addProductMutation.mutate(data)} isPending={cr.addProductMutation.isPending} />
      <TransactionDetailDialog transaction={cr.viewTransaction} onClose={() => cr.setViewTransaction(null)} paymentMethodLabels={paymentMethodLabels} />
    </div>
  );
}
