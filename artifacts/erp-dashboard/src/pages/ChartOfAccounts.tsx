/**
 * @module ChartOfAccounts
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { type Account, type NewAccountForm, type SortField, type SortDirection, filterAccounts, sortAccounts } from "./ChartOfAccountsTypes";
import { FilterSection, StatCards, AccountsTable, PageHeader } from "./ChartOfAccountsSections";
import { CreateAccountDialog } from "./ChartOfAccountsDialogs";
import { EPPageHeader, EPErrorState, EPLoader } from "@/components/ep";

const DEFAULT_FORM: NewAccountForm = {
  accountNumber: "",
  accountName: "",
  accountType: "asset",
};

export default function ChartOfAccounts() {
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("accountNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<NewAccountForm>(DEFAULT_FORM);

  const { data: accounts = [], isLoading, error, refetch, isError } = useQuery<Account[]>({
    queryKey: ["/api/gl/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: NewAccountForm) => {
      return apiRequest("POST", "/api/gl/accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gl/accounts"] });
      setIsCreateDialogOpen(false);
      setNewAccount(DEFAULT_FORM);
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
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
      setSortDirection("asc");
    }
  };

  const handleCreateAccount = () => {
    if (!newAccount.accountNumber || !newAccount.accountName) {
      toast({ title: tCommon('error'), description: tCommon('required'), variant: "destructive" });
      return;
    }
    createAccountMutation.mutate(newAccount);
  };

  const filteredAccounts = filterAccounts(
    Array.isArray(accounts) ? accounts : [],
    searchQuery,
    typeFilter,
  );
  const sortedAccounts = sortAccounts(filteredAccounts, sortField, sortDirection);
  const totalBalance = (Array.isArray(sortedAccounts) ? sortedAccounts : []).reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{tCommon('operationFailed')}</p>
      </div>
    );
  }

  const createDialog = (
    <CreateAccountDialog
      open={isCreateDialogOpen}
      onOpenChange={setIsCreateDialogOpen}
      newAccount={newAccount}
      onNewAccountChange={setNewAccount}
      onConfirm={handleCreateAccount}
      isPending={createAccountMutation.isPending}
    />
  );

  return (
    <div data-testid="chart-of-accounts-page">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Sahifa</b></>}
        title="Sahifa"
        onRefresh={refetch}
        onOpenCreate={() => setIsCreateDialogOpen(true)}
        createDialogSlot={createDialog}
      />

      <div className="space-y-6 pt-6">
        <FilterSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        <StatCards
          accounts={Array.isArray(accounts) ? accounts : []}
          totalBalance={totalBalance}
          isLoading={isLoading}
        />

        <AccountsTable
          sortedAccounts={sortedAccounts}
          isLoading={isLoading}
          onSort={handleSort}
        />
      </div>
    </div>
  );
}
