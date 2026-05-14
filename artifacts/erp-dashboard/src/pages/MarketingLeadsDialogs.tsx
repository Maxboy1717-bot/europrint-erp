/**
 * @module MarketingLeadsDialogs
 * @description All dialogs for MarketingLeads:
 *   - LeadFormDialog (create / edit lead)
 *   - FunnelDialog (marketing funnel visualisation)
 *   - DeleteLeadConfirm (ConfirmDialog wrapper)
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTranslation } from '@/lib/i18n';
import {
  sourceLabels,
  statusLabels,
  type FunnelStage,
  type LeadFormState,
} from "./MarketingLeadsTypes";

// ─── Lead create / edit dialog ───────────────────────────────────────────────

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editId: string | null;
  form: LeadFormState;
  onFormChange: (f: LeadFormState) => void;
  onSubmit: () => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
}

export function LeadFormDialog({open,
  onOpenChange,
  editId,
  form,
  onFormChange,
  onSubmit,
  isCreatePending,
  isUpdatePending,
}: LeadFormDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-create-lead">
          <Plus className="h-4 w-4" /> {t("yangiLid")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editId ? "Lidni tahrirlash" : "Yangi Lid"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("ism")}</Label>
            <Input
              data-testid="input-lead-name"
              value={form.name}
              onChange={e => onFormChange({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("company")}</Label>
            <Input
              data-testid="input-lead-company"
              value={form.company}
              onChange={e => onFormChange({ ...form, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("phone")}</Label>
              <Input
                data-testid="input-lead-phone"
                value={form.phone}
                onChange={e => onFormChange({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('email1')}</Label>
              <Input
                data-testid="input-lead-email"
                value={form.email}
                onChange={e => onFormChange({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("manba")}</Label>
              <Select
                value={form.source}
                onValueChange={v => onFormChange({ ...form, source: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(sourceLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("status28")}</Label>
              <Select
                value={form.status}
                onValueChange={v => onFormChange({ ...form, status: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.status === "lost" && (
            <div className="space-y-1.5">
              <Label>{t("yoqotishSababi")}</Label>
              <Input
                data-testid="input-lost-reason"
                value={form.lostReason}
                onChange={e => onFormChange({ ...form, lostReason: e.target.value })}
                placeholder={t("narxYuqoriRaqobatchiAloqaYoq")}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t("kanal")}</Label>
              <Input
                value={form.channel}
                onChange={e => onFormChange({ ...form, channel: e.target.value })}
                placeholder={t("telegramInstagram")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ball (0-100)</Label>
              <Input
                type="number"
                value={form.score}
                onChange={e => onFormChange({ ...form, score: e.target.value })}
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Textarea
              value={form.notes}
              onChange={e => onFormChange({ ...form, notes: e.target.value })}
            />
          </div>
          <Button
            onClick={onSubmit}
            disabled={!form.name || isCreatePending || isUpdatePending}
            className="w-full"
            data-testid="button-submit-lead"
          >
            {editId ? "Saqlash" : "Qo'shish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Funnel dialog ────────────────────────────────────────────────────────────

interface FunnelDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  funnelData: FunnelStage[];
}

export function FunnelDialog({ open, onOpenChange, funnelData }: FunnelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{"Marketing voronkasi"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {(Array.isArray(funnelData) ? funnelData : []).map((stage, i) => (
            <div
              key={stage.status}
              className="space-y-1"
              data-testid={`funnel-stage-${stage.status}`}
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{stage.label}</span>
                <span className="text-muted-foreground">{stage.count} ta</span>
              </div>
              <div className="bg-muted/60 rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${Math.max(stage.conversionRate, 2)}%` }}
                />
              </div>
              {i > 0 && stage.dropOff > 0 && (
                <p className="text-xs text-[var(--ep-red)]">-{stage.dropOff}% oldingi bosqichdan</p>
              )}
            </div>
          ))}
          {funnelData.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              {t("malumotYuklanmoqda")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

interface DeleteLeadConfirmProps {
  deleteId: string | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function DeleteLeadConfirm({
  deleteId,
  onOpenChange,
  onConfirm,
}: DeleteLeadConfirmProps) {
  return (
    <ConfirmDialog
      open={!!deleteId}
      onOpenChange={onOpenChange}
      title={t("lidniOchirish")}
      description={t("ushbuMarketingLidniOchirishniTasdiqlaysizmi")}
      confirmText="O'chirish"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}
