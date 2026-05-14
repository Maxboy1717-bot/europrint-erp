/**
 * @module PapkaOrdersDialogs
 * @description Create/Edit dialog component for PapkaOrders.
 */

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { FormData, Lang } from "./PapkaOrdersTypes";
import { TRANSLATIONS } from "./PapkaOrdersTypes";
import type { PapkaOrder } from "@shared/schema";
import { useTranslation } from '@/lib/i18n';

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingOrder: PapkaOrder | null;
  form: UseFormReturn<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
  lang: Lang;
}

export function OrderDialog({
  open, onOpenChange, editingOrder, form, onSubmit, isSubmitting, lang,
}: OrderDialogProps) {
  const { t } = useTranslation("common");
  const t = TRANSLATIONS[lang];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-none shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {editingOrder ? t.editOrder : t.createOrder}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="papkaNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">{t.papkaNo}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-testid="input-papka-no"
                      className="rounded-lg border-border bg-muted/40"
                      onChange={(e) => {
                        field.onChange(e);
                        if (form.formState.errors.papkaNo) {
                          form.clearErrors("papkaNo");
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mahsulotNomi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">{t.product}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-product-name" className="rounded-lg border-border bg-muted/40" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mijozNomi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">{t.client}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-client-name" className="rounded-lg border-border bg-muted/40" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="mahsulotTuri"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">{t.productType}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-type" className="rounded-lg border-border bg-muted/40 h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="gofra">{t("gofra")}</SelectItem>
                        <SelectItem value="gladkiy">{t("gladkiy")}</SelectItem>
                        <SelectItem value="laminated">{t("laminated")}</SelectItem>
                        <SelectItem value="other">{t("boshqa")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tiraj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">{t.tiraj}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-tiraj" className="rounded-lg border-border bg-muted/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                className="rounded-lg border-border text-foreground">
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-save"
                className="bg-primary text-white rounded-lg px-6">
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
