/**
 * @module PeriodClosing
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { EPErrorState } from "@/components/ep";
interface AccountingPeriod {
  id: string;
  fiscalYear: number;
  month: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  closedBy: string | null;
  closedAt: string | null;
}


function getMonthName(month: number): string {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];
  return months[month - 1] || "";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">{"Open1"}</Badge>;
    case "closed":
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">{t("closed")}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PeriodClosing() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [closePeriodDialogOpen, setClosePeriodDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);

  const { data: periods = [], isLoading, refetch, isError} = useQuery<AccountingPeriod[]>({
    queryKey: ["/api/accounting/periods"],
  });

  const closePeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      return apiRequest("POST", `/api/accounting/periods/${periodId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/periods"] });
      setClosePeriodDialogOpen(false);
      setSelectedPeriod(null);
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const handleClosePeriod = (period: AccountingPeriod) => {
    setSelectedPeriod(period);
    setClosePeriodDialogOpen(true);
  };

  const confirmClosePeriod = () => {
    if (selectedPeriod) {
      closePeriodMutation.mutate(selectedPeriod.id);
    }
  };

  const openPeriods = (Array.isArray(periods) ? periods : []).filter(p => p.status === "open");
  const closedPeriods = (Array.isArray(periods) ? periods : []).filter(p => p.status === "closed");

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div data-testid="period-closing-page">
      <div className="-mx-4 -mt-4 lg:-mx-6 lg:-mt-6 border-b from-primary to-amber-500 text-white">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">{t('periodClosing')}</h1>
                <p className="text-white/75 text-sm">{t('periodClosing')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-card/10 border-white/30 text-white hover:bg-card/20"
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {tCommon('refresh')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-total-periods">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('fiscalPeriod')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-periods">{periods.length}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-open-periods">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('periodOpen')}</CardTitle>
              <Unlock className="h-4 w-4 text-[var(--ep-green)]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <div className="text-2xl font-bold text-[var(--ep-green)]" data-testid="text-open-periods">
                  {openPeriods.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-closed-periods">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('periodClosed')}</CardTitle>
              <Lock className="h-4 w-4 text-[var(--ep-blue)]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg" />
              ) : (
                <div className="text-2xl font-bold text-[var(--ep-blue)]" data-testid="text-closed-periods">
                  {closedPeriods.length}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-periods-table">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('fiscalPeriod')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {([...Array(5)]).map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : periods.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-muted-foreground">
                {tCommon('noData')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="th-year">{t('fiscalYear')}</TableHead>
                      <TableHead data-testid="th-month">{t('monthly')}</TableHead>
                      <TableHead data-testid="th-status">{tCommon('status')}</TableHead>
                      <TableHead data-testid="th-closed-date">{tCommon('date')}</TableHead>
                      <TableHead className="text-right" data-testid="th-actions">{tCommon('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(periods) ? periods : []).map((period) => (
                      <TableRow key={period.id} data-testid={`row-period-${period.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{period.fiscalYear}</TableCell>
                        <TableCell>{getMonthName(period.month)}</TableCell>
                        <TableCell>{getStatusBadge(period.status)}</TableCell>
                        <TableCell>{formatDate(period.closedAt)}</TableCell>
                        <TableCell className="text-right">
                          {period.status === "open" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[var(--ep-primary)] border-orange-500/40 hover:bg-[var(--ep-primary)]/90/20"
                              onClick={() => handleClosePeriod(period)}
                              data-testid={`button-close-period-${period.id}`}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              {t('periodClosing')}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm flex items-center justify-end gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {t('periodClosed')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={closePeriodDialogOpen} onOpenChange={setClosePeriodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-primary)]" />
              {t('periodClosing')}
            </DialogTitle>
            <DialogDescription>
              {selectedPeriod && (
                <>
                  <strong>{selectedPeriod.fiscalYear} yil {getMonthName(selectedPeriod.month)}</strong> davrini yopmoqchimisiz?
                  <br /><br />
                  {t("diqqatYopilganDavrdaYangiYozuvlar")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setClosePeriodDialogOpen(false)}
              data-testid="button-cancel-close"
            >
              {tCommon('cancel')}
            </Button>
            <Button 
              variant="default"
              className="bg-orange-600 hover:bg-[var(--ep-primary)]/90"
              onClick={confirmClosePeriod}
              disabled={closePeriodMutation.isPending}
              data-testid="button-confirm-close"
            >
              {closePeriodMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {t('periodClosing')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
