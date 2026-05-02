import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatDate, formatCurrency } from "@/lib/format";
import { exportToCSV } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  ArrowUpDown,
  Calendar
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface ArAgingData {
  buckets: ArAgingBucket[];
  totals: {
    current: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    over120: number;
    totalOutstanding: number;
  };
}

interface ArAgingBucket {
  id: string;
  customerId: string;
  customerType: string;
  current: number;
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120: number;
  totalOutstanding: number;
  lastCalculatedAt?: string;
}

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  invoiceDate: string;
  paymentStatus: string;
}

type SortField = "customerId" | "current" | "days31to60" | "days61to90" | "days91to120" | "over120" | "totalOutstanding";
type SortDirection = "asc" | "desc";


function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function getDaysOverdueBadge(days: number) {
  if (days > 90) {
    return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{days} kun</Badge>;
  } else if (days > 60) {
    return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{days} kun</Badge>;
  } else if (days > 30) {
    return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{days} kun</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{days} kun</Badge>;
}

export default function AccountsReceivable() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>("totalOutstanding");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");

  const { data: agingData, isLoading: agingLoading, isError, refetch} = useQuery<ArAgingData>({
    queryKey: ["/api/ar/aging"],
  });

  const { data: overdueInvoices = [], isLoading: overdueLoading } = useQuery<OverdueInvoice[]>({
    queryKey: ["/api/ar/overdue"],
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ar/aging/recalculate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ar/aging"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ar/overdue"] });
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
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
      case "30+":
        return days >= 30;
      case "60+":
        return days >= 60;
      case "90+":
        return days >= 90;
      default:
        return true;
    }
  });

  const totals = agingData?.totals || {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    days91to120: 0,
    over120: 0,
    totalOutstanding: 0,
  };

  const overdue31to90 = totals.days31to60 + totals.days61to90;
  const overdue90Plus = totals.days91to120 + totals.over120;

  const handleExport = () => {
    if (overdueInvoices && overdueInvoices.length > 0) {
      exportToCSV(overdueInvoices as unknown as Record<string, unknown>[], "debitorlik_qarzi", [
        { key: "customerName", label: "Mijoz" },
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

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (agingLoading) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6" data-testid="accounts-receivable-loading">
        <h1 className="text-4xl font-light tracking-tight text-on-surface mb-8">
          Keladigan <span className="font-bold text-primary">Hisoblar</span>
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4]).map((i) => <Skeleton key={`k-${i}`} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6" data-testid="accounts-receivable-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Keladigan <span className="font-bold text-primary">Hisoblar</span>
          </h1>
          <p className="text-muted-foreground mt-1">{t('accountsReceivable')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            data-testid="button-recalculate"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
            {tCommon('refresh')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-ar">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('accountsReceivable')}</p>
            <p className="text-4xl font-bold tracking-tight text-on-surface mt-1" data-testid="text-total-ar">
              {formatCurrency(totals.totalOutstanding)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{tCommon('total')}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-current">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('currentPeriod')}</p>
            <p className="text-4xl font-bold tracking-tight text-green-600 mt-1" data-testid="text-current">
              {formatCurrency(totals.current)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{t('paid')}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-overdue-31-90">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('overdue')} 31-90</p>
            <p className="text-4xl font-bold tracking-tight text-amber-600 mt-1" data-testid="text-overdue-31-90">
              {formatCurrency(overdue31to90)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{t('overdue')}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-overdue-90-plus">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('overdue')} 90+</p>
            <p className="text-4xl font-bold tracking-tight text-error mt-1" data-testid="text-overdue-90-plus">
              {formatCurrency(overdue90Plus)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{t('overdue')}</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-aging-table">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('accountsReceivable')}
            </h3>
          </div>
          {sortedBuckets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tCommon('noData')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("customerId")}
                      data-testid="th-customer"
                    >
                      <div className="flex items-center gap-1">
                        {t('customer')}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("current")}
                      data-testid="th-current"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {t('currentPeriod')}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("days31to60")}
                      data-testid="th-31-60"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-amber-600">31-60</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("days61to90")}
                      data-testid="th-61-90"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-orange-600">61-90</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("days91to120")}
                      data-testid="th-91-120"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-red-400">91-120</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("over120")}
                      data-testid="th-over-120"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-error">120+</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right cursor-pointer hover:bg-surface-container-low transition-colors"
                      onClick={() => handleSort("totalOutstanding")}
                      data-testid="th-total"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {tCommon('total')}
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(sortedBuckets) ? sortedBuckets : []).map((bucket) => (
                    <TableRow key={bucket.id} className="hover:bg-surface-container-low transition-colors" data-testid={`row-customer-${bucket.id}`}>
                      <TableCell className="font-medium py-3 px-6">{bucket.customerId}</TableCell>
                      <TableCell className="text-right py-3 px-6">{formatCurrency(bucket.current)}</TableCell>
                      <TableCell className="text-right text-amber-600 py-3 px-6">{formatCurrency(bucket.days31to60)}</TableCell>
                      <TableCell className="text-right text-orange-600 py-3 px-6">{formatCurrency(bucket.days61to90)}</TableCell>
                      <TableCell className="text-right text-red-400 py-3 px-6">{formatCurrency(bucket.days91to120)}</TableCell>
                      <TableCell className="text-right text-error font-medium py-3 px-6">{formatCurrency(bucket.over120)}</TableCell>
                      <TableCell className="text-right font-bold py-3 px-6">{formatCurrency(bucket.totalOutstanding)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-surface-container-low font-bold">
                    <TableCell className="py-3 px-6">{tCommon('total')}</TableCell>
                    <TableCell className="text-right py-3 px-6">{formatCurrency(totals.current)}</TableCell>
                    <TableCell className="text-right text-amber-600 py-3 px-6">{formatCurrency(totals.days31to60)}</TableCell>
                    <TableCell className="text-right text-orange-600 py-3 px-6">{formatCurrency(totals.days61to90)}</TableCell>
                    <TableCell className="text-right text-red-400 py-3 px-6">{formatCurrency(totals.days91to120)}</TableCell>
                    <TableCell className="text-right text-error py-3 px-6">{formatCurrency(totals.over120)}</TableCell>
                    <TableCell className="text-right py-3 px-6">{formatCurrency(totals.totalOutstanding)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-overdue-invoices">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('overdue')}
            </h3>
            <Select value={overdueFilter} onValueChange={setOverdueFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-overdue-filter">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="30+">30+</SelectItem>
                <SelectItem value="60+">60+</SelectItem>
                <SelectItem value="90+">90+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredOverdue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tCommon('noData')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6" data-testid="th-invoice-number">{t('invoiceNumber')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6" data-testid="th-invoice-customer">{t('customer')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right" data-testid="th-invoice-amount">{t('amount')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6" data-testid="th-invoice-due-date">{t('dueDate')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right" data-testid="th-invoice-days-overdue">{t('overdue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(filteredOverdue) ? filteredOverdue : []).map((invoice) => {
                    const daysOverdue = calculateDaysOverdue(invoice.dueDate);
                    const outstandingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
                    return (
                      <TableRow key={invoice.id} className="hover:bg-surface-container-low transition-colors" data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-medium py-3 px-6">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="py-3 px-6">{invoice.customerName}</TableCell>
                        <TableCell className="text-right py-3 px-6">{formatCurrency(outstandingAmount)}</TableCell>
                        <TableCell className="py-3 px-6">{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right py-3 px-6">
                          {getDaysOverdueBadge(daysOverdue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
