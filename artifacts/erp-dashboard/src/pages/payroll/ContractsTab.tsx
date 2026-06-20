/**
 * @module ContractsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n";
import { FileText, Plus, RefreshCw } from "lucide-react";
import type { PayrollContract, PayrollUser } from "./types";
import { payTypeKeys, statusKeys, statusVariants } from "./types";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ---- Zod schema (mirrors BE PayrollCreateContractSchema) ----
const addContractSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  contractNumber: z.string().min(3).max(50),
  payType: z.enum(["fixed", "hourly", "piecework"]),
  baseSalary: z.coerce.number().nonnegative().optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  pieceworkRate: z.coerce.number().nonnegative().optional(),
  pieceworkUnit: z.string().max(20).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format kerak"),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

type AddContractValues = z.infer<typeof addContractSchema>;

// ---- Props ----
interface ContractsTabProps {
  contracts: PayrollContract[];
  employeeMap: Record<string, PayrollUser>;
  loading: boolean;
}

// ---- Add Contract Dialog ----
function AddContractDialog({ employeeMap }: { employeeMap: Record<string, PayrollUser> }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("hr");
  const { t: tFinance } = useTranslation("finance");
  const { t: tCommon } = useTranslation("common");
  const { toast } = useToast();

  const form = useForm<AddContractValues>({
    resolver: zodResolver(addContractSchema),
    defaultValues: {
      employeeId: undefined as unknown as number,
      contractNumber: "",
      payType: "fixed",
      baseSalary: undefined,
      hourlyRate: undefined,
      pieceworkRate: undefined,
      pieceworkUnit: "",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "",
      notes: "",
    },
  });

  const payType = form.watch("payType");

  const mutation = useMutation({
    mutationFn: (values: AddContractValues) =>
      apiRequest("POST", "/api/finance-extended/payroll-contracts", {
        ...values,
        effectiveTo: values.effectiveTo || undefined,
        notes: values.notes || undefined,
        pieceworkUnit: values.pieceworkUnit || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/payroll-contracts"] });
      toast({ title: "Shartnoma qo'shildi" });
      form.reset();
      setOpen(false);
    },
    onError: (err: Error) =>
      toast({
        title: "Xatolik",
        description: err?.message || "Shartnoma saqlanmadi",
        variant: "destructive",
      }),
  });

  const employees = Object.values(employeeMap);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" data-testid="button-add-contract">
          <Plus className="h-4 w-4" />
          {tFinance("contracts") ? "Shartnoma qo'shish" : "Shartnoma qo'shish"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Yangi shartnoma")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            {/* Employee */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employee")}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-employee">
                        <SelectValue placeholder={t("Xodimni tanlang")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contract Number */}
            <FormField
              control={form.control}
              name="contractNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Shartnoma raqami")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="SH-2026-001" data-testid="input-contract-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pay Type */}
            <FormField
              control={form.control}
              name="payType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tFinance("paymentType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-pay-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">{tFinance("fixedPay") || "Oylik (belgilangan)"}</SelectItem>
                      <SelectItem value="hourly">{tFinance("hourlyPay") || "Soatbay"}</SelectItem>
                      <SelectItem value="piecework">{tFinance("pieceworkPay") || "Ishbay"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional rate fields */}
            {payType === "fixed" && (
              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Oylik maosh (UZS)")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        placeholder="3000000"
                        data-testid="input-base-salary"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {payType === "hourly" && (
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Soatlik tarif (UZS)")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        placeholder="20000"
                        data-testid="input-hourly-rate"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {payType === "piecework" && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="pieceworkRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Birlik narxi (UZS)")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          placeholder="5000"
                          data-testid="input-piecework-rate"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pieceworkUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Birlik (dona, kg, m)")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="dona" data-testid="input-piecework-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Effective From */}
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Boshlanish sanasi")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-effective-from" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Effective To (optional) */}
            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Tugash sanasi (ixtiyoriy)")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-effective-to" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tCommon("cancel") || "Bekor"}
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-contract">
                {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main ContractsTab ----
export function ContractsTab({ contracts, employeeMap, loading }: ContractsTabProps) {
  const { t } = useTranslation("hr");
  const { t: tFinance } = useTranslation("finance");
  const { t: tCommon } = useTranslation("common");

  return (
    <>
      {/* sr-only refresh (pre-existing) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}
        className="sr-only"
        aria-label={t("refresh")}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{tFinance("contracts")}</CardTitle>
            <CardDescription>{tFinance("payrollAutomation")}</CardDescription>
          </div>
          <AddContractDialog employeeMap={employeeMap} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tCommon("noData")}</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="ep-table-scroll">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("employee")}</TableHead>
                      <TableHead>{tFinance("paymentType")}</TableHead>
                      <TableHead>{tFinance("rate")}</TableHead>
                      <TableHead>{tFinance("minWageGuarantee")}</TableHead>
                      <TableHead>{tCommon("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(contracts) ? contracts : []).map((contract) => (
                      <TableRow
                        key={contract.id}
                        data-testid={`row-contract-${contract.id}`}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {employeeMap[contract.employeeId]?.fullName || contract.employeeId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tFinance(payTypeKeys[contract.payType])}</Badge>
                        </TableCell>
                        <TableCell>
                          {contract.payType === "fixed" && formatCurrency(contract.baseSalary || 0)}
                          {contract.payType === "hourly" &&
                            `${formatCurrency(contract.hourlyRate || 0)}/soat`}
                          {contract.payType === "piecework" &&
                            `${formatCurrency(contract.pieceworkRate || 0)}/${contract.pieceworkUnit || "dona"}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={contract.minWageGuarantee ? "default" : "secondary"}>
                            {contract.minWageGuarantee ? tCommon("yes") : tCommon("no")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[contract.status] || "secondary"}>
                            {statusKeys[contract.status]?.module === "common"
                              ? tCommon(statusKeys[contract.status]?.key)
                              : tFinance(statusKeys[contract.status]?.key || contract.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
