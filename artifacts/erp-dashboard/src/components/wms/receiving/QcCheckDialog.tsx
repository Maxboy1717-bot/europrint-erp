/**
 * @module QcCheckDialog
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { GoodsReceiptLine } from "./types";
import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";
import { useLanguage } from "@/lib/i18n";

interface QcCheckDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLine: GoodsReceiptLine | null;
  qcAction: "pass" | "fail";
  qcNotes: string;
  setQcNotes: (notes: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function QcCheckDialog({
  isOpen,
  onOpenChange,
  selectedLine,
  qcAction,
  qcNotes,
  setQcNotes,
  onConfirm,
  isPending,
}: QcCheckDialogProps) {
  const t = useGoodsReceivingTranslations();
  const { language } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {qcAction === "pass" ? (
              <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
            ) : (
              <XCircle className="h-5 w-5 text-[var(--ep-red)]" />
            )}
            {qcAction === "pass" ? t.pass : t.fail}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">{t.material}</p>
            <p className="font-medium">{selectedLine?.materialName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.quantity}</p>
            <p className="font-medium">{selectedLine?.receivedQuantity}</p>
          </div>
          <div className="grid gap-2">
            <Label>{t.qcNotes}</Label>
            <Textarea
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              rows={3}
              placeholder={language === "uz" ? "Izoh qo'shing..." : "Добавьте примечание..."}
              data-testid="input-qc-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className={qcAction === "pass" ? "bg-green-600 hover:bg-[var(--ep-green)]/90" : "bg-red-600 hover:bg-[var(--ep-red)]/90"}
            data-testid="button-confirm-qc"
          >
            {qcAction === "pass" ? t.pass : t.fail}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
