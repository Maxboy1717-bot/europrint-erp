import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ErrorState } from "@/components/ui/error-state";

interface CashFlowTransaction {
  id: string;
  transactionDate: string;
  transactionType: string;
  category: string;
  amount: number;
  bankAccountId: string | null;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface DailySummary {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  transactionCount: number;
}

interface CashForecast {
  currentBalance: number;
  expectedInflow: number;
  expectedOutflow: number;
  projectedBalance: number;
  forecastPeriod: string;
}

interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  bankNameRu: string | null;
  currency: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

interface CashPositionData {
  accounts: BankAccount[];
  summary: {
    totalBalance: number;
    accountCount: number;
  };
  byCurrency: Array<{
    currency: string;
    total: number;
    accountCount: number;
  }>;
}

const transactionFormSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  transactionType: z.enum(["inflow", "outflow"]),
  category: z.enum(["sales", "purchase", "salary", "tax", "loan", "other"]),
  amount: z.coerce.number().positive("Summa musbat bo'lishi kerak"),
  bankAccountId: z.string().optional(),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionFormSchema>;

function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + " mlrd";
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + " mln";
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + " ming";
  }
  return amount.toString();
}

const categoryLabels: Record<string, string> = {
  sales: "Sotuvlar",
  purchase: "Xaridlar",
  salary: "Oylik maosh",
  tax: "Soliqlar",
  loan: "Qarz/Kredit",
  other: "Boshqa",
};

const typeLabels: Record<string, string> = {
  inflow: "Kirim",
  outflow: "Chiqim",
};

