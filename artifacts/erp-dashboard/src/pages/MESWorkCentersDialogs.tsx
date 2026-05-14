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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Ish markazi yaratish</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
          <Label>Nomi</Label>
            <Input
              value={form.name}
              onChange={e => onChange({ name: e.target.value })}
              placeholder="Ish markazi nomi"
            />
          </div>
          <div className="space-y-1">
          <Label>Kodi</Label>
            <Input
              value={form.code}
              onChange={e => onChange({ code: e.target.value })}
              placeholder="WC-001"
            />
          </div>
          <div className="space-y-1">
          <Label>Turi</Label>
            <Select value={form.type} onValueChange={v => onChange({ type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="machine">Mashina</SelectItem>
                <SelectItem value="manual">Qo'lda</SelectItem>
                <SelectItem value="assembly">Yig'ish</SelectItem>
                <SelectItem value="quality">Sifat nazorat</SelectItem>
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
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !form.name}>
            Yaratish
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
          <DialogTitle className="text-[18px] font-semibold">Yangi sessiya yaratish</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
          <Label>Uskuna ID</Label>
            <Input
              value={form.equipmentId}
              onChange={e => onChange({ equipmentId: e.target.value })}
              placeholder="EQ-001"
            />
          </div>
          <div className="space-y-1">
          <Label>Maqsadli miqdor</Label>
            <Input
              type="number"
              value={form.targetQuantity}
              onChange={e => onChange({ targetQuantity: e.target.value })}
              placeholder="100"
            />
          </div>
          <div className="space-y-1">
          <Label>Buyurtma raqami</Label>
            <Input
              value={form.orderNumber}
              onChange={e => onChange({ orderNumber: e.target.value })}
              placeholder="PP-2026-001"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !form.equipmentId}>
            Yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
