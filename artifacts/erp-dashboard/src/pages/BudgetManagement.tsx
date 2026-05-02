import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ErrorState } from "@/components/ui/error-state";
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
  FileText,
  Plus,
  ArrowLeft,
  TrendingUp,
  Target,
  Eye,
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

interface Budget {
  id: string;
  budgetName: string;
  fiscalYear: number;
  periodType: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface BudgetLine {
  id: string;
  accountId: string | null;
  accountCode?: string;
  accountName?: string;
  costCenterId: string | null;
  costCenterName?: string;
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number | null;
  variancePercent: number | null;
  notes: string | null;
}

interface BudgetDetail extends Budget {
  lines: BudgetLine[];
}

interface VarianceData {
  lines: BudgetLine[];
  summary: {
    totalPlanned: number;
    totalActual: number;
    totalVariance: number;
    overBudgetCount: number;
    underBudgetCount: number;
  };
  byCategory: Array<{
    category: string;
    planned: number;
    actual: number;
    variance: number;
  }>;
}

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

interface CostCenter {
  id: string;
  code: string;
  name: string;
}

const budgetFormSchema = z.object({
  budgetName: z.string().min(3, "Byudjet nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  periodType: z.enum(["annual", "quarterly", "monthly"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  totalAmount: z.coerce.number().nonnegative("Umumiy summa 0 yoki katta bo'lishi kerak"),
  status: z.enum(["draft", "approved", "active", "closed"]).default("draft"),
});

const budgetLineFormSchema = z.object({
  accountId: z.string().min(1, "Hisob tanlang"),
  costCenterId: z.string().optional(),
  plannedAmount: z.coerce.number().nonnegative("Rejalashtirilgan summa 0 yoki katta bo'lishi kerak"),
  notes: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;
type BudgetLineFormData = z.infer<typeof budgetLineFormSchema>;

const periodTypeLabels: Record<string, string> = {
  annual: "Yillik",
  quarterly: "Choraklik",
  monthly: "Oylik",
};

const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  approved: "Tasdiqlangan",
  active: "Faol",
  closed: "Yopilgan",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge className="bg-surface-container text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold">Qoralama</Badge>;
    case "approved":
      return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">Tasdiqlangan</Badge>;
    case "active":
      return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Faol</Badge>;
    case "closed":
      return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Yopilgan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function BudgetManagement() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addLineDialogOpen, setAddLineDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  const currentYear = new Date().getFullYear();

  const budgetForm = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      budgetName: "",
      fiscalYear: currentYear,
      periodType: "annual",
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      totalAmount: 0,
      status: "draft",
    },
  });

  const lineForm = useForm<BudgetLineFormData>({
    resolver: zodResolver(budgetLineFormSchema),
    defaultValues: {
      accountId: "",
      costCenterId: "",
      plannedAmount: 0,
      notes: "",
    },
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);
    if (filterYear && filterYear !== "all") params.append("fiscalYear", filterYear);
    return params.toString();
  };

