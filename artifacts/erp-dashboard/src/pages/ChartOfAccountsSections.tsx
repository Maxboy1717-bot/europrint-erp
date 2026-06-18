/**
 * @module ChartOfAccountsSections
 * @description Section components for ChartOfAccounts page.
 */

import { Button } from "@/components/ui/button";
import { EPStatusPill, EPPageHeader } from "@/components/ep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { ArrowUpDown, BookOpen, Search } from "lucide-react";
import type { Account, SortField } from "./ChartOfAccountsTypes";

export function getAccountTypeBadge(type: string) {
  switch (type) {
    case "asset":
      return <EPStatusPill tone="info">{type}</EPStatusPill>;
    case "liability":
      return <EPStatusPill tone="danger">{type}</EPStatusPill>;
    case "equity":
      return <EPStatusPill tone="neutral">{type}</EPStatusPill>;
    case "revenue":
      return <EPStatusPill tone="success">{type}</EPStatusPill>;
    case "expense":
      return <EPStatusPill tone="brand">{type}</EPStatusPill>;
    default:
      return <EPStatusPill tone="neutral">{type}</EPStatusPill>;
  }
}

interface FilterSectionProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
}

export function FilterSection({ searchQuery, onSearchChange, typeFilter, onTypeFilterChange }: FilterSectionProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card data-testid="card-filters">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tCommon('search')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-type-filter">
              <SelectValue placeholder={t('accountType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon('all')}</SelectItem>
              <SelectItem value="asset">{t('asset')}</SelectItem>
              <SelectItem value="liability">{t('liability')}</SelectItem>
              <SelectItem value="equity">{t('equity')}</SelectItem>
              <SelectItem value="revenue">{t('revenue')}</SelectItem>
              <SelectItem value="expense">{t('expenses')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardsProps {
  accounts: Account[];
  totalBalance: number;
  isLoading: boolean;
}

export function StatCards({ accounts, totalBalance, isLoading }: StatCardsProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card data-testid="card-total-accounts">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{"Jami"}</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-lg" />
          ) : (
            <div className="text-2xl font-bold" data-testid="text-total-accounts">{accounts.length}</div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-active-accounts">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{"Faol"}</CardTitle>
          <BookOpen className="h-4 w-4 text-[var(--ep-green)]" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-lg" />
          ) : (
            <div className="text-2xl font-bold text-[var(--ep-green)]" data-testid="text-active-accounts">
              {(Array.isArray(accounts) ? accounts : []).filter(a => a.isActive !== false).length}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-total-balance">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('balance')}</CardTitle>
          <BookOpen className="h-4 w-4 text-[var(--ep-blue)]" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 rounded-lg" />
          ) : (
            <div className="text-2xl font-bold text-[var(--ep-blue)]" data-testid="text-total-balance">
              {formatCurrency(totalBalance)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AccountsTableProps {
  sortedAccounts: Account[];
  isLoading: boolean;
  onSort: (field: SortField) => void;
}

export function AccountsTable({ sortedAccounts, isLoading, onSort }: AccountsTableProps) {
  const { t } = useTranslation('finance');

  return (
    <Card data-testid="card-accounts-table">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {t('chartOfAccounts')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : sortedAccounts.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            {"Ma'lumot topilmadi"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort("accountNumber")}
                    data-testid="th-account-number"
                  >
                    <div className="flex items-center gap-1">
                      {t('accountCode')}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort("accountName")}
                    data-testid="th-account-name"
                  >
                    <div className="flex items-center gap-1">
                      {t('accountName')}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead data-testid="th-account-type">{t('accountType')}</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort("balance")}
                    data-testid="th-balance"
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t('balance')}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(sortedAccounts) ? sortedAccounts : []).map((account) => (
                  <TableRow key={account.id} data-testid={`row-account-${account.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium font-mono">{account.accountNumber}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>{getAccountTypeBadge(account.accountType)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.balance || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PageHeaderProps {
  onRefresh: () => void;
  onOpenCreate: () => void;
  createDialogSlot: React.ReactNode;
}

export function PageHeader({ onRefresh, onOpenCreate, createDialogSlot }: PageHeaderProps) {
  const { t } = useTranslation('finance');

  return (
    <EPPageHeader
      icon={<BookOpen className="h-5 w-5" />}
      title={t('chartOfAccounts')}
      subtitle={t('accounting')}
      actions={
        <>
          <Button variant="outline" onClick={onRefresh} data-testid="button-refresh">
            {"Yangilash"}
          </Button>
          {createDialogSlot}
          <Button variant="outline" data-testid="button-export">
            {t("excel")}
          </Button>
        </>
      }
    />
  );
}
