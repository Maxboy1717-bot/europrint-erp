/**
 * @module AccountsPayable
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
import type { ApAgingData, OverduePayable, SortField, SortDirection, ApFormState } from "./AccountsPayableTypes";
import { EMPTY_AP_FORM, calculateDaysOverdue } from "./AccountsPayableTypes";
import { AddApEntryDialog } from "./AccountsPayableDialogs";
import { ApKpiCards, ApAgingTable, ApOverdueTable } from "./AccountsPayableSections";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function AccountsPayable() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("totalOutstanding");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [apForm, setApForm] = useState<ApFormState>(EMPTY_AP_FORM);

  const { data: agingData, isLoading: agingLoading, isError, refetch } = useQuery<ApAgingData>({
    queryKey: ["/api/ap/aging"],
  });

  const { data: overduePayables = [] } = useQuery<OverduePayable[]>({
    queryKey: ["/api/ap/overdue"],
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/ap/aging/recalculate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ap/aging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ap/overdue"] });
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/finance/ap/entries", {
        vendorId: apForm.vendorId,
        amount: Number(apForm.amount),
        dueDate: apForm.dueDate,
        description: apForm.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ap/aging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ap/overdue"] });
      toast({ title: tCommon('success'), description: "Yozuv muvaffaqiyatli qo'shildi" });
      setApForm(EMPTY_AP_FORM);
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

  const filteredOverdue = (Array.isArray(overduePayables) ? overduePayables : []).filter((payable) => {
    const days = calculateDaysOverdue(payable.dueDate);
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
    if (overduePayables && overduePayables.length > 0) {
      exportToCSV(overduePayables as Record<string, unknown>[], "kreditorlik_qarzi", [
        { key: "vendorName", label: "Yetkazuvchi" },
        { key: "invoiceNumber", label: "Hisob-faktura" },
        { key: "totalAmount", label: "Summa" },
        { key: "paidAmount", label: "To'langan" },
        { key: "remainingAmount", label: "Qoldiq" },
        { key: "dueDate", label: "Muddat" },
        { key: "daysOverdue", label: "Kechikish (kun)" },
      ]);
    } else {
      toast({ title: "Ma'lumot yo'q", description: "Eksport uchun ma'lumot topilmadi" });
    }
  };

  if (isError) return <EPErrorState onRetry={refetch} />;

  if (agingLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="accounts-payable-loading">
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">To'lanadigan Hisoblar</b></>}
        title="To'lanadigan Hisoblar"
      />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4]).map((i) => <Skeleton key={`k-${i}`} className="h-32 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="accounts-payable-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">To'lanadigan Hisoblar</b></>}
        title="To'lanadigan Hisoblar"
      />
          <p className="text-muted-foreground mt-1">{t('accountsPayable')}</p>
        </div>
        <div className="flex items-center gap-2">
          <AddApEntryDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            form={apForm}
            onFormChange={setApForm}
            onSubmit={() => addEntryMutation.mutate()}
            isPending={addEntryMutation.isPending}
          />
          <Button variant="outline" onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending} data-testid="button-recalculate">
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
            {tCommon('refresh')}
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ApKpiCards totals={totals} />
        <ApAgingTable sortedBuckets={sortedBuckets} totals={totals} onSort={handleSort} />
        <ApOverdueTable filteredOverdue={filteredOverdue} overdueFilter={overdueFilter} onFilterChange={setOverdueFilter} />
      </div>
    </div>
  );
}
