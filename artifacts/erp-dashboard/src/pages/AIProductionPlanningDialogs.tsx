/** @module AIProductionPlanningDialogs @description Secondary dialog components for the AI Production Planning page: super-admin override, dynamic reschedule, blocked-by-material, and config dialogs. The plan-detail dialog lives in AIProductionPlanningDetailDialog.tsx. */

export { PlanDetailDialog } from "./AIProductionPlanningDetailDialog";
export type { PlanDetailDialogProps } from "./AIProductionPlanningDetailDialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Package, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { RescheduleType, getConfidenceColor } from "./AIProductionPlanningTypes";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
// ─── Override Dialog ──────────────────────────────────────────────────────────
interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planNumber: string | undefined;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function OverrideDialog({open, onOpenChange, planNumber, reason, onReasonChange, onConfirm, isPending,
}: OverrideDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> {t("rejaniTasdiqlash")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("reja1")}<strong>{planNumber}</strong></p>
          <div className="p-3 bg-amber-50 rounded-md text-xs text-[var(--ep-yellow)]">
            Super admin override: sabab kiritish majburiy (kamida 10 belgi). Log yoziladi.
          </div>
          <div>
            <Label>Override sababi (majburiy)</Label>
            <Textarea
              className="mt-1"
              placeholder={t("nimaUchunBuRejaQolda")}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              data-testid="input-override-reason"
            />
            <p className="text-xs text-muted-foreground mt-1">{reason.trim().length}/10 belgi minimal</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || reason.trim().length < 10}
            data-testid="button-confirm-override"
          >
            {isPending
              ? <EPLoader className="mr-1" />
              : <CheckCircle className="h-4 w-4 mr-1" />}
            Tasdiqlash va Log yozish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reschedule Dialog ────────────────────────────────────────────────────────
interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: string;
  onReasonChange: (v: string) => void;
  rescheduleType: RescheduleType;
  onTypeChange: (v: RescheduleType) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function RescheduleDialog({ open, onOpenChange, reason, onReasonChange, rescheduleType, onTypeChange, onConfirm, isPending, }: RescheduleDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[var(--ep-blue)]" /> {t("qaytaRejalashDynamicReschedule")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md text-xs text-[var(--ep-blue)]">
            {t("rejaQaytaRejalashtiriladiBarchaBuyurtmalar")}
          </div>
          <div>
            <Label>{t("sababTuri")}</Label>
            <Select value={rescheduleType} onValueChange={(v) => onTypeChange(v as RescheduleType)}>
              <SelectTrigger className="mt-1 h-9" data-testid="select-reschedule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="machine_stop">{t("mashinaToxtashi")}</SelectItem>
                <SelectItem value="material_shortage">{t('materialYetishmovchi')}</SelectItem>
                <SelectItem value="priority_change">{t("ustuvorlikOzgarishi")}</SelectItem>
                <SelectItem value="manual">{t("qoldaOzgartirish")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sabab (kamida 5 belgi)</Label>
            <Textarea
              className="mt-1"
              placeholder={t("qaytaRejalashSababi")}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
              data-testid="input-reschedule-reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || reason.trim().length < 5}
            data-testid="button-confirm-reschedule"
          >
            {isPending
              ? <EPLoader className="mr-1" />
              : <RotateCcw className="h-4 w-4 mr-1" />}
            Qayta Rejalash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Block Material Dialog ────────────────────────────────────────────────────
interface BlockMaterialDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  material: string;
  reason: string;
  onOrderIdChange: (v: string) => void;
  onMaterialChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function BlockMaterialDialog({ open, onOpenChange, orderId, material, reason, onOrderIdChange, onMaterialChange, onReasonChange, onConfirm, isPending, }: BlockMaterialDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--ep-yellow)]">
            <AlertCircle className="h-4 w-4" /> {t("materialYetishmovchiPpBloklash")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-md text-xs text-[var(--ep-yellow)]">
            {t("Buyurtma")}<strong>{t('blockedByMaterial')}</strong> {t("holatigaOtkaziladiMmGaAvtomatik")}
          </div>
          <div>
            <Label>{t("buyurtmaId")}</Label>
            <Input className="mt-1" placeholder={t("papkaorderIdYokiPapkaRaqami")} value={orderId} onChange={(e) => onOrderIdChange(e.target.value)} data-testid="input-block-order-id" />
          </div>
          <div>
            <Label>{t("yetishmayotganMaterialNomi")}</Label>
            <Input className="mt-1" placeholder="masalan: gofrokarton, PP lenta..." value={material} onChange={(e) => onMaterialChange(e.target.value)} data-testid="input-block-material" />
          </div>
          <div>
            <Label>Sabab (ixtiyoriy)</Label>
            <Input className="mt-1" placeholder={t("korsatilmagan")} value={reason} onChange={(e) => onReasonChange(e.target.value)} data-testid="input-block-reason" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button
            className="bg-[var(--ep-yellow)] text-white"
            onClick={onConfirm}
            disabled={isPending || !orderId || !material}
            data-testid="button-confirm-block-material"
          >
            {isPending
              ? <EPLoader className="mr-1" />
              : <Package className="h-4 w-4 mr-1" />}
            MM ga Xarid Talabi Yuborish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Config Dialog ────────────────────────────────────────────────────────────
interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  threshold: number;
  onThresholdChange: (v: number) => void;
  onSave: () => void;
  isPending: boolean;
}

export function ConfigDialog({
  open, onOpenChange, threshold, onThresholdChange, onSave, isPending,
}: ConfigDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("aiRejalashtirishSozlamalari")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">{t("avtoTasdiqlashChegarasi")}</label>
              <span
                className={cn("text-lg font-bold", getConfidenceColor(threshold))}
                data-testid="text-config-threshold"
              >
                {threshold}%
              </span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={(v) => onThresholdChange(v[0])}
              min={0} max={100} step={5}
              data-testid="slider-threshold"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {threshold}% dan yuqori ishonch bo'lsa avtomatik tasdiqlanadi
            </p>
          </div>
          <Button className="w-full" onClick={onSave} disabled={isPending} data-testid="button-save-config">
            {isPending
              ? <EPLoader className="mr-2" />
              : <Save className="h-4 w-4 mr-2" />}
            Saqlash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
