/**
 * @module WarehouseRentalDialogs
 * @description Dialog components for the Warehouse Rental feature.
 * Currently exports `AddRecordDialog` — a controlled form dialog for
 * creating new warehouse rental records.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DEFAULT_FREE_DAYS,
  DEFAULT_DAILY_RATE_PER_M2,
  DEFAULT_WAREHOUSE_NAME,
  type RentalSettings,
} from "./WarehouseRentalTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddRecordDialogProps {
  open: boolean;
  onClose: () => void;
  settings: RentalSettings | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddRecordDialog({ open, onClose, settings }: AddRecordDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    productName: "",
    orderNumber: "",
    managerName: "",
    customerName: "",
    warehouseName: DEFAULT_WAREHOUSE_NAME,
    areaM2: "",
    admittedDate: new Date().toISOString().split("T")[0],
    freeDays: String(settings?.defaultFreeDays ?? DEFAULT_FREE_DAYS),
    dailyRatePerM2: String(settings?.defaultDailyRatePerM2 ?? DEFAULT_DAILY_RATE_PER_M2),
    excludeWeekends: settings?.excludeWeekends ?? false,
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/warehouse-rental/records", data),
    onSuccess: () => {
      toast({ title: "Ijara yozuvi qo'shildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/summary"] });
      onClose();
    },
    onError: (err: Error) =>
      toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.productName || !form.areaM2 || !form.admittedDate) {
      toast({ title: "Majburiy maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    mutation.mutate({
      ...form,
      areaM2: parseFloat(form.areaM2),
      freeDays: parseInt(form.freeDays),
      dailyRatePerM2: parseFloat(form.dailyRatePerM2),
    });
  };

  const f = (k: string, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi ijara yozuvi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mahsulot nomi *</Label>
            <Input
              data-testid="input-product-name"
              value={form.productName}
              onChange={(e) => f("productName", e.target.value)}
              placeholder="Ofset bosma qog'oz A4..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Buyurtma raqami</Label>
              <Input
                data-testid="input-order-number"
                value={form.orderNumber}
                onChange={(e) => f("orderNumber", e.target.value)}
                placeholder="ORD-2026-..."
              />
            </div>
            <div>
              <Label>Ombor nomi</Label>
              <Input
                data-testid="input-warehouse-name"
                value={form.warehouseName}
                onChange={(e) => f("warehouseName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Menejer</Label>
              <Input
                data-testid="input-manager-name"
                value={form.managerName}
                onChange={(e) => f("managerName", e.target.value)}
              />
            </div>
            <div>
              <Label>Mijoz</Label>
              <Input
                data-testid="input-customer-name"
                value={form.customerName}
                onChange={(e) => f("customerName", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Maydon (m²) *</Label>
              <Input
                data-testid="input-area-m2"
                type="number"
                value={form.areaM2}
                onChange={(e) => f("areaM2", e.target.value)}
                placeholder="15.5"
              />
            </div>
            <div>
              <Label>Qabul sanasi *</Label>
              <Input
                data-testid="input-admitted-date"
                type="date"
                value={form.admittedDate}
                onChange={(e) => f("admittedDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Bepul kunlar</Label>
              <Input
                data-testid="input-free-days"
                type="number"
                value={form.freeDays}
                onChange={(e) => f("freeDays", e.target.value)}
              />
            </div>
            <div>
              <Label>Kunlik tarif (m² uchun)</Label>
              <Input
                data-testid="input-daily-rate"
                type="number"
                value={form.dailyRatePerM2}
                onChange={(e) => f("dailyRatePerM2", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              data-testid="switch-exclude-weekends"
              checked={form.excludeWeekends}
              onCheckedChange={(v) => f("excludeWeekends", v)}
            />
            <Label>Dam olish kunlarini hisoblamaslik</Label>
          </div>
          <div>
            <Label>Izoh</Label>
            <Textarea
              data-testid="textarea-notes"
              value={form.notes}
              onChange={(e) => f("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Bekor
          </Button>
          <Button
            data-testid="button-save-record"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
