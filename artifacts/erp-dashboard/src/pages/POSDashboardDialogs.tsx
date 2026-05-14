/**
 * @module POSDashboardDialogs
 * @description Payment-confirmation dialog and receipt dialog for the POS
 * Dashboard. Both components are purely presentational — all state is lifted
 * to the parent page and passed in via props.
 */

import { AlertTriangle, CheckCircle2, Printer, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from '@/lib/i18n';
import {
  formatUZS,
  PAYMENT_METHODS,
  type CartItem,
  type LastSale,
} from "./POSDashboardTypes";

// ---------------------------------------------------------------------------
// PaymentDialog
// ---------------------------------------------------------------------------

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOnline: boolean;
  isPending: boolean;
  cartCount: number;
  cartTotal: number;
  discountAmount: number;
  finalTotal: number;
  customerName: string;
  paymentMethod: string;
  onCustomerNameChange: (value: string) => void;
  onPaymentMethodChange: (method: string) => void;
  onConfirm: () => void;
}

/** Modal that shows order summary, collects customer name + payment method,
 *  and triggers the checkout mutation on confirm. */
export function PaymentDialog({
  open,
  onOpenChange,
  isOnline,
  isPending,
  cartCount,
  cartTotal,
  discountAmount,
  finalTotal,
  customerName,
  paymentMethod,
  onCustomerNameChange,
  onPaymentMethodChange,
  onConfirm,
}: PaymentDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("tolovniTasdiqlash")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isOnline && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                Oflayn rejim — sotuv qurilmada saqlanadi va internet qayta
                ulanganda serverga yuboriladi
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Mijoz ismi (ixtiyoriy)
            </label>
            <Input
              value={customerName}
              onChange={e => onCustomerNameChange(e.target.value)}
              placeholder={t("mijozIsmi2")}
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("mahsulotlar1")}</span>
              <span>{cartCount} dona</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("subtotal")}</span>
              <span>{formatUZS(cartTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-[var(--ep-red)]">
                <span>{t("chegirma")}</span>
                <span>-{formatUZS(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t("jami")}</span>
              <span className="text-[var(--ep-green)]">{formatUZS(finalTotal)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("tolovUsuli")}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.key}
                  onClick={() => onPaymentMethodChange(pm.key)}
                  className={`p-3 rounded-lg border font-medium flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === pm.key
                      ? "border-blue-500 bg-blue-50 text-[var(--ep-blue)] dark:bg-blue-900 dark:text-blue-300"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Bekor")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className={
              !isOnline
                ? "bg-amber-600 hover:bg-[var(--ep-yellow)]/90"
                : "bg-green-600 hover:bg-[var(--ep-green)]/90"
            }
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            {isPending
              ? "Saqlanmoqda..."
              : !isOnline
              ? "Oflayn saqlash"
              : "Tasdiqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ReceiptDialog
// ---------------------------------------------------------------------------

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastSale: LastSale | null;
  onNewSale: () => void;
}

/** Read-only receipt modal shown after a successful sale. */
export function ReceiptDialog({
  open,
  onOpenChange,
  lastSale,
  onNewSale,
}: ReceiptDialogProps) {
  const { t } = useTranslation("common");
  function paymentLabel(method: string) {
    if (method === "cash") return "Naqd";
    if (method === "card") return "Karta";
    return "O'tkazma";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[var(--ep-green)]" />
            Sotuv cheki
            {lastSale?.isOffline && (
              <Badge
                variant="outline"
                className="text-[var(--ep-yellow)] border-amber-400 text-xs"
              >
                {t("offline3")}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {lastSale && (
          <div className="font-mono text-sm space-y-2">
            <div className="text-center border-b pb-2">
              <p className="font-bold text-lg">EUROPRINT</p>
              <p className="text-xs text-gray-500">
                {t("toshkentShahriOzbekiston")}
              </p>
              <p className="text-xs text-gray-500">+998 71 123 45 67</p>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>{t("chek2")}</span>
                <span className="font-bold">{lastSale.saleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("sana1")}</span>
                <span>
                  {new Date(lastSale.createdAt).toLocaleString("uz-UZ")}
                </span>
              </div>
              {lastSale.customerName && (
                <div className="flex justify-between">
                  <span>{t("mijoz")}</span>
                  <span>{lastSale.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("tolov2")}</span>
                <span>{paymentLabel(lastSale.paymentMethod)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              {(Array.isArray(lastSale.items) ? lastSale.items : []).map(
                (item: CartItem) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-xs"
                  >
                    <span className="flex-1 mr-2 truncate">{item.name}</span>
                    <span>
                      {item.quantity}×{formatUZS(item.unitPrice)}
                    </span>
                  </div>
                )
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>JAMI:</span>
              <span>{formatUZS(lastSale.total)}</span>
            </div>

            {lastSale.isOffline && (
              <p className="text-center text-xs text-[var(--ep-yellow)] pt-1">
                {t("internetUlanganidaServergaYuboriladi")}
              </p>
            )}
            <p className="text-center text-xs text-gray-400 pt-1">
              {t("xaridUchunRahmat")}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />
            {t("print2")}
          </Button>
          <Button onClick={onNewSale}>{t("yangiSotuv")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
