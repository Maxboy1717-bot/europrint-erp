import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Barcode, Copy, Printer, X } from "lucide-react";
import type { BatchData, MaterialCard, Warehouse, PrintData } from "./barcode-types";
import { STATUS_COLORS, QC_STATUS_COLORS } from "./barcode-types";
import type { translations } from "./barcode-types";

type TranslationType = typeof translations.uz;

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBatch: BatchData | null;
  batchForm: {
    batchNumber: string;
    materialCardId: string;
    warehouseId: string;
    quantity: number;
    remainingQuantity: number;
    unitCost: number;
    productionDate: string;
    expiryDate: string;
    supplierBatchNumber: string;
    qcStatus: string;
    status: string;
    notes: string;
  };
  onFormChange: (form: BatchFormDialogProps["batchForm"]) => void;
  onSave: () => void;
  isSaving: boolean;
  materials: MaterialCard[];
  warehouses: Warehouse[];
  t: TranslationType;
}

export function BatchFormDialog({
  open,
  onOpenChange,
  editingBatch,
  batchForm,
  onFormChange,
  onSave,
  isSaving,
  materials,
  warehouses,
  t,
}: BatchFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingBatch ? t.editBatch : t.createBatch}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>{t.batchNumber} *</Label>
            <Input
              value={batchForm.batchNumber}
              onChange={(e) => onFormChange({ ...batchForm, batchNumber: e.target.value })}
              data-testid="input-batch-number"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.material}</Label>
            <Select
              value={batchForm.materialCardId}
              onValueChange={(v) => onFormChange({ ...batchForm, materialCardId: v })}
            >
              <SelectTrigger data-testid="select-batch-material">
                <SelectValue placeholder={t.selectMaterial} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(materials) ? materials : []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.kod} - {m.xomAshyo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.warehouse}</Label>
            <Select
              value={batchForm.warehouseId}
              onValueChange={(v) => onFormChange({ ...batchForm, warehouseId: v })}
            >
              <SelectTrigger data-testid="select-batch-warehouse">
                <SelectValue placeholder={t.selectWarehouse} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(warehouses) ? warehouses : []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.quantity} *</Label>
            <Input
              type="number"
              value={batchForm.quantity}
              onChange={(e) => onFormChange({ ...batchForm, quantity: parseFloat(e.target.value) || 0 })}
              data-testid="input-batch-quantity"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.remaining}</Label>
            <Input
              type="number"
              value={batchForm.remainingQuantity}
              onChange={(e) => onFormChange({ ...batchForm, remainingQuantity: parseFloat(e.target.value) || 0 })}
              data-testid="input-batch-remaining"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.unitCost}</Label>
            <Input
              type="number"
              value={batchForm.unitCost}
              onChange={(e) => onFormChange({ ...batchForm, unitCost: parseFloat(e.target.value) || 0 })}
              data-testid="input-batch-unit-cost"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.productionDate}</Label>
            <Input
              type="date"
              value={batchForm.productionDate}
              onChange={(e) => onFormChange({ ...batchForm, productionDate: e.target.value })}
              data-testid="input-batch-production-date"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.expiryDate}</Label>
            <Input
              type="date"
              value={batchForm.expiryDate}
              onChange={(e) => onFormChange({ ...batchForm, expiryDate: e.target.value })}
              data-testid="input-batch-expiry-date"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.supplierBatch}</Label>
            <Input
              value={batchForm.supplierBatchNumber}
              onChange={(e) => onFormChange({ ...batchForm, supplierBatchNumber: e.target.value })}
              data-testid="input-batch-supplier"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.qcStatus}</Label>
            <Select
              value={batchForm.qcStatus}
              onValueChange={(v) => onFormChange({ ...batchForm, qcStatus: v })}
            >
              <SelectTrigger data-testid="select-batch-qc-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t.qcStatuses.pending}</SelectItem>
                <SelectItem value="approved">{t.qcStatuses.approved}</SelectItem>
                <SelectItem value="rejected">{t.qcStatuses.rejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t.status}</Label>
            <Select
              value={batchForm.status}
              onValueChange={(v) => onFormChange({ ...batchForm, status: v })}
            >
              <SelectTrigger data-testid="select-batch-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t.statuses.active}</SelectItem>
                <SelectItem value="depleted">{t.statuses.depleted}</SelectItem>
                <SelectItem value="blocked">{t.statuses.blocked}</SelectItem>
                <SelectItem value="expired">{t.statuses.expired}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label>{t.notes}</Label>
            <Textarea
              value={batchForm.notes}
              onChange={(e) => onFormChange({ ...batchForm, notes: e.target.value })}
              data-testid="input-batch-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button onClick={onSave} disabled={isSaving} data-testid="button-save-batch">
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BatchViewDialogProps {
  batch: BatchData | null;
  onClose: () => void;
  t: TranslationType;
  lang: "uz" | "ru";
}