  const { data: budgets = [], isLoading: budgetsLoading, isError: budgetsError, refetch: refetchBudgets } = useQuery<Budget[]>({
    queryKey: ["/api/budgets", filterStatus, filterYear],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const res = await fetch(`/api/budgets${queryString ? `?${queryString}` : ""}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });

  const { data: budgetDetail, isLoading: detailLoading } = useQuery<BudgetDetail>({
    queryKey: ["/api/budgets", selectedBudgetId],
    enabled: !!selectedBudgetId,
  });

  const { data: varianceData } = useQuery<VarianceData>({
    queryKey: ["/api/budgets", selectedBudgetId, "variance"],
    enabled: !!selectedBudgetId,
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/gl/accounts"],
  });

  const { data: costCenters = [] } = useQuery<CostCenter[]>({
    queryKey: ["/api/fi/cost-centers"],
  });

  const stats = {
    total: budgets.length,
    draft: (Array.isArray(budgets) ? budgets : []).filter(b => b.status === "draft").length,
    approved: (Array.isArray(budgets) ? budgets : []).filter(b => b.status === "approved").length,
    active: (Array.isArray(budgets) ? budgets : []).filter(b => b.status === "active").length,
    closed: (Array.isArray(budgets) ? budgets : []).filter(b => b.status === "closed").length,
  };

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      return apiRequest("POST", "/api/budgets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setCreateDialogOpen(false);
      budgetForm.reset();
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const addLineMutation = useMutation({
    mutationFn: async (data: BudgetLineFormData) => {
      return apiRequest("POST", `/api/budgets/${selectedBudgetId}/lines`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", selectedBudgetId] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", selectedBudgetId, "variance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setAddLineDialogOpen(false);
      lineForm.reset();
      toast({ title: tCommon('success'), description: tCommon('operationSuccess') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const handleCreateBudget = (data: BudgetFormData) => {
    createBudgetMutation.mutate(data);
  };

  const handleAddLine = (data: BudgetLineFormData) => {
    addLineMutation.mutate({
      ...data,
      costCenterId: data.costCenterId === "__none__" ? undefined : data.costCenterId,
    });
  };

  const getVarianceColor = (variance: number | null) => {
    if (variance === null) return "";
    if (variance > 0) return "text-error";
    if (variance < 0) return "text-green-600";
    return "";
  };

  if (budgetsError) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6">
        <ErrorState onRetry={refetchBudgets} />
      </div>
    );
  }

  if (selectedBudgetId && budgetDetail) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6" data-testid="budget-detail-view">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedBudgetId(null)}
            className="text-on-surface hover:bg-surface-container"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Byudjet <span className="font-bold text-primary">Boshqaruvi</span>
          </h1>
          <div className="ml-4">
            {getStatusBadge(budgetDetail.status)}
          </div>
        </div>
      </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-total-budget">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('budgetManagement')}</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{formatCurrency(budgetDetail.totalAmount)}</p>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-planned">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('planned')}</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">
                {formatCurrency(varianceData?.summary?.totalPlanned || 0)}
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-actual">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('actual')}</p>
              <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">
                {formatCurrency(varianceData?.summary?.totalActual || 0)}
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-5" data-testid="card-variance">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('variance')}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className={`text-4xl font-bold tracking-tight ${getVarianceColor(varianceData?.summary?.totalVariance || 0)}`}>
                  {formatCurrency(Math.abs(varianceData?.summary?.totalVariance || 0))}
                </p>
                <span className="text-xs text-on-surface-variant font-medium">
                  {(varianceData?.summary?.totalVariance || 0) > 0 ? t('overBudget') : t('withinBudget')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-budget-lines">
            <div className="flex flex-row items-center justify-between gap-2 mb-6">
              <h2 className="text-xl font-semibold text-on-surface">{t('budgetLines')}</h2>
              <Dialog open={addLineDialogOpen} onOpenChange={setAddLineDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-line" className="bg-primary text-on-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    {tCommon('create')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface-container-lowest border-none rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-on-surface">{t('budgetLines')}</DialogTitle>
                    <DialogDescription className="text-on-surface-variant">{tCommon('create')}</DialogDescription>
                  </DialogHeader>
                  <Form {...lineForm}>
                    <form onSubmit={lineForm.handleSubmit(handleAddLine)} className="space-y-4">
                      <FormField
                        control={lineForm.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-on-surface-variant">{t('chartOfAccounts')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-account" className="bg-surface border-outline-variant text-on-surface">
                                  <SelectValue placeholder={t('chartOfAccounts')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-surface-container-lowest border-none">
                                {(Array.isArray(accounts) ? accounts : []).map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.accountCode} - {acc.accountName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={lineForm.control}
                        name="costCenterId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-on-surface-variant">{t('costCenter')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-cost-center" className="bg-surface border-outline-variant text-on-surface">
                                  <SelectValue placeholder={t('costCenter')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-surface-container-lowest border-none">
                                <SelectItem value="__none__">-</SelectItem>
                                {(Array.isArray(costCenters) ? costCenters : []).map((cc) => (
                                  <SelectItem key={cc.id} value={cc.id}>
                                    {cc.code} - {cc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={lineForm.control}
                        name="plannedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-on-surface-variant">{t('planned')}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-planned-amount" className="bg-surface border-outline-variant text-on-surface" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={lineForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-on-surface-variant">{tCommon('description')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="input-notes" className="bg-surface border-outline-variant text-on-surface min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={addLineMutation.isPending} data-testid="button-submit-line" className="bg-primary text-on-primary hover:bg-primary/90">
                          {addLineMutation.isPending ? tCommon('loading') : tCommon('create')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              {detailLoading ? (
                <div className="space-y-2">
                  {([...Array(5)]).map((_, i) => (
                    <Skeleton key={`k-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : budgetDetail.lines.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{tCommon('noData')}</p>
                  <p className="text-sm">{tCommon('create')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container border-none hover:bg-surface-container transition-colors">
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('chartOfAccounts')}</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('costCenter')}</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t('planned')}</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t('actual')}</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t('variance')}</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t('variance')} %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(budgetDetail.lines) ? budgetDetail.lines : []).map((line) => {
                      const variance = (line.actualAmount || 0) - (line.plannedAmount || 0);
                      const variancePercent = line.plannedAmount > 0 
                        ? ((variance / line.plannedAmount) * 100)
                        : 0;
                      
                      return (
                        <TableRow key={line.id} data-testid={`budget-line-${line.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                          <TableCell className="py-3 px-6">
                            <div className="font-medium text-on-surface">{line.accountCode || "-"}</div>
                            <div className="text-sm text-on-surface-variant">{line.accountName || "-"}</div>
                          </TableCell>
                          <TableCell className="py-3 px-6 text-on-surface">{line.costCenterName || "-"}</TableCell>
                          <TableCell className="py-3 px-6 text-right font-medium text-on-surface">
                            {formatCurrency(line.plannedAmount)}
                          </TableCell>
                          <TableCell className="py-3 px-6 text-right text-on-surface">
                            {formatCurrency(line.actualAmount)}
                          </TableCell>
                          <TableCell className={`py-3 px-6 text-right font-medium ${getVarianceColor(variance)}`}>
                            {variance > 0 ? "+" : ""}{formatCurrency(variance)}
                          </TableCell>
                          <TableCell className={`py-3 px-6 text-right ${getVarianceColor(variancePercent)}`}>
                            {variancePercent.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {varianceData && varianceData.byCategory && varianceData.byCategory.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-6" data-testid="card-variance-chart">
              <h2 className="text-xl font-semibold text-on-surface mb-6">{t('variance')}</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceData.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                    <XAxis dataKey="category" tick={{ fill: 'hsl(var(--on-surface-variant))' }} />
                    <YAxis tickFormatter={(v) => formatCurrency(v).replace(" UZS", "")} tick={{ fill: 'hsl(var(--on-surface-variant))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--surface-container-lowest))', borderColor: 'hsl(var(--outline-variant))', color: 'hsl(var(--on-surface))' }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Kategoriya: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="planned" name={t('planned')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name={t('actual')} fill="hsl(145, 65%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Byudjet <span className="font-bold text-primary">Boshqaruvi</span>
        </h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-on-primary hover:bg-primary/90" data-testid="button-create-budget">
              <Plus className="h-4 w-4 mr-2" />
              {tCommon('create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-surface-container-lowest border-none rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-on-surface">{t('budgetManagement')}</DialogTitle>
              <DialogDescription className="text-on-surface-variant">{tCommon('create')}</DialogDescription>
            </DialogHeader>
            <Form {...budgetForm}>
              <form onSubmit={budgetForm.handleSubmit(handleCreateBudget)} className="space-y-4">
                <FormField
                  control={budgetForm.control}
                  name="budgetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface-variant">{tCommon('name')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masalan: 2024 Yillik Operatsion Byudjet" data-testid="input-budget-name" className="bg-surface border-outline-variant text-on-surface" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={budgetForm.control}
                    name="fiscalYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface-variant">{t('fiscalYear')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-fiscal-year" className="bg-surface border-outline-variant text-on-surface" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={budgetForm.control}
                    name="periodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface-variant">{t('periodType')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-period-type" className="bg-surface border-outline-variant text-on-surface">
                              <SelectValue placeholder={t('periodType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-surface-container-lowest border-none">
                            <SelectItem value="annual">Yillik</SelectItem>
                            <SelectItem value="quarterly">Choraklik</SelectItem>
                            <SelectItem value="monthly">Oylik</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={budgetForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface-variant">{t('startDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" className="bg-surface border-outline-variant text-on-surface" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={budgetForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-on-surface-variant">{t('endDate')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" className="bg-surface border-outline-variant text-on-surface" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={budgetForm.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-on-surface-variant">{t('totalAmount')}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-total-amount" className="bg-surface border-outline-variant text-on-surface" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createBudgetMutation.isPending} data-testid="button-submit-budget" className="bg-primary text-on-primary hover:bg-primary/90">
                    {createBudgetMutation.isPending ? tCommon('loading') : tCommon('create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5 mb-8">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon('total')}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{statusLabels.draft}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{stats.draft}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{statusLabels.approved}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{stats.approved}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{statusLabels.active}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{stats.active}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{statusLabels.closed}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{stats.closed}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-48">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-surface border-outline-variant text-on-surface">
                <SelectValue placeholder={tCommon('status')} />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-none">
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                <SelectItem value="draft">{statusLabels.draft}</SelectItem>
                <SelectItem value="approved">{statusLabels.approved}</SelectItem>
                <SelectItem value="active">{statusLabels.active}</SelectItem>
                <SelectItem value="closed">{statusLabels.closed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="bg-surface border-outline-variant text-on-surface" data-testid="select-filter-year">
                <SelectValue placeholder="Yil" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-none">
                <SelectItem value="all">{tCommon('all')}</SelectItem>
                {([currentYear - 1, currentYear, currentYear + 1]).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {budgetsLoading ? (
            <div className="space-y-2">
              {([...Array(5)]).map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tCommon('noData')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container border-none hover:bg-surface-container transition-colors">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('name')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('fiscalYear')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('periodType')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{t('totalAmount')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('status')}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(budgets) ? budgets : []).map((budget) => (
                  <TableRow
                    key={budget.id}
                    className="hover:bg-surface-container-low transition-colors border-none cursor-pointer"
                    onClick={() => setSelectedBudgetId(budget.id)}
                    data-testid={`budget-row-${budget.id}`}
                  >
                    <TableCell className="py-3 px-6 font-medium text-on-surface">{budget.budgetName}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{budget.fiscalYear}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{periodTypeLabels[budget.periodType]}</TableCell>
                    <TableCell className="py-3 px-6 text-right font-medium text-on-surface">
                      {formatCurrency(budget.totalAmount)}
                    </TableCell>
                    <TableCell className="py-3 px-6">{getStatusBadge(budget.status)}</TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
