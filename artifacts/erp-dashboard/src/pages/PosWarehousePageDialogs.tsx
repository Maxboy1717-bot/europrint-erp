/**
 * PosWarehousePageDialogs — Movement dialog for POS ↔ Warehouse page.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTranslation } from '@/lib/i18n';
import {
  StockItem,
  Warehouse,
  MovementForm,
  MOVEMENT_TYPES,
} from "./PosWarehousePageTypes";

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: StockItem | null;
  form: MovementForm;
  onFormChange: (updater: (prev: MovementForm) => MovementForm) => void;
  onSubmit: () => void;
  isPending: boolean;
  warehouses: Warehouse[];
}

export function MovementDialog({
  open,
  onOpenChange,
  selectedItem,
  form,
  onFormChange,
  onSubmit,
  isPending,
  warehouses,
}: MovementDialogProps) {
  const { t } = useTranslation("common");
  const uniqueMovementTypes = MOVEMENT_TYPES.filter(
    (m, i, arr) => arr.findIndex((x) => x.value === m.value) === i,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiMovement")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {selectedItem && (
            <div className="p-2 bg-muted rounded text-sm">
              <div className="font-medium">{selectedItem.materialName}</div>
              <div className="text-xs text-muted-foreground">
                {selectedItem.materialCode} · {selectedItem.warehouseCode} ·{" "}
                {selectedItem.available} {selectedItem.unit}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium">{t("movementTuri")}</label>
            <Select
              value={form.movementType}
              onValueChange={(v) =>
                onFormChange((f) => ({ ...f, movementType: v }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {uniqueMovementTypes.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium">{t("qaerdan")}</label>
              <Select
                value={form.fromWarehouseId}
                onValueChange={(v) =>
                  onFormChange((f) => ({ ...f, fromWarehouseId: v }))
                }
              >
                <SelectTrigger><SelectValue placeholder={t("ombor")} /></SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">{t("qayerga")}</label>
              <Select
                value={form.toWarehouseId}
                onValueChange={(v) =>
                  onFormChange((f) => ({ ...f, toWarehouseId: v }))
                }
              >
                <SelectTrigger><SelectValue placeholder={t("ombor")} /></SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">{t("miqdor1")}</label>
            <Input
              type="number"
              value={form.quantity}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, quantity: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs font-medium">{t("sabab")}</label>
            <Input
              value={form.reason}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder={t("nimaUchun")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
