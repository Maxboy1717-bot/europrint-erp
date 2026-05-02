import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MaterialCard, WarehouseBin } from "./types";
import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";

interface ItemEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  materials: MaterialCard[];
  bins: WarehouseBin[];
  lineFormData: {
    materialCardId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
    batchNumber: string;
    expiryDate: string;
    binId: string;
  };
  setLineFormData: (data: { materialCardId: string; orderedQuantity: number; receivedQuantity: number; unitCost: number; batchNumber: string; expiryDate: string; binId: string }) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function ItemEntryDialog({
  isOpen,
  onOpenChange,
  materials,
  bins,
  lineFormData,
  setLineFormData,
  onSubmit,
  isPending,
}: ItemEntryDialogProps) {
  const t = useGoodsReceivingTranslations();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t.addLine}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2 col-span-2">
            <Label>{t.material}</Label>
            <Select
              value={lineFormData.materialCardId}
              onValueChange={(val) => {
                const mat = materials?.find((m) => m.id === val);
                setLineFormData({
                  ...lineFormData,
                  materialCardId: val,
                  unitCost: mat?.unitPrice || 0,
                });
              }}
            >
              <SelectTrigger data-testid="select-material">
                <SelectValue placeholder={t.selectMaterial} />
              </SelectTrigger>
              <SelectContent>
                {materials?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.kod} - {m.xomAshyo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t.orderedQty}</Label>
            <Input
              type="number"
              value={lineFormData.orderedQuantity}
              onChange={(e) =>
                setLineFormData({ ...lineFormData, orderedQuantity: Number(e.target.value) })
              }
              data-testid="input-ordered-qty"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.receivedQty}</Label>
            <Input
              type="number"
              value={lineFormData.receivedQuantity}
              onChange={(e) =>
                setLineFormData({ ...lineFormData, receivedQuantity: Number(e.target.value) })
              }
              data-testid="input-received-qty"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.unitCost}</Label>
            <Input
              type="number"
              value={lineFormData.unitCost}
              onChange={(e) => setLineFormData({ ...lineFormData, unitCost: Number(e.target.value) })}
              data-testid="input-unit-cost"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.batchNumber}</Label>
            <Input
              value={lineFormData.batchNumber}
              onChange={(e) => setLineFormData({ ...lineFormData, batchNumber: e.target.value })}
              data-testid="input-batch-number"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.expiryDate}</Label>
            <Input
              type="date"
              value={lineFormData.expiryDate}
              onChange={(e) => setLineFormData({ ...lineFormData, expiryDate: e.target.value })}
              data-testid="input-expiry-date"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.bin}</Label>
            <Select
              value={lineFormData.binId}
              onValueChange={(val) => setLineFormData({ ...lineFormData, binId: val })}
            >
              <SelectTrigger data-testid="select-bin">
                <SelectValue placeholder={t.bin} />
              </SelectTrigger>
              <SelectContent>
                {bins?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.binCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={isPending} data-testid="button-save-line">
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