export default function CashFlowManagement() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [page, setPage] = useState(0);
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

  const { data: transactions = [], isLoading: transactionsLoading, isError, refetch} = useQuery<CashFlowTransaction[]>({
    queryKey: ["/api/cashflow/transactions", filterType, filterCategory, filterStartDate, filterEndDate, page],
    queryFn: async () => {
      const res = await fetch(`/api/cashflow/transactions?${buildQueryParams()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: dailySummary = [], isLoading: summaryLoading } = useQuery<DailySummary[]>({
    queryKey: ["/api/cashflow/daily-summary", thirtyDaysAgo],
    queryFn: async () => {
      const res = await fetch(`/api/cashflow/daily-summary?startDate=${thirtyDaysAgo}&endDate=${today}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily summary");
      return res.json();
    },
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

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  const chartData = (Array.isArray(dailySummary) ? dailySummary : []).slice(0, 30).reverse().map(s => ({
    date: s.date.substring(5),
    Kirim: s.inflow,
    Chiqim: s.outflow,
  }));

  if (isError) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="cashflow-management">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Naqd Pul <span className="font-bold text-primary">Oqimi</span>
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-on-primary hover:bg-primary/90" data-testid="button-add-transaction">
              <Plus className="h-4 w-4 mr-2" />
              {tCommon('create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-surface-container-lowest border-none rounded-xl max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-on-surface">{tCommon('create')}</DialogTitle>
              <DialogDescription className="text-on-surface-variant">
                {t('cashFlowManagement')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface-variant">{tCommon('date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-transaction-date" className="bg-surface border-outline-variant text-on-surface" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface-variant">{tCommon('type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-transaction-type" className="bg-surface border-outline-variant text-on-surface">
                              <SelectValue placeholder={tCommon('type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-container-lowest border-none">
                            <SelectItem value="inflow">{t('inflow')}</SelectItem>
                            <SelectItem value="outflow">{t('outflow')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface-variant">{t('category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category" className="bg-surface border-outline-variant text-on-surface">
                              <SelectValue placeholder={t('category')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-container-lowest border-none">
                            <SelectItem value="sales">{t('sales')}</SelectItem>
                            <SelectItem value="purchase">{t('purchases')}</SelectItem>
                            <SelectItem value="salary">{t('salary')}</SelectItem>
                            <SelectItem value="tax">{t('taxes')}</SelectItem>
                            <SelectItem value="loan">{t('loan')}</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface-variant">{t('amount')} (UZS)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} data-testid="input-amount" className="bg-surface border-outline-variant text-on-surface" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface-variant">{t('bankAccount')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bank-account" className="bg-surface border-outline-variant text-on-surface">
                            <SelectValue placeholder={t('bankAccount')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface-container-lowest border-none">
                          <SelectItem value="__none__">-</SelectItem>
                          {cashPosition?.accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.bankName} - {account.accountNumber} ({account.currency})
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface-variant">{tCommon('description')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Qo'shimcha ma'lumot..." {...field} data-testid="input-description" className="bg-surface border-outline-variant text-on-surface min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createTransactionMutation.isPending} data-testid="button-submit-transaction" className="bg-primary text-on-primary hover:bg-primary/90">
                    {createTransactionMutation.isPending ? tCommon('loading') : tCommon('save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-today-inflows">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('inflow')}</p>
            {summaryLoading ? (
              <Skeleton className="h-10 w-32 mt-1" />
            ) : (
              <p className="text-4xl font-bold tracking-tight text-green-600 mt-1">{formatCurrency(todaySummary.inflow)}</p>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-today-outflows">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('outflow')}</p>
            {summaryLoading ? (
              <Skeleton className="h-10 w-32 mt-1" />
            ) : (
              <p className="text-4xl font-bold tracking-tight text-error mt-1">{formatCurrency(todaySummary.outflow)}</p>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-net-flow">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('netCashFlow')}</p>
            {summaryLoading ? (
              <Skeleton className="h-10 w-32 mt-1" />
            ) : (
              <p className={`text-4xl font-bold tracking-tight mt-1 ${todaySummary.netFlow >= 0 ? "text-green-600" : "text-error"}`}>
                {todaySummary.netFlow >= 0 ? "+" : ""}{formatCurrency(todaySummary.netFlow)}
              </p>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-current-balance">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('currentBalance')}</p>
            {forecastLoading ? (
              <Skeleton className="h-10 w-32 mt-1" />
            ) : (
              <p className="text-4xl font-bold tracking-tight text-primary mt-1">{formatCurrency(forecast?.currentBalance || 0)}</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-surface-container-lowest rounded-xl p-6 lg:col-span-2" data-testid="card-daily-chart">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-on-surface">{t('cashFlowManagement')}</h2>
              <p className="text-sm text-on-surface-variant">{t('inflow')} / {t('outflow')}</p>
            </div>
            {summaryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--on-surface-variant))' }} />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--on-surface-variant))' }}
                      tickFormatter={(value) => formatShortCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--surface-container-lowest))', borderColor: 'hsl(var(--outline-variant))', color: 'hsl(var(--on-surface))' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="Kirim" fill="hsl(145, 65%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Chiqim" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-on-surface-variant">
                {tCommon('noData')}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-bank-accounts">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-on-surface">{t('bankAccount')}</h2>
              <p className="text-sm text-on-surface-variant">{t('currentBalance')}</p>
            </div>
            {cashPositionLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : cashPosition?.accounts && cashPosition.accounts.length > 0 ? (
              <div className="space-y-3">
                {(Array.isArray(cashPosition.accounts) ? cashPosition.accounts : []).map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-on-surface">{account.bankName}</p>
                      <p className="text-xs text-on-surface-variant">{account.accountNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-on-surface">{formatShortCurrency(account.balance)}</p>
                      <Badge className="bg-primary-container text-on-primary-container rounded-full px-2 py-0 text-[10px] font-semibold">{account.currency}</Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-outline-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">{tCommon('total')}:</span>
                    <span className="font-bold text-on-surface">{formatCurrency(cashPosition.summary.totalBalance)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-on-surface-variant">
                {tCommon('noData')}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-surface border-outline-variant text-on-surface w-[180px]">
                <SelectValue placeholder={tCommon('type')} />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-none">
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="inflow">{t('inflow')}</SelectItem>
                <SelectItem value="outflow">{t('outflow')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-surface border-outline-variant text-on-surface w-[180px]">
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-none">
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                {Object.entries(categoryLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            {transactionsLoading ? (
              <div className="space-y-2">
                {([...Array(5)]).map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{tCommon('noData')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container border-none hover:bg-surface-container transition-colors">
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('date')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('type')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('category')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t('amount')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('description')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(transactions) ? transactions : []).map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-surface-container-low transition-colors border-none">
                      <TableCell className="py-3 px-6 text-on-surface">{tx.transactionDate}</TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tx.transactionType === "inflow" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {typeLabels[tx.transactionType as keyof typeof typeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6 text-on-surface">{categoryLabels[tx.category as keyof typeof categoryLabels] || tx.category}</TableCell>
                      <TableCell className={`py-3 px-6 text-right font-medium ${tx.transactionType === "inflow" ? "text-green-600" : "text-error"}`}>
                        {tx.transactionType === "inflow" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="py-3 px-6 text-on-surface-variant truncate max-w-[200px]">{tx.description || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
