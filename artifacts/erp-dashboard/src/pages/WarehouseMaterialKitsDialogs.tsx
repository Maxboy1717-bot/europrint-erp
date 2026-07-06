/**
 * @module WarehouseMaterialKitsDialogs
 * @description Dialog components for WarehouseMaterialKits page.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calculator, Printer, RefreshCw, Box, Package, CheckCircle, AlertTriangle } from "lucide-react";
import type { MaterialKit, MaterialKitItem, PapkaOrder } from "./WarehouseMaterialKitsTypes";
import { MATERIAL_ICONS, MATERIAL_COLORS } from "./WarehouseMaterialKitsTypes";

// ── Helper components ────────────────────────────────────────────────────────

interface PendingOrdersListProps {
  pendingOrders: PapkaOrder[];
  selectedOrderId: number | null;
  onSelectOrder: (id: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function PendingOrdersList({ pendingOrders, selectedOrderId, onSelectOrder, t }: PendingOrdersListProps) {
  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] text-muted-foreground">
        {t("WarehouseMaterialKits.allOrdersHaveKits")}
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-[400px] overflow-auto">
      {(Array.isArray(pendingOrders) ? pendingOrders : []).map(order => (
        <Card
          key={order.id}
          className={`cursor-pointer transition-all hover-elevate ${selectedOrderId === order.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => onSelectOrder(order.id)}
          data-testid={`order-select-${order.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{order.papkaNo}</p>
                <p className="text-sm text-muted-foreground">{order.naimenovanie}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{order.tiraj?.toLocaleString()} {t("WarehouseDailyView.unitDona")}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{order.formatA} x {order.formatB} mm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface KitItemsListProps {
  kitItems: MaterialKitItem[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function KitItemsList({ kitItems, t }: KitItemsListProps) {
  if (kitItems.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        {t("WarehouseDailyView.materialsLoading")}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {(Array.isArray(kitItems) ? kitItems : []).map(item => {
        const Icon = MATERIAL_ICONS[item.materialType.toLowerCase()] || Package;
        const colorClass = MATERIAL_COLORS[item.materialType.toLowerCase()] || "bg-muted/40 text-foreground";
        const progress = item.actualQuantity ? (item.actualQuantity / item.plannedQuantity) * 100 : 0;
        return (
          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`kit-item-${item.id}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClass}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="font-medium">{item.materialName}</p>
                <p className="text-sm text-muted-foreground capitalize">{item.materialType}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{item.actualQuantity || 0} / {item.plannedQuantity} {item.unit}</p>
                <Progress value={progress} className="h-2 w-24" />
              </div>
              {item.isScanned
                ? <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                : <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Dialogs ──────────────────────────────────────────────────────────────────

interface CreateKitDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pendingOrders: PapkaOrder[];
  selectedOrderId: number | null;
  onSelectOrder: (id: number) => void;
  onCalculate: () => void;
  isPending: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function CreateKitDialog({
  open, onOpenChange, pendingOrders, selectedOrderId, onSelectOrder, onCalculate, isPending, t,
}: CreateKitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("WarehouseMaterialKits.createDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("WarehouseMaterialKits.createDialogHint")}
          </p>
          <PendingOrdersList pendingOrders={pendingOrders} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} t={t} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("WarehouseDailyView.cancelButton")}
          </Button>
          <Button onClick={onCalculate} disabled={!selectedOrderId || isPending} data-testid="button-calculate-bom">
            {isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
            {t("WarehouseMaterialKits.calculateWithAiButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface KitDetailsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedKit: MaterialKit | null;
  kitItems: MaterialKitItem[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function KitDetailsDialog({ open, onOpenChange, selectedKit, kitItems, t }: KitDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t("WarehouseMaterialKits.kitDetailsTitle")}: {selectedKit?.kitNumber}
          </DialogTitle>
        </DialogHeader>
        {selectedKit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{t("WarehouseMaterialKits.colOrder")}</Label>
                <p className="font-medium">{selectedKit.order?.papkaNo}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("WarehouseMaterialKits.colProduct")}</Label>
                <p className="font-medium">{selectedKit.order?.naimenovanie}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("WarehouseMaterialKits.colQty")}</Label>
                <p className="font-medium">{selectedKit.order?.tiraj?.toLocaleString()} {t("WarehouseDailyView.unitDona")}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("WarehouseMaterialKits.sizeLabel")}</Label>
                <p className="font-medium">{selectedKit.order?.formatA} x {selectedKit.order?.formatB} mm</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Box className="h-4 w-4" />
                {t("WarehouseMaterialKits.materialsListTitle")}
              </h4>
              <KitItemsList kitItems={kitItems} t={t} />
            </div>
            {selectedKit.barcode && (
              <div className="border-t pt-4">
                <Label className="text-muted-foreground">{t("WarehouseMaterialKits.barcodeLabel")}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-3 py-2 rounded font-mono text-lg">{selectedKit.barcode}</code>
                  <Button size="sm" variant="outline">
                    <Printer className="h-4 w-4 mr-1" />{t("WarehouseDailyView.printButton")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("WarehouseMaterialKits.closeButton")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
