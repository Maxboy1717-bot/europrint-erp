/**
 * @module SDQuotationDetailSheet
 * @description Slide-over sheet that shows full details for a single quotation,
 * including line items and the "convert to order" action.
 */

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Clock, Send, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { QuotationWithItems } from "./SDQuotationsTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Status badge helper (local to this component)
// ---------------------------------------------------------------------------

function getStatusBadge(status: string) {
  const { t } = useTranslation("common");
  switch (status) {
    case "draft":
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <Clock className="h-3 w-3 mr-1" />{t("draft")}
        </Badge>
      );
    case "sent":
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <Send className="h-3 w-3 mr-1" />{t("yuborilgan")}
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <CheckCircle className="h-3 w-3 mr-1" />{t("qabulQilindi")}
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <XCircle className="h-3 w-3 mr-1" />{t("radEtildi")}
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <AlertCircle className="h-3 w-3 mr-1" />{t("muddatiOtgan")}
        </Badge>
      );
    case "converted":
      return (
        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <RefreshCw className="h-3 w-3 mr-1" />{t("aylantirilgan")}
        </Badge>
      );
    default:
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          {status}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface QuotationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationWithItems | null;
  isConvertPending: boolean;
  onConvertToOrder: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuotationDetailSheet({
  open,
  onOpenChange,
  quotation,
  isConvertPending,
  onConvertToOrder,
}: QuotationDetailSheetProps) {
  const { t } = useTranslation("common");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>{t("taklifTafsilotlari")}</SheetTitle>
          <SheetDescription>{quotation?.quotationNumber}</SheetDescription>
        </SheetHeader>

        {quotation && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("mijoz1")}</p>
                <p className="font-medium">{quotation.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("status28")}</p>
                <div>{getStatusBadge(quotation.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("taklifSanasi")}</p>
                <p className="font-medium">{quotation.quotationDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("amalQilishMuddati")}</p>
                <p className="font-medium">{quotation.validUntil}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("valyuta")}</p>
                <p className="font-medium">{quotation.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("tolovShartlari")}</p>
                <p className="font-medium">{quotation.paymentTerms || "-"}</p>
              </div>
            </div>

            {quotation.notes && (
              <div>
                <p className="text-sm text-muted-foreground">{t("notes")}</p>
                <p className="font-medium">{quotation.notes}</p>
              </div>
            )}

            {quotation.items && quotation.items.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">{t("mahsulotlar")}</h4>
                <div className="border rounded-md">
                  <div className="ep-table-scroll"><Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>{t("Mahsulot")}</TableHead>
                        <TableHead className="text-right">{t("quantity")}</TableHead>
                        <TableHead className="text-right">{t("price")}</TableHead>
                        <TableHead className="text-right">{t("chegirma1")}</TableHead>
                        <TableHead className="text-right">{t("total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(quotation.items) ? quotation.items : []).map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell>{item.productName || item.description}</TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice, quotation.currency)}
                          </TableCell>
                          <TableCell className="text-right">{item.discount}%</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.netValue, quotation.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium">{t("jamiSumma")}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(quotation.totalValue, quotation.currency)}
                </p>
              </div>
            </div>

            {(quotation.status === "accepted" || quotation.status === "sent") && (
              <Button
                className="w-full"
                onClick={() => onConvertToOrder(quotation.id)}
                disabled={isConvertPending}
                data-testid="button-convert-to-order"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {isConvertPending ? "Aylantirilmoqda..." : "Buyurtmaga aylantirish"}
              </Button>
            )}

            {quotation.convertedToOrderId && (
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {t("buTaklifBuyurtmagaAylantirilgan")}
                </p>
                <p className="font-medium">Buyurtma ID: {quotation.convertedToOrderId}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
