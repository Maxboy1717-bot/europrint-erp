/**
 * @module POSInventoryPageDialogs
 * @description Dialog components for POSInventoryPage.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { PosProduct } from "./POSInventoryPageTypes";
import { useTranslation } from '@/lib/i18n';

interface AdjustDialogProps {
  adjustProduct: PosProduct | null;
  adjustQty: string;
  adjustType: string;
  adjustReason: string;
  isPending: boolean;
  onClose: () => void;
  onQtyChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onConfirm: () => void;
}

export function AdjustDialog({
  adjustProduct,
  adjustQty,
  adjustType,
  adjustReason,
  isPending,
  onClose,
  onQtyChange,
  onTypeChange,
  onReasonChange,
  onConfirm,
}: AdjustDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={!!adjustProduct} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("inventarTuzatish")}</DialogTitle>
        </DialogHeader>
        {adjustProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm space-y-1">
              <p className="font-semibold">{adjustProduct.name}</p>
              <p className="text-gray-500 font-mono">{adjustProduct.barcode}</p>
              <p className="text-gray-500">
                {t("joriyQoldiq")}
                <span className="font-bold ml-1">{Number(adjustProduct.stockQuantity ?? 0)} {adjustProduct.unit}</span>
              </p>
            </div>

            <div className="space-y-1">
          <Label>{t("harakatTuri1")}</Label>
              <Select value={adjustType} onValueChange={onTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Kirim (qo'shish)</SelectItem>
                  <SelectItem value="out">Chiqim (ayirish)</SelectItem>
                  <SelectItem value="adjustment">Tuzatish (aniq qiymat)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
          <Label>
                {adjustType === "adjustment" ? "Yangi miqdor" : "Miqdor"}
              </Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={e => onQtyChange(e.target.value)}
                placeholder="0"
                min={0}
              />
            </div>

            <div className="space-y-1">
          <Label>Sabab (ixtiyoriy)</Label>
              <Textarea
                value={adjustReason}
                onChange={e => onReasonChange(e.target.value)}
                placeholder={t("tuzatishSababi")}
                rows={2}
              />
            </div>

            {adjustQty && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm">
                <p className="text-[var(--ep-blue)]">
                  {adjustType === "adjustment"
                    ? `${Number(adjustProduct.stockQuantity ?? 0)} → ${Number(adjustQty)}`
                    : adjustType === "in"
                    ? `${Number(adjustProduct.stockQuantity ?? 0)} + ${adjustQty} = ${Number(adjustProduct.stockQuantity ?? 0) + Number(adjustQty)}`
                    : `${Number(adjustProduct.stockQuantity ?? 0)} - ${adjustQty} = ${Math.max(0, Number(adjustProduct.stockQuantity ?? 0) - Number(adjustQty))}`}
                  {" "}
                  {adjustProduct.unit}
                </p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            onClick={onConfirm}
            disabled={!adjustQty || Number(adjustQty) < 0 || isPending}
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
