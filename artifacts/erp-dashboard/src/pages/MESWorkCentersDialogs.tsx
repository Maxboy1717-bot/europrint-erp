/**
 * MESWorkCentersDialogs.tsx
 * Create Work Center and Create Session dialogs for MESWorkCenters
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WcFormState, SessionFormState } from "./MESWorkCentersTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Create Work Center Dialog ────────────────────────────────────────────────

interface CreateWCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WcFormState;
  onChange: (patch: Partial<WcFormState>) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateWCDialog({
  open, onOpenChange, form, onChange, onSubmit, isPending,
}: CreateWCDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("ishMarkaziYaratish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
          <Label>{t("name")}</Label>
            <Input
              value={form.name}
              onChange={e => onChange({ name: e.target.value })}
              placeholder={t("ishMarkaziNomi")}
            />
          </div>
          <div className="space-y-1">
          <Label>{t("kodi")}</Label>
            <Input
              value={form.code}
              onChange={e => onChange({ code: e.target.value })}
              placeholder="WC-001"
            />
          </div>
          <div className="space-y-1">
          <Label>{t("type")}</Label>
            <Select value={form.type} onValueChange={v => onChange({ type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="machine">{t("mashina")}</SelectItem>
                <SelectItem value="manual">{t("qolda")}</SelectItem>
                <SelectItem value="assembly">{t("yigish")}</SelectItem>
                <SelectItem value="quality">{t("sifatNazorat")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label>Quvvat (soat/smena)</Label>
            <Input
              type="number"
              value={form.capacity}
              onChange={e => onChange({ capacity: e.target.value })}
              placeholder="8"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !form.name}>
            {t("Yaratish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Session Dialog ────────────────────────────────────────────────────

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SessionFormState;
  onChange: (patch: Partial<SessionFormState>) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateSessionDialog({
  open, onOpenChange, form, onChange, onSubmit, isPending,
}: CreateSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiSessiyaYaratish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
          <Label>{t("uskunaId")}</Label>
            <Input
              value={form.equipmentId}
              onChange={e => onChange({ equipmentId: e.target.value })}
              placeholder="EQ-001"
            />
          </div>
          <div className="space-y-1">
          <Label>{t("maqsadliMiqdor")}</Label>
            <Input
              type="number"
              value={form.targetQuantity}
              onChange={e => onChange({ targetQuantity: e.target.value })}
              placeholder="100"
            />
          </div>
          <div className="space-y-1">
          <Label>{t("buyurtmaRaqami")}</Label>
            <Input
              value={form.orderNumber}
              onChange={e => onChange({ orderNumber: e.target.value })}
              placeholder="PP-2026-001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !form.equipmentId}>
            {t("Yaratish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
