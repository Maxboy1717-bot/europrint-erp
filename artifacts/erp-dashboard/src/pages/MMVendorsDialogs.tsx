/**
 * @module MMVendorsDialogs
 * @description Dialog components for the MMVendors page:
 * CreateVendorDialog, EditVendorDialog, and DeleteVendorAlert.
 * Form fields are delegated to MMVendorsFormFields.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { Vendor, VendorFormData } from "./MMVendorsTypes";
import { VendorFormFields } from "./MMVendorsFormFields";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Create dialog
// ---------------------------------------------------------------------------

export interface CreateVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<VendorFormData>;
  isPending: boolean;
  onSubmit: (data: VendorFormData) => void;
}

export function CreateVendorDialog({
  open,
  onOpenChange,
  form,
  isPending,
  onSubmit,
}: CreateVendorDialogProps) {
  const { t } = useTranslation("common");
  function handleCancel() {
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiYetkazuvchiQoshish")}</DialogTitle>
          <DialogDescription>{t("yetkazuvchiMalumotlariniKiriting")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <VendorFormFields
              form={form}
              idPrefix="input-create"
              showStatusToggle={false}
              isPending={isPending}
              onCancel={handleCancel}
              cancelTestId="button-cancel-create"
              submitTestId="button-submit-create"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit dialog
// ---------------------------------------------------------------------------

export interface EditVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<VendorFormData>;
  isPending: boolean;
  onSubmit: (data: VendorFormData) => void;
}

export function EditVendorDialog({
  open,
  onOpenChange,
  form,
  isPending,
  onSubmit,
}: EditVendorDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yetkazuvchiniTahrirlash")}</DialogTitle>
          <DialogDescription>{t("yetkazuvchiMalumotlariniOzgartiring")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <VendorFormFields
              form={form}
              idPrefix="input-edit"
              showStatusToggle={true}
              isPending={isPending}
              onCancel={() => onOpenChange(false)}
              cancelTestId="button-cancel-edit"
              submitTestId="button-submit-edit"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation alert
// ---------------------------------------------------------------------------

export interface DeleteVendorAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteVendorAlert({
  open,
  onOpenChange,
  vendor,
  isPending,
  onConfirm,
}: DeleteVendorAlertProps) {
  const { t } = useTranslation("common");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("yetkazuvchiniOchirish")}</AlertDialogTitle>
          <AlertDialogDescription>
            Haqiqatan ham "{vendor?.name}" yetkazuvchisini o'chirmoqchimisiz?
            Bu amalni qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {isPending ? "O'chirilmoqda..." : "O'chirish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
