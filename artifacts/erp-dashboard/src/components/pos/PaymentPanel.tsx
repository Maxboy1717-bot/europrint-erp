import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, RefreshCw } from "lucide-react";

interface PaymentPanelProps {
  subtotal: number;
  discountAmount: number;
  setDiscountAmount: (amount: number) => void;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentMethodLabels: Record<string, { uz: string; ru: string; icon: React.ComponentType<{ className?: string }> }>;
  cashAmount: number;
  setCashAmount: (amount: number) => void;
  cardAmount: number;
  setCardAmount: (amount: number) => void;
  transferAmount: number;
  setTransferAmount: (amount: number) => void;
  changeAmount: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  canComplete: boolean;
  isPending: boolean;
  onComplete: () => void;
}

export function PaymentPanel({
  subtotal,
  discountAmount,
  setDiscountAmount,
  taxRate,
  taxAmount,
  totalAmount,
  paymentMethod,
  setPaymentMethod,
  paymentMethodLabels,
  cashAmount,
  setCashAmount,
  cardAmount,
  setCardAmount,
  transferAmount,
  setTransferAmount,
  changeAmount,
  customerName,
  setCustomerName,
  canComplete,
  isPending,
  onComplete,
}: PaymentPanelProps) {
  const { t } = useTranslation('finance');

  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium">{t('payment')}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Jami:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Chegirma:</span>
            <Input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="h-8 text-right"
              data-testid="input-discount"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">QQS ({taxRate}%):</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-1 mt-1">
            <span>UMUMIY:</span>
            <span className="text-primary">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">To'lov usuli</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(paymentMethodLabels).map(([key, value]) => (
              <Button
                key={key}
                variant={paymentMethod === key ? "default" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-1 p-1"
                onClick={() => setPaymentMethod(key)}
                data-testid={`button-pay-method-${key}`}
              >
                <value.icon className="h-4 w-4" />
                <span className="text-[10px] leading-none">{value.uz}</span>
              </Button>
            ))}
          </div>
        </div>

        {paymentMethod === "cash" && (
          <div className="space-y-1 pt-1">
            <label className="text-xs font-medium">Olingan naqd pul</label>
            <Input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(Number(e.target.value))}
              className="h-10 text-lg font-bold"
              autoFocus
              data-testid="input-cash-amount"
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-muted-foreground">Qaytim:</span>
              <span className="text-lg font-bold text-orange-600">{formatCurrency(changeAmount)}</span>
            </div>
          </div>
        )}

        {paymentMethod === "mixed" && (
          <div className="space-y-2 pt-1 border-t mt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium">Naqd</label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="h-8"
                  data-testid="input-mixed-cash"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium">Karta</label>
                <Input
                  type="number"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(Number(e.target.value))}
                  className="h-8"
                  data-testid="input-mixed-card"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium">O'tkazma</label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="h-8"
                  data-testid="input-mixed-transfer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-orange-600">Qaytim</label>
                <div className="h-8 flex items-center justify-end font-bold text-orange-600">
                  {formatCurrency(changeAmount)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium">Mijoz ismi</label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ixtiyoriy..."
            className="h-8"
            data-testid="input-customer-name"
          />
        </div>

        <Button
          className="w-full h-12 text-lg font-bold"
          disabled={!canComplete || isPending}
          onClick={onComplete}
          data-testid="button-complete-sale"
        >
          {isPending ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5 mr-2" />
          )}
          Sotishni yakunlash
        </Button>
      </CardContent>
    </Card>
  );
}
