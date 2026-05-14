/**
 * @module MaterialBalanceDialogs
 * @description Dialog components for the Material Balance page.
 * Currently contains the "Add Movement" dialog for recording stock in/out.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MovementForm } from "./MaterialBalanceTypes";

import { useTranslation } from '@/lib/i18n';
// ---------------------------------------------------------------------------
// AddMovementDialog
// ---------------------------------------------------------------------------

interface AddMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: MovementForm;
  onChange: (patch: Partial<MovementForm>) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function AddMovementDialog({open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
  isPending,
}: AddMovementDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t('materialHarakati')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="mv-material">Material (kod yoki nom)</Label>
            <Input
              id="mv-material"
              placeholder="Masalan: MAT-001"
              value={form.material}
              onChange={(e) => onChange({ material: e.target.value })}
              data-testid="input-movement-material"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mv-quantity">Miqdor</Label>
            <Input
              id="mv-quantity"
              type="number"
              min={0}
              placeholder="100"
              value={form.quantity}
              onChange={(e) => onChange({ quantity: e.target.value })}
              data-testid="input-movement-quantity"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mv-type">Turi</Label>
            <Select
              value={form.type}
              onValueChange={(v) => onChange({ type: v })}
            >
              <SelectTrigger id="mv-type" data-testid="select-movement-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kirim">Kirim</SelectItem>
                <SelectItem value="chiqim">Chiqim</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={isPending || !form.material || !form.quantity}
            data-testid="button-submit-movement"
          >
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
