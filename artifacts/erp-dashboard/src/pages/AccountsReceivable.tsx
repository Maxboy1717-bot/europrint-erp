/**
 * @module AccountsReceivable
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { exportToCSV } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download } from "lucide-react";
import type { ArAgingData, OverdueInvoice, SortField, SortDirection, ArFormState } from "./AccountsReceivableTypes";
import { EMPTY_AR_FORM, calculateDaysOverdue } from "./AccountsReceivableTypes";
import { AddArEntryDialog } from "./AccountsReceivableDialogs";
import { ArKpiCards, ArAgingTable, ArOverdueTable } from "./AccountsReceivableSections";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function AccountsReceivable() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("totalOutstanding");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [arForm, setArForm] = useState<ArFormState>(EMPTY_AR_FORM);

  const { data: agingData, isLoading: agingLoading, isError, error, refetch } = useQuery<ArAgingData>({
    queryKey: ["/api/ar/aging"],
  });

  const { data: overdueInvoices = [] } = useQuery<OverdueInvoice[]>({
    queryKey: ["/api/ar/overdue"],
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/ar/aging/recalculate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ar/aging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ar/overdue"] });
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/ar/entries", {
        customerId: arForm.customerId,
        amount: Number(arForm.amount),
        dueDate: arForm.dueDate,
        description: arForm.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ar/aging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ar/overdue"] });
      toast({ title: tCommon('success'), description: t('entryAddedSuccessfully') });
      setArForm(EMPTY_AR_FORM);
      setAddOpen(false);
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedBuckets = [...(agingData?.buckets || [])].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
  });

  const filteredOverdue = (Array.isArray(overdueInvoices) ? overdueInvoices : []).filter((invoice) => {
    const days = calculateDaysOverdue(invoice.dueDate);
    switch (overdueFilter) {
      case "30+": return days >= 30;
      case "60+": return days >= 60;
      case "90+": return days >= 90;
      default: return true;
    }
  });

  const totals = agingData?.totals || {
    current: 0, days31to60: 0, days61to90: 0, days91to120: 0, over120: 0, totalOutstanding: 0,
  };

  const handleExport = () => {
    if (overdueInvoices && overdueInvoices.length > 0) {
      exportToCSV(overdueInvoices as unknown as Record<string, unknown>[], "debitorlik_qarzi", [
        { key: "customerName", label: t('customer') },
        { key: "invoiceNumber", label: t('invoice') },
        { key: "totalAmount", label: t('amount') },
        { key: "paidAmount", label: t('paid') },
        { key: "remainingAmount", label: t('remaining') },
        { key: "dueDate", label: t('dueDate') },
        { key: "daysOverdue", label: t('daysOverdueLabel') },
      ]);
    } else {
      toast({ title: t('noData'), description: t('noDataForExport') });
    }
  };

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  if (agingLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="accounts-receivable-loading">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("keladiganHisoblar")}</b></>}
        title={t("keladiganHisoblar")}
      />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4]).map((i) => <Skeleton key={`k-${i}`} className="h-32 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="accounts-receivable-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("keladiganHisoblar")}</b></>}
        title={t("keladiganHisoblar")}
      />
          <p className="text-muted-foreground mt-1">{t('accountsReceivable')}</p>
        </div>
        <div className="flex items-center gap-2">
          <AddArEntryDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            form={arForm}
            onFormChange={setArForm}
            onSubmit={() => addEntryMutation.mutate()}
            isPending={addEntryMutation.isPending}
          />
          <Button variant="outline" onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending} data-testid="button-recalculate">
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
            {tCommon('refresh')}
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            {t("excel")}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ArKpiCards totals={totals} />
        <ArAgingTable sortedBuckets={sortedBuckets} totals={totals} onSort={handleSort} />
        <ArOverdueTable filteredOverdue={filteredOverdue} overdueFilter={overdueFilter} onFilterChange={setOverdueFilter} />
      </div>
    </div>
  );
}
