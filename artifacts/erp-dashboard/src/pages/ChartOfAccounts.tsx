import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen,
  Plus,
  Download,
  ArrowUpDown,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  parentAccountId: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
}


function getAccountTypeBadge(type: string) {
  switch (type) {
    case "asset":
      return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">{type}</Badge>;
    case "liability":
      return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40">{type}</Badge>;
    case "equity":
      return <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/40">{type}</Badge>;
    case "revenue":
      return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">{type}</Badge>;
    case "expense":
      return <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/40">{type}</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function ChartOfAccounts() {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("accountNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountNumber: "",
    accountName: "",
    accountType: "asset",
  });

  const { data: accounts = [], isLoading, error, refetch, isError} = useQuery<Account[]>({
    queryKey: ["/api/gl/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof newAccount) => {
      return apiRequest("POST", "/api/gl/accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gl/accounts"] });
      setIsCreateDialogOpen(false);
      setNewAccount({ accountNumber: "", accountName: "", accountType: "asset" });
      toast({ title: tCommon('success'), description: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ title: tCommon('error'), description: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter((account) => {
    const accountNumber = account.accountNumber || "";
    const accountName = account.accountName || "";
    const matchesSearch = 
      accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      accountName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || account.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (sortField) {
      case "accountNumber":
        aValue = a.accountNumber || "";
        bValue = b.accountNumber || "";
        break;
      case "accountName":
        aValue = a.accountName || "";
        bValue = b.accountName || "";
        break;
      case "balance":
        aValue = a.balance || 0;
        bValue = b.balance || 0;
        break;
      default:
        aValue = a.accountNumber || "";
        bValue = b.accountNumber || "";
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
  });

  const totalBalance = (sortedAccounts ?? []).reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const handleCreateAccount = () => {
    if (!newAccount.accountNumber || !newAccount.accountName) {
      toast({ title: tCommon('error'), description: tCommon('required'), variant: "destructive" });
      return;
    }
    createAccountMutation.mutate(newAccount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{tCommon('operationFailed')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="chart-of-accounts-page">
      <div className="border-b bg-gradient-to-r from-purple-600 to-purple-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">{t('chartOfAccounts')}</h1>
                <p className="text-purple-100 text-sm">{t('accounting')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20"
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {tCommon('refresh')}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20"
                    data-testid="button-add-account"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {tCommon('create')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{tCommon('create')}</DialogTitle>
                    <DialogDescription>
                      {t('chartOfAccounts')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">{t('accountCode')}</Label>
                      <Input
                        id="accountNumber"
                        value={newAccount.accountNumber}
                        onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                        placeholder="Masalan: 1010"
                        data-testid="input-account-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">{t('accountName')}</Label>
                      <Input
                        id="accountName"
                        value={newAccount.accountName}
                        onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                        placeholder="Masalan: Kassa"
                        data-testid="input-account-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountType">{t('accountType')}</Label>
                      <Select 
                        value={newAccount.accountType} 
                        onValueChange={(value) => setNewAccount({ ...newAccount, accountType: value })}
                      >
                        <SelectTrigger data-testid="select-account-type">
                          <SelectValue placeholder={t('accountType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">{t('asset')}</SelectItem>
                          <SelectItem value="liability">{t('liability')}</SelectItem>
                          <SelectItem value="equity">{t('equity')}</SelectItem>
                          <SelectItem value="revenue">{t('revenue')}</SelectItem>
                          <SelectItem value="expense">{t('expenses')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      {tCommon('cancel')}
                    </Button>
                    <Button 
                      onClick={handleCreateAccount}
                      disabled={createAccountMutation.isPending}
                      data-testid="button-create-account"
                    >
                      {createAccountMutation.isPending ? tCommon('loading') : tCommon('create')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                className="bg-surface-container-lowest/10 border-white/30 text-white hover:bg-surface-container-lowest/20"
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card data-testid="card-filters">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={tCommon('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-total-accounts">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tCommon('total')}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-accounts">{accounts.length}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-active-accounts">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tCommon('active')}</CardTitle>
              <BookOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-500" data-testid="text-active-accounts">
                  {(Array.isArray(accounts) ? accounts : []).filter(a => a.isActive !== false).length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-total-balance">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('balance')}</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold text-blue-500" data-testid="text-total-balance">
                  {formatCurrency(totalBalance)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                  <Skeleton key={`k-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {tCommon('noData')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("accountNumber")}
                        data-testid="th-account-number"
                      >
                        <div className="flex items-center gap-1">
                          {t('accountCode')}
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("accountName")}
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
                        onClick={() => handleSort("balance")}
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
                      <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
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
      </div>
    </div>
  );
}
