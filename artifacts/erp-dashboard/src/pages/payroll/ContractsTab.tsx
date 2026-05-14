/**
 * @module ContractsTab
 * @description React page component. Route-level UI.
 */

import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/i18n";
import { FileText, RefreshCw } from "lucide-react";
import type { PayrollContract, PayrollUser } from "./types";
import { payTypeKeys, statusKeys, statusVariants } from "./types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface ContractsTabProps {
  contracts: PayrollContract[];
  employeeMap: Record<string, PayrollUser>;
  loading: boolean;
}

export function ContractsTab({ contracts, employeeMap, loading }: ContractsTabProps) {
  const { t } = useTranslation('hr');
  const { t: tFinance } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Card>
      <CardHeader>
        <CardTitle>{tFinance('contracts')}</CardTitle>
        <CardDescription>{tFinance('payrollAutomation')}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{tCommon('noData')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee')}</TableHead>
                  <TableHead>{tFinance('paymentType')}</TableHead>
                  <TableHead>{tFinance('rate')}</TableHead>
                  <TableHead>{tFinance('minWageGuarantee')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(contracts) ? contracts : []).map((contract) => (
                  <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      {employeeMap[contract.employeeId]?.fullName || contract.employeeId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tFinance(payTypeKeys[contract.payType])}</Badge>
                    </TableCell>
                    <TableCell>
                      {contract.payType === "fixed" && formatCurrency(contract.baseSalary || 0)}
                      {contract.payType === "hourly" && `${formatCurrency(contract.hourlyRate || 0)}/soat`}
                      {contract.payType === "piecework" && `${formatCurrency(contract.pieceworkRate || 0)}/${contract.pieceworkUnit || "dona"}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contract.minWageGuarantee ? "default" : "secondary"}>
                        {contract.minWageGuarantee ? tCommon('yes') : tCommon('no')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[contract.status] || "secondary"}>
                        {statusKeys[contract.status]?.module === "common" ? tCommon(statusKeys[contract.status]?.key) : tFinance(statusKeys[contract.status]?.key || contract.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
    </>
  );
}
