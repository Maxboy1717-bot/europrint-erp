/** @module QCModuleDialogs @description Dialog components for the QC Module: new material-test creation dialog. */

import { CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { getInputColor } from "./QCModuleHelpers";
import {
  testSchema,
  PARAMETER_TABS,
  type TestFormValues,
  type CreateTestPayload,
  type QcParameter,
  type PapkaOrder,
  type MaterialCard,
} from "./QCModuleTypes";
import { EPStatusPill, EPLoader } from "@/components/ep";

// ─── NewTestDialog ────────────────────────────────────────────────────────────

interface NewTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameters: Record<string, QcParameter[]>;
  orders: PapkaOrder[];
  materials: MaterialCard[];
  testValues: Record<string, number>;
  isPending: boolean;
  initialCategory: string;
  onTestValuesChange: (values: Record<string, number>) => void;
  onSubmit: (payload: CreateTestPayload) => void;
}

export function NewTestDialog({
  open,
  onOpenChange,
  parameters,
  orders,
  materials,
  testValues,
  isPending,
  initialCategory,
  onTestValuesChange,
  onSubmit,
}: NewTestDialogProps) {
  const { t } = useTranslation("production");
  const { t: tCommon } = useTranslation('common');

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      orderId: "",
      materialCardId: "",
      batchNumber: "",
      testCategory: initialCategory,
    },
  });

  const handleSubmit = (formData: TestFormValues) => {
    const categoryParams = parameters[formData.testCategory] || [];
    const testResults = (Array.isArray(categoryParams) ? categoryParams : []).map(param => {
      const value = testValues[param.id] || 0;
      let status: "passed" | "warning" | "failed" = "passed";
      if (param.minValue !== undefined && value < param.minValue) status = "failed";
      else if (param.maxValue !== undefined && value > param.maxValue) status = "failed";
      else if (param.warningMinValue !== undefined && value < param.warningMinValue) status = "warning";
      else if (param.warningMaxValue !== undefined && value > param.warningMaxValue) status = "warning";
      return { parameterId: param.id, value, status };
    });
    onSubmit({ ...formData, testResults });
  };

  const watchedCategory = form.watch("testCategory");
  const categoryParams = parameters[watchedCategory] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("qualityControl")}</DialogTitle>
          <DialogDescription>{t("materials")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Row 1: Order + Material */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orderNumber")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-order" className="h-9">
                          <SelectValue placeholder={tCommon("select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(orders) ? orders : []).map(order => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.papkaNo} - {order.mijozNomi}
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
                name="materialCardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("materials")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-material" className="h-9">
                          <SelectValue placeholder={tCommon("select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(materials) ? materials : []).map(mat => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.code} - {mat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Batch + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("batchNumber")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="LOT-2024-001" data-testid="input-batch-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon("category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category" className="h-9">
                          <SelectValue placeholder={tCommon("select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(PARAMETER_TABS) ? PARAMETER_TABS : []).map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Parameter value inputs */}
            <div className="space-y-3">
              <h4 className="font-medium">{t("specification")}</h4>
              {(Array.isArray(categoryParams) ? categoryParams : []).map(param => (
                <div key={param.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium">{param.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {param.nameRu}
                      {param.unit && <span className="ml-2">({param.unit})</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Norma: {param.minValue ?? "-"} - {param.maxValue ?? "-"}
                      {param.isRequired && (
                        <EPStatusPill tone="neutral" className="ml-2 text-xs">
                          {tCommon("required")}
                        </EPStatusPill>
                      )}
                    </div>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      value={testValues[param.id] || ""}
                      onChange={e =>
                        onTestValuesChange({
                          ...testValues,
                          [param.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={getInputColor(param, testValues[param.id])}
                      data-testid={`input-param-${param.code}`}
                    />
                  </div>
                </div>
              ))}
              {categoryParams.length === 0 && (
                <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon("noData")}</div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending} data-testid="button-submit-test">
                {isPending ? (
                  <EPLoader className="w-4 h-4 mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
