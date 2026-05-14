/**
 * @module ERPDailyReportsDialogs
 * @description Dialog components for ERPDailyReports page.
 */

import { UseFormReturn, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { DailyReportFormValues } from "./ERPDailyReportsTypes";
import { defaultDailyReportValues } from "./ERPDailyReportsTypes";

interface ReportFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: UseFormReturn<DailyReportFormValues>;
  onSubmit: (values: DailyReportFormValues) => void;
  isSaving: boolean;
  users: Array<{ id: string; fullName: string }>;
  workCenters: Array<{ id: string; name: string }>;
  orders: Array<{ id: string; orderNumber: string; productName?: string }>;
}

export function ReportFormDialog({
  isOpen,
  onOpenChange,
  isEditing,
  form,
  onSubmit,
  isSaving,
  users,
  workCenters,
  orders,
}: ReportFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={() => form.reset(defaultDailyReportValues)}
          data-testid="button-add-report"
        >
          <Plus className="h-4 w-4 mr-2" />
          Hisobot qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? "Hisobotni tahrirlash" : "Yangi kunlik hisobot"}
          </DialogTitle>
          <DialogDescription>
            Smena oxirida ishlab chiqarish natijalarini kiriting
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportDate">Sana</Label>
              <Input
                id="reportDate"
                type="date"
                {...form.register("reportDate")}
                data-testid="input-report-date"
              />
              {form.formState.errors.reportDate && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.reportDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shift">Smena</Label>
              <Controller
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="shift" data-testid="select-shift" className="h-9">
                      <SelectValue placeholder="Smena tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-smena">1-smena</SelectItem>
                      <SelectItem value="2-smena">2-smena</SelectItem>
                      <SelectItem value="3-smena">3-smena</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.shift && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.shift.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">Xodim</Label>
              <Controller
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="userId" data-testid="select-user" className="h-9">
                      <SelectValue placeholder="Xodim tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(users) ? users : []).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.userId && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.userId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="workCenterId">Ish markazi</Label>
              <Controller
                control={form.control}
                name="workCenterId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="workCenterId" data-testid="select-work-center" className="h-9">
                      <SelectValue placeholder="Ish markazi tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                        <SelectItem key={wc.id} value={wc.id}>
                          {wc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.workCenterId && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.workCenterId.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="productionOrderId">Buyurtma</Label>
            <Controller
              control={form.control}
              name="productionOrderId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="productionOrderId" data-testid="select-order" className="h-9">
                    <SelectValue placeholder="Buyurtma tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(orders) ? orders : []).map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {order.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.productionOrderId && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.productionOrderId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planQty">Reja (dona)</Label>
              <Input
                id="planQty"
                type="number"
                {...form.register("planQty", { valueAsNumber: true })}
                data-testid="input-plan-qty"
              />
              {form.formState.errors.planQty && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.planQty.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="factQty">Fakt (dona)</Label>
              <Input
                id="factQty"
                type="number"
                {...form.register("factQty", { valueAsNumber: true })}
                data-testid="input-fact-qty"
              />
              {form.formState.errors.factQty && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.factQty.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scrapQty">Brak (dona)</Label>
              <Input
                id="scrapQty"
                type="number"
                {...form.register("scrapQty", { valueAsNumber: true })}
                data-testid="input-scrap-qty"
              />
              {form.formState.errors.scrapQty && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.scrapQty.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="downtimeMinutes">To'xtash (daqiqa)</Label>
              <Input
                id="downtimeMinutes"
                type="number"
                {...form.register("downtimeMinutes", { valueAsNumber: true })}
                data-testid="input-downtime"
              />
              {form.formState.errors.downtimeMinutes && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.downtimeMinutes.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="downtimeReasonCode">To'xtash sababi</Label>
            <Input
              id="downtimeReasonCode"
              {...form.register("downtimeReasonCode")}
              placeholder="Masalan: nosozlik, material yetishmasligi"
              data-testid="input-downtime-reason"
            />
            {form.formState.errors.downtimeReasonCode && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.downtimeReasonCode.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="comment">Izoh</Label>
            <Textarea
              id="comment"
              {...form.register("comment")}
              placeholder="Qo'shimcha ma'lumotlar"
              data-testid="input-comment"
            />
            {form.formState.errors.comment && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.comment.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSaving} data-testid="button-save">
              {isSaving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteReportDialogProps {
  deleteId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteReportDialog({ deleteId, onOpenChange, onConfirm }: DeleteReportDialogProps) {
  return (
    <ConfirmDialog
      open={!!deleteId}
      onOpenChange={(v) => { if (!v) onOpenChange(false); }}
      title="Hisobotni o'chirish"
      description="Ushbu kunlik hisobotni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
      confirmText="O'chirish"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}
