import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Vendor, Warehouse, goodsReceiptFormSchema } from "./types";
import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";

type ReceiptFormValues = z.infer<typeof goodsReceiptFormSchema>;

interface ReceiveFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  warehouses: Warehouse[];
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
}

export function ReceiveFormDialog({
  isOpen,
  onOpenChange,
  vendors,
  warehouses,
  onSubmit,
  isPending,
}: ReceiveFormDialogProps) {
  const t = useGoodsReceivingTranslations();

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(goodsReceiptFormSchema),
    defaultValues: {
      receiptNumber: "",
      receiptDate: new Date().toISOString().split("T")[0],
      warehouseId: "",
      supplierId: "",
      supplierName: "",
      invoiceNumber: "",
      invoiceDate: "",
      notes: "",
    },
  });

  const handleCreate = (values: ReceiptFormValues) => {
    const vendor = (Array.isArray(vendors) ? vendors : []).find((v) => v.id === values.supplierId);
    onSubmit({
      ...values,
      receiptNumber: "",
      supplierName: vendor?.name || values.supplierName,
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) form.reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.createReceipt}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleCreate)} className="grid grid-cols-2 gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t.receiptDate}</Label>
            <Input type="date" {...form.register("receiptDate")} data-testid="input-receipt-date" />
            {form.formState.errors.receiptDate && <p className="text-sm text-destructive">{form.formState.errors.receiptDate.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label>{t.warehouse}</Label>
            <Controller control={form.control} name="warehouseId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="select-warehouse">
                  <SelectValue placeholder={t.selectWarehouse} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(warehouses) ? warehouses : []).map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {form.formState.errors.warehouseId && <p className="text-sm text-destructive">{form.formState.errors.warehouseId.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label>{t.supplier}</Label>
            <Controller control={form.control} name="supplierId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="select-supplier">
                  <SelectValue placeholder={t.selectSupplier} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(vendors) ? vendors : []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {form.formState.errors.supplierId && <p className="text-sm text-destructive">{form.formState.errors.supplierId.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label>{t.invoiceNumber}</Label>
            <Input {...form.register("invoiceNumber")} placeholder="INV-001" data-testid="input-invoice-number" />
            {form.formState.errors.invoiceNumber && <p className="text-sm text-destructive">{form.formState.errors.invoiceNumber.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label>{t.invoiceDate}</Label>
            <Input type="date" {...form.register("invoiceDate")} data-testid="input-invoice-date" />
          </div>
          <div className="grid gap-2 col-span-2">
            <Label>{t.notes}</Label>
            <Textarea {...form.register("notes")} data-testid="input-notes" />
            {form.formState.errors.notes && <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>}
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-receipt">
              {t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
