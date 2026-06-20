/**
 * @module CreateShiftModal
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "./helpers";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
interface CreateShiftModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateShiftModal({ open, onClose, onCreated }: CreateShiftModalProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [form, setForm] = useState({
    department: "",
    shift_number: "1",
    shift_date: new Date().toISOString().split("T")[0],
    shift_start: new Date().toISOString().slice(0, 16),
    machine_name: "",
    planned_qty: "",
    production_order_id: "",
  });

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/production/shift-reports", body),
    onSuccess: () => {
      toast({ title: "Smena ochildi", description: "Yangi smena xisoboti yaratildi" });
      onCreated();
      onClose();
    },
    onError: (e: Error) => toast({ title: "Xato", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    mut.mutate({
      ...form,
      shift_number: Number(form.shift_number),
      planned_qty: form.planned_qty ? Number(form.planned_qty) : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiSmenaOchish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("bolim2")}</Label>
              <Select value={form.department} onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}>
                <SelectTrigger data-testid="select-shift-dept" className="h-9">
                  <SelectValue placeholder={t("bolimniTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(DEPARTMENTS) ? DEPARTMENTS : []).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("smena1")}</Label>
              <Select value={form.shift_number} onValueChange={(v) => setForm((f) => ({ ...f, shift_number: v }))}>
                <SelectTrigger data-testid="select-shift-number" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{tLabel('common.CreateShiftModal.1Smena', "1-smena")}</SelectItem>
                  <SelectItem value="2">{tLabel('common.CreateShiftModal.2Smena', "2-smena")}</SelectItem>
                  <SelectItem value="3">{tLabel('common.CreateShiftModal.3Smena', "3-smena")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("sana")}</Label>
              <Input type="date" value={form.shift_date} onChange={(e) => setForm((f) => ({ ...f, shift_date: e.target.value }))} data-testid="input-shift-date" />
            </div>
            <div>
              <Label>{t("boshlanishVaqti")}</Label>
              <Input type="datetime-local" value={form.shift_start} onChange={(e) => setForm((f) => ({ ...f, shift_start: e.target.value }))} data-testid="input-shift-start" />
            </div>
          </div>
          <div>
            <Label>{t("mashina")}</Label>
            <Input placeholder={t("mashinaNomi")} value={form.machine_name} onChange={(e) => setForm((f) => ({ ...f, machine_name: e.target.value }))} data-testid="input-machine-name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Reja (dona)</Label>
              <Input type="number" placeholder="0" value={form.planned_qty} onChange={(e) => setForm((f) => ({ ...f, planned_qty: e.target.value }))} data-testid="input-planned-qty" />
            </div>
            <div>
              <Label>{t("buyurtma1")} <span className="text-destructive">*</span></Label>
              <Input placeholder={t("masalan") + ": 48"} value={form.production_order_id} onChange={(e) => setForm((f) => ({ ...f, production_order_id: e.target.value }))} data-testid="input-order-id" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button
            disabled={!form.department || !form.shift_date || !form.shift_start || !form.production_order_id || mut.isPending}
            onClick={handleSubmit}
            data-testid="button-create-shift-confirm"
          >
            {mut.isPending ? "Saqlanmoqda..." : "Ochish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
