import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Calculator, Plus, Check, CheckCircle2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PayrollCalculation, PayrollUser } from "./types";
import { payTypeKeys, statusKeys, statusVariants } from "./types";

interface CalculationsTabProps {
  calculations: PayrollCalculation[];
  employeeMap: Record<string, PayrollUser>;
  loading: boolean;
  onNewCalculation: () => void;
}

/** Payroll drift = how much totalDeductions deviate from expected (basePay * 0.10).
 *  Returns: drift percentage rounded to nearest integer.
 *  0 => green, |drift| <= 1 => yellow, |drift| > 1 => red */
function computeDrift(calc: PayrollCalculation): { pct: number; label: string; color: string } {
  const gross = calc.grossPay || 0;
  if (gross <= 0) return { pct: 0, label: '0%', color: 'green' };
  const expectedNet = gross - calc.totalTaxes;
  const actualNet = calc.netPay;
  const driftPct = Math.round(((actualNet - expectedNet) / gross) * 100);
  if (driftPct === 0) return { pct: 0, label: '0%', color: 'green' };
  if (Math.abs(driftPct) <= 1) return { pct: driftPct, label: `${driftPct > 0 ? '+' : ''}${driftPct}%`, color: 'yellow' };
  return { pct: driftPct, label: `${driftPct > 0 ? '+' : ''}${driftPct}%`, color: 'red' };
}

function DriftBadge({ calc }: { calc: PayrollCalculation }) {
  const { pct, label, color } = computeDrift(calc);
  const colorMap = {
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };
  const Icon = pct === 0 ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${colorMap[color]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function CalculationsTab({ calculations, employeeMap, loading, onNewCalculation }: CalculationsTabProps) {
  const { t } = useTranslation('hr');
  const { t: tCommon } = useTranslation('common');
  const { t: tFinance } = useTranslation('finance');
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/finance-extended/payroll-calculations/${id}/approve`, { approvedBy: "admin" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/payroll-calculations"] });
      toast({ title: tCommon('success'), description: tCommon('savedSuccessfully') });
    },
    onError: (error: Error) => {
      toast({ title: tCommon('error'), description: error.message || tCommon('operationFailed'), variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tFinance('calculations')}</CardTitle>
        <CardDescription>{tFinance('payrollAutomation')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : calculations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{tCommon('noData')}</p>
            <Button variant="outline" className="mt-4" onClick={onNewCalculation}>
              <Plus className="h-4 w-4 mr-2" />
              {tFinance('newCalculation')}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee')}</TableHead>
                  <TableHead>{tFinance('paymentType')}</TableHead>
                  <TableHead className="text-right">{tFinance('grossSalary')}</TableHead>
                  <TableHead className="text-right">{tFinance('totalTaxes')}</TableHead>
                  <TableHead className="text-right">{tFinance('netSalary')}</TableHead>
                  <TableHead className="text-center">Drift</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead>{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(calculations) ? calculations : []).map((calc) => (
                  <TableRow key={calc.id} data-testid={`row-calculation-${calc.id}`}>
                    <TableCell className="font-medium">
                      {employeeMap[calc.employeeId]?.fullName || calc.employeeId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{tFinance(payTypeKeys[calc.payType])}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calc.grossPay)}</TableCell>
                    <TableCell className="text-right text-red-500">-{formatCurrency(calc.totalTaxes)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(calc.netPay)}</TableCell>
                    <TableCell className="text-center">
                      <DriftBadge calc={calc} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[calc.status] || "secondary"}>
                        {statusKeys[calc.status]?.module === "common" ? tCommon(statusKeys[calc.status]?.key) : tFinance(statusKeys[calc.status]?.key || calc.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {calc.status === "calculated" && (
                        <Button size="sm" onClick={() => approveMutation.mutate(calc.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${calc.id}`}>
                          <Check className="h-4 w-4 mr-1" />
                          {tFinance('approve')}
                        </Button>
                      )}
                      {calc.status === "approved" && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {tFinance('approved')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
