/**
 * @module QCParameterDialog
 * @description React page component. Route-level UI.
 */

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
;
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n";

import { EPLoader } from "@/components/ep";
interface QcParameter {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  category: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  warningMinValue?: number;
  warningMaxValue?: number;
  isRequired: boolean;
  sortOrder: number;
}

const CATEGORY_TABS = [
  { value: "physical", label: "Fizik xususiyatlar" },
  { value: "mechanical", label: "Mexanik mustahkamlik" },
  { value: "printability", label: "Chop etish sifati" },
  { value: "chemical", label: "Kimyoviy ko'rsatkichlar" },
  { value: "environmental", label: "Muhit chidamliligi" },
  { value: "logistics", label: "Logistika testlari" },
  { value: "visual", label: "Vizual sifat" },
];

const parameterSchema = z.object({
  code: z.string().min(1, "Kod majburiy"),
  name: z.string().min(1, "Nom majburiy"),
  nameRu: z.string().optional(),
  category: z.string().min(1, "Kategoriya majburiy"),
  unit: z.string().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  warningMinValue: z.number().optional(),
  warningMaxValue: z.number().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().default(0)
});

interface QCParameterDialogProps {
  open: boolean;
  onClose: () => void;
  category: string;
  editingParameter: QcParameter | null;
}

export function QCParameterDialog({ open, onClose, category, editingParameter }: QCParameterDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { t: tCommon } = useTranslation('common');

  const parameterForm = useForm<z.infer<typeof parameterSchema>>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      code: "", name: "", nameRu: "", category, unit: "",
      minValue: undefined, maxValue: undefined,
      warningMinValue: undefined, warningMaxValue: undefined,
      isRequired: false, sortOrder: 0
    }
  });

  useEffect(() => {
    if (open) {
      if (editingParameter) {
        parameterForm.reset({
          code: editingParameter.code,
          name: editingParameter.name,
          nameRu: editingParameter.nameRu || "",
          category: editingParameter.category,
          unit: editingParameter.unit || "",
          minValue: editingParameter.minValue,
          maxValue: editingParameter.maxValue,
          warningMinValue: editingParameter.warningMinValue,
          warningMaxValue: editingParameter.warningMaxValue,
          isRequired: editingParameter.isRequired,
          sortOrder: editingParameter.sortOrder
        });
      } else {
        parameterForm.reset({
          code: "", name: "", nameRu: "", category,
          unit: "", minValue: undefined, maxValue: undefined,
          warningMinValue: undefined, warningMaxValue: undefined,
          isRequired: false, sortOrder: 0
        });
      }
    }
  }, [open, editingParameter, category]);

  const createParameterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof parameterSchema>) =>
      apiRequest<QcParameter>("POST", "/api/qc/parameters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      onClose();
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof parameterSchema> }) =>
      apiRequest<QcParameter>("PATCH", `/api/qc/parameters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/parameters/grouped"] });
      onClose();
      toast({ title: tCommon('success'), description: tCommon('updatedSuccessfully') });
    },
    onError: (error: Error) =>
      toast({ title: tCommon('error'), description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (data: z.infer<typeof parameterSchema>) => {
    if (editingParameter) {
      updateParameterMutation.mutate({ id: editingParameter.id, data });
    } else {
      createParameterMutation.mutate(data);
    }
  };

  const categoryLabel = CATEGORY_TABS.find(t => t.value === category)?.label || category;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingParameter ? tCommon('edit') : tCommon('add')}</DialogTitle>
          <DialogDescription>{categoryLabel}</DialogDescription>
        </DialogHeader>
        <Form {...parameterForm}>
          <form onSubmit={parameterForm.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={parameterForm.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('code')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={tCommon('code')} data-testid="input-param-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={parameterForm.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('unit')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="g/m²" data-testid="input-param-unit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={parameterForm.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon('name')} (UZ)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={tCommon('name')} data-testid="input-param-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={parameterForm.control} name="nameRu" render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon('name')} (RU)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("untitled")} data-testid="input-param-name-ru" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={parameterForm.control} name="minValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('minimum')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="100"
                      data-testid="input-param-min"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={parameterForm.control} name="maxValue" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('maximum')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="400"
                      data-testid="input-param-max"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={parameterForm.control} name="category" render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} value={category} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={parameterForm.control} name="isRequired" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-param-required" />
                </FormControl>
                <FormLabel className="!mt-0">{tCommon('required')}</FormLabel>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createParameterMutation.isPending || updateParameterMutation.isPending}
                data-testid="button-submit-parameter"
              >
                {(createParameterMutation.isPending || updateParameterMutation.isPending) && (
                  <EPLoader className="w-4 h-4 mr-2" />
                )}
                {editingParameter ? tCommon('save') : tCommon('add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