export function BatchViewDialog({ batch, onClose, t, lang }: BatchViewDialogProps) {
  if (!batch) return null;
  return (
    <Dialog open={!!batch} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            {t.batchDetails}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.batchNumber}:</span>
            <span className="font-medium">{batch.batchNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.material}:</span>
            <span>{batch.materialName || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.warehouse}:</span>
            <span>{batch.warehouseName || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.quantity}:</span>
            <span>{batch.quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.remaining}:</span>
            <span>{batch.remainingQuantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.productionDate}:</span>
            <span>{batch.productionDate || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.expiryDate}:</span>
            <span>{batch.expiryDate || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t.qcStatus}:</span>
            <Badge className={QC_STATUS_COLORS[batch.qcStatus || "pending"]}>
              {t.qcStatuses[batch.qcStatus as keyof typeof t.qcStatuses] || batch.qcStatus}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t.status}:</span>
            <Badge className={STATUS_COLORS[batch.status || "active"]}>
              {t.statuses[batch.status as keyof typeof t.statuses] || batch.status}
            </Badge>
          </div>
          {batch.barcode && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{lang === "uz" ? "Shtrix-kod" : "Штрих-код"}:</span>
              <span className="font-mono">{batch.barcode}</span>
            </div>
          )}
          {batch.notes && (
            <div>
              <span className="text-muted-foreground">{t.notes}:</span>
              <p className="mt-1 text-sm">{batch.notes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{lang === "uz" ? "Yopish" : "Закрыть"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printData: PrintData | null;
  onPrint: () => void;
  onCopy: (text: string) => void;
  lang: "uz" | "ru";
  t: TranslationType;
}

export function PrintPreviewDialog({ open, onOpenChange, printData, onPrint, onCopy, lang, t }: PrintPreviewDialogProps) {
  if (!printData) return null;
  const labels = printData.labels[lang];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.printPreview}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-6 border-2 border-dashed rounded-lg text-center">
            <p className="font-bold text-lg mb-2">{labels.title}</p>
            <div className="font-mono text-2xl tracking-wider mb-2">{printData.barcode}</div>
            <div className="flex justify-center gap-1 h-12">
              {printData.barcode.split("").map((char, i) => (
                <div
                  key={`k-${i}`}
                  className="bg-foreground"
                  style={{ width: char.match(/[0-9]/) ? `${(parseInt(char) + 1) * 2}px` : "3px" }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">{labels.material}:</div>
            <div>{printData.materialName}</div>
            <div className="text-muted-foreground">{labels.code}:</div>
            <div>{printData.materialCode}</div>
            {printData.type === "batch" && (
              <>
                <div className="text-muted-foreground">{labels.batch}:</div>
                <div>{printData.batchNumber || "-"}</div>
                <div className="text-muted-foreground">{labels.warehouse}:</div>
                <div>{printData.warehouseName || "-"}</div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onCopy(printData.barcode)}>
            <Copy className="h-4 w-4 mr-2" />
            {t.copy}
          </Button>
          <Button onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t.print}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}