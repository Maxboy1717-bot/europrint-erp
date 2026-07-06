/**
 * @module WarehouseDailyViewDialogs
 * @description Dialog components for WarehouseDailyView page.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package, Barcode, CheckCircle, Clock,
  Calculator, Printer, RefreshCw, Layers, PackagePlus
} from "lucide-react";
import type { DailyOrder, MaterialKit, MaterialKitItem, Equipment } from "./WarehouseDailyViewTypes";
import { STATUS_COLORS } from "./WarehouseDailyViewTypes";

interface CreateKitDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedOrder: DailyOrder | null;
  scheduledTime: string;
  setScheduledTime: (v: string) => void;
  selectedEquipmentId: string;
  setSelectedEquipmentId: (v: string) => void;
  equipment: Equipment[];
  onConfirm: () => void;
  isPending: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function CreateKitDialog({
  open, onOpenChange, selectedOrder, scheduledTime, setScheduledTime,
  selectedEquipmentId, setSelectedEquipmentId, equipment, onConfirm, isPending, t,
}: CreateKitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("WarehouseDailyView.createKitTitle")}</DialogTitle>
          <DialogDescription>
            {selectedOrder && (
              <span className="font-mono">{selectedOrder.papkaNo} - {selectedOrder.mahsulotNomi}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
          <Label>{t("WarehouseDailyView.productionTimeLabel")}</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              data-testid="input-scheduled-time"
            />
          </div>
          <div className="space-y-1">
          <Label>{t("WarehouseDailyView.equipmentLabel")}</Label>
            <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
              <SelectTrigger data-testid="select-equipment" className="h-9">
                <SelectValue placeholder={t("WarehouseDailyView.selectEquipmentPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(equipment) ? equipment : []).map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.equipmentNumber} - {eq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              <span>{t("WarehouseDailyView.aiAutoCalcNote")}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("WarehouseDailyView.cancelButton")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            data-testid="button-confirm-create-kit"
          >
            {isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PackagePlus className="h-4 w-4 mr-2" />
            )}
            {t("WarehouseDailyView.createButton")}
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
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {selectedKit?.kitNumber}
          </DialogTitle>
          <DialogDescription>
            {t("WarehouseDailyView.kitDetailsSubtitle")}
          </DialogDescription>
        </DialogHeader>
        {selectedKit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">{t("WarehouseDailyView.statusLabel")}</div>
                <Badge className={`mt-1 ${STATUS_COLORS[selectedKit.status]?.bg} ${STATUS_COLORS[selectedKit.status]?.text}`}>
                  {t(STATUS_COLORS[selectedKit.status]?.labelKey)}
                </Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">{t("WarehouseDailyView.barcodeLabel")}</div>
                <div className="font-mono font-bold mt-1 flex items-center gap-2">
                  <Barcode className="h-4 w-4" />
                  {selectedKit.barcode}
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/50">
                <h4 className="font-medium flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t("WarehouseDailyView.materialsLabel")} ({kitItems.length})
                </h4>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("WarehouseDailyView.materialLabel")}</TableHead>
                      <TableHead className="text-right">{t("WarehouseDailyView.requiredLabel")}</TableHead>
                      <TableHead className="text-center">{t("WarehouseDailyView.barcodeLabel")}</TableHead>
                      <TableHead className="text-center">{t("WarehouseDailyView.scannedLabel")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(kitItems) ? kitItems : []).map((item) => (
                      <TableRow key={item.id} className={item.isScanned ? "bg-green-50 dark:bg-green-950/20" : ""}>
                        <TableCell className="font-medium">{item.materialName}</TableCell>
                        <TableCell className="text-right">{item.requiredQuantity} {item.unit}</TableCell>
                        <TableCell className="text-center font-mono text-xs">{item.itemBarcode}</TableCell>
                        <TableCell className="text-center">
                          {item.isScanned ? (
                            <CheckCircle className="h-5 w-5 text-[var(--ep-green)] mx-auto" />
                          ) : (
                            <Clock className="h-5 w-5 text-[var(--ep-yellow)] mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {kitItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">
                          {t("WarehouseDailyView.materialsLoading")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table></div>
              </ScrollArea>
            </div>

            <div className="flex items-center gap-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Printer className="h-5 w-5 text-[var(--ep-blue)]" />
              <span className="text-sm flex-1">{t("WarehouseDailyView.printBarcodeHint")}</span>
              <Button size="sm" variant="outline" onClick={() => window.print()} data-testid="button-print-barcode">
                <Printer className="h-4 w-4 mr-2" />
                {t("WarehouseDailyView.printButton")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
