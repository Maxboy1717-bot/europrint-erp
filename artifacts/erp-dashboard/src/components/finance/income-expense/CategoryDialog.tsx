/**
 * @module CategoryDialog
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { UseFormReturn } from "react-hook-form";
import { FinanceCategory, CategoryFormData } from "./types";

import { tLabel } from '@/lib/i18n/tLabel';
interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => void;
  isPending: boolean;
  editingCategory: FinanceCategory | null;
  categories: FinanceCategory[];
}

export function CategoryDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  editingCategory,
  categories,
}: CategoryDialogProps) {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold"> {editingCategory ? tCommon("edit") : tCommon("create")}</DialogTitle>
          <DialogHeader>
            <DialogDescription>{t("category")}</DialogDescription>
          </DialogHeader>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category-type" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">{t("inflow")}</SelectItem>
                      <SelectItem value="expense">{t("outflow")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("accountCode")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="INC-01"
                        {...field}
                        data-testid="input-category-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tartib")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        data-testid="input-category-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("name")} (UZ)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("kategoriyaNomi")}
                      {...field}
                      data-testid="input-category-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameRu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("name")} (RU)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tLabel('common.CategoryDialog.untitled', "Название категории")}
                      {...field}
                      data-testid="input-category-name-ru"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("otaKategoriya")}</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-parent-category" className="h-9">
                        <SelectValue placeholder="Tanlang (ixtiyoriy)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("asosiyKategoriya")}</SelectItem>
                      {(Array.isArray(categories) ? categories : []).filter(
                          (c) =>
                            c.categoryType === form.watch("categoryType") &&
                            c.id !== editingCategory?.id
                        )
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("rang")}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-12 h-9 p-1 cursor-pointer"
                        value={field.value || "#6366f1"}
                        onChange={field.onChange}
                        data-testid="input-category-color"
                      />
                      <Input placeholder="#6366f1" {...field} className="flex-1" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-category"
              >
                {isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
