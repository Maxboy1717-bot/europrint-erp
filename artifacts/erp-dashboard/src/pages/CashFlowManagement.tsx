/**
 * @module CashFlowManagement
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, fetchWithAuth } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CashFlowTransaction, DailySummary, CashForecast, CashPositionData } from "./CashFlowManagementTypes";
import { transactionFormSchema, type TransactionFormData } from "./CashFlowManagementTypes";
import { SummaryCards, DailyChart, BankAccountsCard, TransactionsTable } from "./CashFlowManagementSections";
import { CreateTransactionDialog } from "./CashFlowManagementDialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function CashFlowManagement() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStartDate] = useState<string>("");
  const [filterEndDate] = useState<string>("");
  const [page] = useState(0);
  const pageSize = 20;

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionDate: today,
      transactionType: "inflow",
      category: "sales",
      amount: 0,
      bankAccountId: "",
      description: "",
    },
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterType && filterType !== "all") params.append("transactionType", filterType);
    if (filterCategory && filterCategory !== "all") params.append("category", filterCategory);
    if (filterStartDate) params.append("startDate", filterStartDate);
    if (filterEndDate) params.append("endDate", filterEndDate);
    params.append("limit", pageSize.toString());
    params.append("offset", (page * pageSize).toString());
    return params.toString();
  };

  const { data: transactions = [], isLoading: transactionsLoading, isError, error, refetch } = useQuery<CashFlowTransaction[]>({
    queryKey: ["/api/cashflow/transactions", filterType, filterCategory, filterStartDate, filterEndDate, page],
    enabled: isAuthenticated,
    queryFn: async () => (await fetchWithAuth(`/api/cashflow/transactions?${buildQueryParams()}`)) as CashFlowTransaction[],
  });

  const { data: dailySummary = [], isLoading: summaryLoading } = useQuery<DailySummary[]>({
    queryKey: ["/api/cashflow/daily-summary", thirtyDaysAgo],
    enabled: isAuthenticated,
    queryFn: async () => (await fetchWithAuth(`/api/cashflow/daily-summary?startDate=${thirtyDaysAgo}&endDate=${today}`)) as DailySummary[],
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery<CashForecast>({
    queryKey: ["/api/cashflow/forecast"],
  });

  const { data: cashPosition, isLoading: cashPositionLoading } = useQuery<CashPositionData>({
    queryKey: ["/api/cfo/cash-position"],
  });

  const todaySummary = (Array.isArray(dailySummary) ? dailySummary : []).find(s => s.date === today) || { inflow: 0, outflow: 0, netFlow: 0 };

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return apiRequest("POST", "/api/cashflow/transactions", {
        ...data,
        bankAccountId: data.bankAccountId === "__none__" ? null : data.bankAccountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/daily-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/forecast"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cfo/cash-position"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  if (isError) {
    return <div className="space-y-6"><EPErrorState onRetry={refetch}  error={error} /></div>;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="cashflow-management">
      <div className="flex items-center justify-between mb-8">
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("naqdPulOqimi")}</b></>}
        title={t("naqdPulOqimi")}
      />
        <CreateTransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={form}
          onSubmit={(data) => createTransactionMutation.mutate(data)}
          isPending={createTransactionMutation.isPending}
          cashPosition={cashPosition}
          t={t}
          tCommon={tCommon}
        />
      </div>

      <div className="space-y-6">
        <SummaryCards
          todaySummary={todaySummary}
          forecast={forecast}
          summaryLoading={summaryLoading}
          forecastLoading={forecastLoading}
          t={t}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <DailyChart
            dailySummary={dailySummary}
            summaryLoading={summaryLoading}
            t={t}
            tCommon={tCommon}
          />
          <BankAccountsCard
            cashPosition={cashPosition}
            cashPositionLoading={cashPositionLoading}
            t={t}
            tCommon={tCommon}
          />
        </div>

        <TransactionsTable
          transactions={transactions}
          transactionsLoading={transactionsLoading}
          filterType={filterType}
          setFilterType={setFilterType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          t={t}
          tCommon={tCommon}
        />
      </div>
    </div>
  );
}
