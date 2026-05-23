/**
 * @module MMPurchaseOrderDialogs
 * @description getStatusBadge helper and MMPOViewDialog for MMPurchaseOrders.
 * Extracted from MMPurchaseOrders.tsx (Rule 16).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck, Clock, CheckCircle, XCircle, FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Vendor, RawMaterial, PurchaseOrderItem } from "@shared/schema";
import type { PurchaseOrder } from "@shared/schema";

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: PurchaseOrderItem[];
  vendor?: Vendor;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

export function getStatusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case "draft":
      return <Badge className="bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><FileText className="h-3 w-3" />{t("mm.statusDraft")}</Badge>;
    case "sent":
      return <Badge className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><Truck className="h-3 w-3" />{t("mm.statusSent")}</Badge>;
    case "confirmed":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><Clock className="h-3 w-3" />{t("mm.statusConfirmed")}</Badge>;
    case "received":
      return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><CheckCircle className="h-3 w-3" />{t("mm.statusReceived")}</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><XCircle className="h-3 w-3" />{t("mm.statusCancelled")}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─── View dialog ──────────────────────────────────────────────────────────────

interface MMPOViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewOrder: PurchaseOrderWithItems | null;
  vendors: Vendor[];
  rawMaterials: RawMaterial[];
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

function getVendorName(vendorId: string | null, vendors: Vendor[]): string {
  if (!vendorId) return "-";
  return (Array.isArray(vendors) ? vendors : []).find(v => v.id === vendorId)?.name ?? "-";
}

function getMaterialName(materialId: string | null, rawMaterials: RawMaterial[]): string {
  if (!materialId) return "-";
  return (Array.isArray(rawMaterials) ? rawMaterials : []).find(m => m.id === materialId)?.name ?? "-";
}

export function MMPOViewDialog({
  open, onOpenChange, viewOrder, vendors, rawMaterials, t, tCommon,
}: MMPOViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("mm.viewTitle")}</DialogTitle>
          <DialogDescription>{viewOrder?.poNumber}</DialogDescription>
        </DialogHeader>

        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("mm.poNumber")}</p>
                <p className="font-medium" data-testid="view-po-number">{viewOrder.poNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("mm.vendor")}</p>
                <p className="font-medium" data-testid="view-vendor">{getVendorName(viewOrder.vendorId, vendors)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("mm.orderDate")}</p>
                <p className="font-medium" data-testid="view-order-date">{viewOrder.orderDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("mm.deliveryDate")}</p>
                <p className="font-medium" data-testid="view-delivery-date">{viewOrder.deliveryDate ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("mm.totalAmount")}</p>
                <p className="font-medium" data-testid="view-total">
                  {formatCurrency(Number(viewOrder.totalAmount), viewOrder.currency ?? undefined)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("mm.status")}</p>
                <div data-testid="view-status">{getStatusBadge(viewOrder.status, t)}</div>
              </div>
            </div>

            {viewOrder.items && viewOrder.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{t("mm.orderItems")}</h4>
                <div className="ep-table-scroll">
                  <Table data-testid="view-items-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("mm.rawMaterial")}</TableHead>
                        <TableHead>{t("mm.quantity")}</TableHead>
                        <TableHead>{t("mm.unit")}</TableHead>
                        <TableHead>{t("mm.price")}</TableHead>
                        <TableHead>{t("mm.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(viewOrder.items) ? viewOrder.items : []).map((item, index) => (
                        <TableRow key={item.id ?? index} data-testid={`view-item-${index}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell>{getMaterialName(item.rawMaterialId, rawMaterials)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{formatCurrency(Number(item.unitPrice), viewOrder.currency ?? undefined)}</TableCell>
                          <TableCell>{formatCurrency(Number(item.totalPrice), viewOrder.currency ?? undefined)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
