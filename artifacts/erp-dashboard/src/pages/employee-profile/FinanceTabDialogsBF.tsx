/** @module FinanceTabDialogsBF @description Bonus and Fine dialog form components for the employee finance tab. */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { TranslationFn } from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BonusForm, FineForm } from "./FinanceTabTypes";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// BonusDialog
// ---------------------------------------------------------------------------

interface BonusDialogProps {
  tCommon: TranslationFn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BonusForm;
  setForm: (form: BonusForm) => void;
  mutation: UseMutationResult<unknown, Error, any, unknown>;
}

export function BonusDialog({ tCommon, open, onOpenChange, form, setForm, mutation }: BonusDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-bonus">
          <Plus className="h-4 w-4 mr-2" />
          {t("yangiBonus")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiBonusQoshish")}</DialogTitle>
          <DialogDescription>{t("xodimgaBonusBerish")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("tolovSanasi")}</Label>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                data-testid="input-bonus-date"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("summaSoM")}</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="500000"
                data-testid="input-bonus-amount"
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label>{t("bonusTuri")}</Label>
            <Select value={form.bonusType} onValueChange={(value) => setForm({ ...form, bonusType: value })}>
              <SelectTrigger data-testid="select-bonus-type" className="h-9">
                <SelectValue placeholder={t("turniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">{t("samaradorlik")}</SelectItem>
                <SelectItem value="annual">{t("yearly")}</SelectItem>
                <SelectItem value="holiday">{t("bayram")}</SelectItem>
                <SelectItem value="project">{t("loyiha")}</SelectItem>
                <SelectItem value="other">{t("boshqa")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label>{t("Izoh")}</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("bonusSababi")}
              data-testid="input-bonus-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.paymentDate || !form.amount}
            data-testid="button-save-bonus"
          >
            {mutation.isPending ? tCommon('loading') : tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// FineDialog
// ---------------------------------------------------------------------------

interface FineDialogProps {
  tCommon: TranslationFn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FineForm;
  setForm: (form: FineForm) => void;
  mutation: UseMutationResult<unknown, Error, any, unknown>;
}

export function FineDialog({ tCommon, open, onOpenChange, form, setForm, mutation }: FineDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" data-testid="button-add-fine">
          <Plus className="h-4 w-4 mr-2" />
          {t("yangiJarima")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiJarimaQoshish")}</DialogTitle>
          <DialogDescription>{t("xodimgaJarimaYozish")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("jarimaSanasi")}</Label>
              <Input
                type="date"
                value={form.fineDate}
                onChange={(e) => setForm({ ...form, fineDate: e.target.value })}
                data-testid="input-fine-date"
              />
            </div>
            <div className="space-y-1">
          <Label>{t("summaSoM2")}</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="100000"
                data-testid="input-fine-amount"
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label>{t("jarimaTuri")}</Label>
            <Select value={form.fineType} onValueChange={(value) => setForm({ ...form, fineType: value })}>
              <SelectTrigger data-testid="select-fine-type" className="h-9">
                <SelectValue placeholder={t("turniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="late">{t("kechikish")}</SelectItem>
                <SelectItem value="absence">{t("ishgaKelmaslik")}</SelectItem>
                <SelectItem value="damage">{t("zarar")}</SelectItem>
                <SelectItem value="quality">{t("Sifat")}</SelectItem>
                <SelectItem value="safety">{t("xavfsizlik")}</SelectItem>
                <SelectItem value="other">{t("boshqa")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label>{t("Izoh")}</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t("jarimaSababi")}
              data-testid="input-fine-description"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="deducted"
              checked={form.deductedFromSalary}
              onChange={(e) => setForm({ ...form, deductedFromSalary: e.target.checked })}
              className="h-4 w-4 rounded border-border/40"
              data-testid="checkbox-deducted"
            />
            <Label htmlFor="deducted">{t("maoshdanUshlabQolindi")}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.fineDate || !form.amount}
            data-testid="button-save-fine"
          >
            {mutation.isPending ? tCommon('loading') : tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
