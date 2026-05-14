/**
 * @module LeaveTabDialogs
 * @description Dialog components for LeaveTab (leave request, sick leave, business trip).
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { BusinessTripForm, LeaveRequestForm, SickLeaveForm } from "./LeaveTabTypes";
import type { UseMutationResult } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";

export function LeaveRequestDialog({ open, onOpenChange, form, setForm, mutation, tCommon, }: { open: boolean; onOpenChange: (open: boolean) => void; form: LeaveRequestForm; setForm: (form: LeaveRequestForm) => void; mutation: UseMutationResult<unknown, Error, unknown, unknown>; tCommon: (key: string) => string; }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-leave-request">
          <Plus className="h-4 w-4 mr-2" />
          Yangi so'rov
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi ta'til so'rovi</DialogTitle>
          <DialogDescription>Ta'til so'rovi ma'lumotlarini kiriting</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label>Ta'til turi</Label>
            <Select
              value={form.leaveType}
              onValueChange={(value) => setForm({ ...form, leaveType: value })}
            >
              <SelectTrigger data-testid="select-leave-type" className="h-9">
                <SelectValue placeholder="Turni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Yillik ta'til</SelectItem>
                <SelectItem value="sick">Kasallik</SelectItem>
                <SelectItem value="unpaid">Haq to'lanmaydigan</SelectItem>
                <SelectItem value="maternity">Ona tug'ruq</SelectItem>
                <SelectItem value="paternity">Ota tug'ruq</SelectItem>
                <SelectItem value="study">O'quv ta'tili</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Boshlanish sanasi</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                data-testid="input-leave-start"
              />
            </div>
            <div className="space-y-1">
          <Label>Tugash sanasi</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                data-testid="input-leave-end"
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label>Sabab</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ta'til sababi"
              data-testid="input-leave-reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.startDate || !form.endDate}
            data-testid="button-save-leave-request"
          >
            {mutation.isPending ? tCommon("loading") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SickLeaveDialog({
  open,
  onOpenChange,
  form,
  setForm,
  mutation,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SickLeaveForm;
  setForm: (form: SickLeaveForm) => void;
  mutation: UseMutationResult<unknown, Error, unknown, unknown>;
  tCommon: (key: string) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-sick-leave">
          <Plus className="h-4 w-4 mr-2" />
          Yangi varaq
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi kasallik varaqasi</DialogTitle>
          <DialogDescription>Kasallik varaqasi ma'lumotlarini kiriting</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Boshlanish sanasi</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} data-testid="input-sick-start" />
            </div>
            <div className="space-y-1">
          <Label>Tugash sanasi</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-sick-end" />
            </div>
          </div>
          <div className="space-y-1">
          <Label>Diagnoz</Label>
            <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Kasallik diagnozi" data-testid="input-sick-diagnosis" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Kasalxona nomi</Label>
              <Input value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} placeholder="Shifoxona nomi" data-testid="input-sick-hospital" />
            </div>
            <div className="space-y-1">
          <Label>Shifokor ismi</Label>
              <Input value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} placeholder="Shifokor F.I.O" data-testid="input-sick-doctor" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Hujjat raqami</Label>
              <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="Varaq raqami" data-testid="input-sick-document" />
            </div>
            <div className="space-y-1">
          <Label>To'lov foizi (%)</Label>
              <Input type="number" value={form.paymentPercent} onChange={(e) => setForm({ ...form, paymentPercent: e.target.value })} placeholder="100" data-testid="input-sick-payment" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.startDate || !form.endDate}
            data-testid="button-save-sick-leave"
          >
            {mutation.isPending ? tCommon("loading") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BusinessTripDialog({
  open,
  onOpenChange,
  form,
  setForm,
  mutation,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BusinessTripForm;
  setForm: (form: BusinessTripForm) => void;
  mutation: UseMutationResult<unknown, Error, unknown, unknown>;
  tCommon: (key: string) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-business-trip">
          <Plus className="h-4 w-4 mr-2" />
          Yangi safar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi xizmat safari</DialogTitle>
          <DialogDescription>Xizmat safari ma'lumotlarini kiriting</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
          <Label>Manzil</Label>
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Samarqand shahri" data-testid="input-trip-destination" />
          </div>
          <div className="space-y-1">
          <Label>Maqsad</Label>
            <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Safari maqsadi" data-testid="input-trip-purpose" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>Boshlanish sanasi</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} data-testid="input-trip-start" />
            </div>
            <div className="space-y-1">
          <Label>Tugash sanasi</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-trip-end" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
          <Label>Kunlik xarajat (so'm)</Label>
              <Input type="number" value={form.dailyAllowance} onChange={(e) => setForm({ ...form, dailyAllowance: e.target.value })} placeholder="150000" data-testid="input-trip-daily" />
            </div>
            <div className="space-y-1">
          <Label>Transport (so'm)</Label>
              <Input type="number" value={form.transportCost} onChange={(e) => setForm({ ...form, transportCost: e.target.value })} placeholder="500000" data-testid="input-trip-transport" />
            </div>
            <div className="space-y-1">
          <Label>Yashash (so'm)</Label>
              <Input type="number" value={form.accommodationCost} onChange={(e) => setForm({ ...form, accommodationCost: e.target.value })} placeholder="300000" data-testid="input-trip-accommodation" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.destination || !form.startDate || !form.endDate}
            data-testid="button-save-business-trip"
          >
            {mutation.isPending ? tCommon("loading") : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
