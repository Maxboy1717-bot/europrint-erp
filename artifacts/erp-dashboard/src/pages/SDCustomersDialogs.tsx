/**
 * @module SDCustomersDialogs
 * @description Dialog components for the SDCustomers page.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { CustomerFormData } from "./SDCustomersTypes";

import { useTranslation } from '@/lib/i18n';
interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  isPending: boolean;
}

export function AddCustomerDialog({open, onOpenChange, form, onSubmit, isPending }: AddCustomerDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary hover:from-orange-600 hover:to-amber-600 shadow-md text-white border-0"
          data-testid="btn-add-customer"
        >
          <Plus className="h-4 w-4 mr-1.5" />{t("yangiMijoz")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("yangiMijozQoshish")}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Kompaniya / Ism *</FormLabel>
                <FormControl><Input {...field} data-testid="input-customer-title" placeholder={t("kompaniyaNomi1")} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="customerType" render={({ field }) => (
                <FormItem><FormLabel>{t("tur")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-customer-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="legal">{t("yuridik")}</SelectItem>
                      <SelectItem value="individual">{t("jismoniy")}</SelectItem>
                    </SelectContent>
                  </Select></FormItem>
              )} />
              <FormField control={form.control} name="stir" render={({ field }) => (
                <FormItem><FormLabel>STIR (INN)</FormLabel>
                  <FormControl><Input {...field} data-testid="input-stir" /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t("phone")}</FormLabel>
                  <FormControl><Input {...field} placeholder="+998 ..." /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>{t('email1')}</FormLabel>
                  <FormControl><Input {...field} type="email" /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>{t("address")}</FormLabel>
                <FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem><FormLabel>{t("manbaa")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("tanlang")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="ads">{t("reklama")}</SelectItem>
                    <SelectItem value="referral">{t("tavsiya")}</SelectItem>
                    <SelectItem value="website">{t("vebSayt")}</SelectItem>
                    <SelectItem value="exhibition">{t("korgazma")}</SelectItem>
                    <SelectItem value="other">{t("boshqa")}</SelectItem>
                  </SelectContent>
                </Select></FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
              <Button type="submit" disabled={isPending} data-testid="btn-submit-customer"
                className="bg-primary text-white border-0">
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
