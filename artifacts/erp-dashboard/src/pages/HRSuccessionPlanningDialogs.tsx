/**
 * @module HRSuccessionPlanningDialogs
 * @description Dialog components for HRSuccessionPlanning page.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { NewPlanForm } from "./HRSuccessionPlanningTypes";
import { useTranslation } from '@/lib/i18n';

interface NewPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewPlanForm;
  onFormChange: (updater: (f: NewPlanForm) => NewPlanForm) => void;
  isPending: boolean;
  onSubmit: () => void;
  /** Real positions list (/api/hr/positions) — target position the candidate is being groomed for. */
  positions?: Record<string, unknown>[];
}

export function NewPlanDialog({
  open, onOpenChange, form, onFormChange, isPending, onSubmit, positions,
}: NewPlanDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-plan">
          <Plus className="h-4 w-4 mr-1" /> {t("yangiReja1")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiVorislikRejasi")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>{t("xodimId")}</Label>
            <Input
              data-testid="input-plan-user-id"
              value={form.userId}
              onChange={e => onFormChange(f => ({ ...f, userId: e.target.value }))}
              placeholder={t("xodimIdSi")}
            />
          </div>
          <div>
            <Label>{t("maqsadLavozim1", "Maqsad lavozim")}</Label>
            <Select
              value={form.targetPositionId}
              onValueChange={(value) => onFormChange(f => ({ ...f, targetPositionId: value }))}
            >
              <SelectTrigger data-testid="select-plan-target-position">
                <SelectValue placeholder={t("maqsadLavozim1", "Maqsad lavozim")} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(positions) ? positions : []).map((p) => (
                  <SelectItem key={String(p.id)} value={String(p.id)}>
                    {String(p.name ?? p.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("maqsadSana1")}</Label>
            <Input
              data-testid="input-plan-target-date"
              type="date"
              value={form.targetDate}
              onChange={e => onFormChange(f => ({ ...f, targetDate: e.target.value }))}
            />
          </div>
          <div>
            <Label>{t("Izoh")}</Label>
            <Textarea
              data-testid="input-plan-notes"
              value={form.notes}
              onChange={e => onFormChange(f => ({ ...f, notes: e.target.value }))}
              placeholder={t("rejaHaqidaIzoh")}
            />
          </div>
          <Button
            data-testid="button-submit-plan"
            className="w-full"
            disabled={!form.userId || isPending}
            onClick={onSubmit}
          >
            {t("Saqlash")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
