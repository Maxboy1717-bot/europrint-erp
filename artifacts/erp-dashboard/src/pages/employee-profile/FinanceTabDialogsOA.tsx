/** @module FinanceTabDialogsOA @description Overtime and Cash Advance dialog form components for the employee finance tab. */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { TranslationFn } from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { OvertimeForm, CashAdvanceForm } from "./FinanceTabTypes";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// OvertimeDialog
// ---------------------------------------------------------------------------

interface OvertimeDialogProps {
  tCommon: TranslationFn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: OvertimeForm;
  setForm: (form: OvertimeForm) => void;
  mutation: UseMutationResult<unknown, Error, any, unknown>;
}

export function OvertimeDialog({ tCommon, open, onOpenChange, form, setForm, mutation }: OvertimeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-overtime">
          <Plus className="h-4 w-4 mr-2" />
          Yangi overtaym
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi overtaym qo'shish</DialogTitle>
          <DialogDescription>Qo'shimcha ish vaqtini ro'yxatga olish</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Ish sanasi</Label>
              <Input
                type="date"
                value={form.workDate}
                onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                data-testid="input-overtime-date"
              />
            </div>
            <div className="space-y-1">
          <Label>Soatlar</Label>
              <Input
                type="number"
                step="0.5"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="2"
                data-testid="input-overtime-hours"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Soatlik stavka (so'm)</Label>
              <Input
                type="number"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                placeholder="50000"
                data-testid="input-overtime-rate"
              />
            </div>
            <div className="space-y-1">
          <Label>Ko'paytirish koeffitsienti</Label>
              <Select value={form.multiplier} onValueChange={(value) => setForm({ ...form, multiplier: value })}>
                <SelectTrigger data-testid="select-overtime-multiplier" className="h-9">
                  <SelectValue placeholder="Koeffitsient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
          <Label>Sabab</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Overtaym sababi..."
              data-testid="input-overtime-reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.workDate || !form.hours}
            data-testid="button-save-overtime"
          >
            {mutation.isPending ? tCommon('loading') : tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// CashAdvanceDialog
// ---------------------------------------------------------------------------

interface CashAdvanceDialogProps {
  tCommon: TranslationFn;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CashAdvanceForm;
  setForm: (form: CashAdvanceForm) => void;
  mutation: UseMutationResult<unknown, Error, any, unknown>;
}

export function CashAdvanceDialog({ tCommon, open, onOpenChange, form, setForm, mutation }: CashAdvanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-cash-advance">
          <Plus className="h-4 w-4 mr-2" />
          Yangi avans
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi avans so'rovi</DialogTitle>
          <DialogDescription>Avans so'rovini ro'yxatga olish</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>So'rov sanasi</Label>
              <Input
                type="date"
                value={form.requestDate}
                onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                data-testid="input-advance-date"
              />
            </div>
            <div className="space-y-1">
          <Label>Summa (so'm)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1000000"
                data-testid="input-advance-amount"
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label>Sabab</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Avans sababi..."
              data-testid="input-advance-reason"
            />
          </div>
          <div className="space-y-1">
          <Label>Holat</Label>
            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
              <SelectTrigger data-testid="select-advance-status" className="h-9">
                <SelectValue placeholder="Holatni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="approved">Tasdiqlangan</SelectItem>
                <SelectItem value="rejected">Rad etilgan</SelectItem>
                <SelectItem value="paid">To'langan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.requestDate || !form.amount}
            data-testid="button-save-advance"
          >
            {mutation.isPending ? tCommon('loading') : tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
