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

// ---------------------------------------------------------------------------
// Status badge helper (local to this component)
// ---------------------------------------------------------------------------

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <Clock className="h-3 w-3 mr-1" />Qoralama
        </Badge>
      );
    case "sent":
      return (
        <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <Send className="h-3 w-3 mr-1" />Yuborilgan
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <CheckCircle className="h-3 w-3 mr-1" />Qabul qilindi
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <XCircle className="h-3 w-3 mr-1" />Rad etildi
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <AlertCircle className="h-3 w-3 mr-1" />Muddati o'tgan
        </Badge>
      );
    case "converted":
      return (
        <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
          <RefreshCw className="h-3 w-3 mr-1" />Aylantirilgan
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle>Taklif tafsilotlari</SheetTitle>
          <SheetDescription>{quotation?.quotationNumber}</SheetDescription>
        </SheetHeader>

        {quotation && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mijoz</p>
                <p className="font-medium">{quotation.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holat</p>
                <div>{getStatusBadge(quotation.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taklif sanasi</p>
                <p className="font-medium">{quotation.quotationDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amal qilish muddati</p>
                <p className="font-medium">{quotation.validUntil}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valyuta</p>
                <p className="font-medium">{quotation.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To'lov shartlari</p>
                <p className="font-medium">{quotation.paymentTerms || "-"}</p>
              </div>
            </div>

            {quotation.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Izohlar</p>
                <p className="font-medium">{quotation.notes}</p>
              </div>
            )}

            {quotation.items && quotation.items.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Mahsulotlar</h4>
                <div className="border rounded-md">
                  <div className="ep-table-scroll"><Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                      <TableRow>
                        <TableHead>Mahsulot</TableHead>
                        <TableHead className="text-right">Miqdor</TableHead>
                        <TableHead className="text-right">Narx</TableHead>
                        <TableHead className="text-right">Chegirma</TableHead>
                        <TableHead className="text-right">Jami</TableHead>
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
                <p className="text-lg font-medium">Jami summa</p>
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
                  Bu taklif buyurtmaga aylantirilgan
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
