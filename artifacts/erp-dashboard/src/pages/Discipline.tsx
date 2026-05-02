import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { formatDate } from "@/lib/format";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { useTranslation } from "@/lib/i18n";
import { 
  AlertTriangle, 
  Award, 
  FileText, 
  DollarSign, 
  Plus, 
  Search,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  History
} from "lucide-react";
import type { User as UserType, DisciplineRecord } from "@shared/schema";

const disciplineFormSchema = z.object({
  userId: z.string().min(1, "Xodimni tanlang"),
  type: z.string().min(1, "Turini tanlang"),
  amount: z.number().optional(),
  reason: z.string().min(1, "Sababni kiriting").max(1000, "Sabab 1000 belgidan oshmasligi kerak"),
});

type DisciplineWithUser = DisciplineRecord & {
  userName?: string;
  givenByName?: string;
};

export default function Discipline() {
  const { t, language, setLanguage } = useTranslation('hr');
  const { t: tCommon } = useTranslation('common');
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"warning" | "penalty" | "reward" | "act">("warning");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [warningType, setWarningType] = useState("oral");
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<string | null>(null);
  const { toast } = useToast();

  const oralLabel = t('oralWarning');
  const writtenLabel = t('writtenWarning');
  const finalLabel = t('finalWarning');
  const sumLabel = t('currencyLabel');

  const { data: employees = [], isLoading: employeesLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: records = [], isLoading: recordsLoading, isError: recordsError, refetch: refetchRecords } = useQuery<DisciplineWithUser[]>({
    queryKey: ["/api/hr/discipline-records"],
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: { userId: string; type: string; amount?: number; reason: string }) => {
      return apiRequest("POST", "/api/hr/discipline-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/discipline-records"] });
      toast({ title: tCommon('savedSuccessfully') });
      resetForm();
    },
    onError: () => {
      toast({ title: tCommon('operationFailed'), variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setSelectedEmployee("");
    setAmount("");
    setReason("");
    setWarningType("oral");
  };

  const openDialog = (type: "warning" | "penalty" | "reward" | "act") => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    let recordType = dialogType === "act" ? "warning" : dialogType;
    const fullReason = dialogType === "warning" 
      ? `[${warningType === "oral" ? oralLabel : warningType === "written" ? writtenLabel : finalLabel}] ${reason}`
      : reason;

    const validation = disciplineFormSchema.safeParse({
      userId: selectedEmployee,
      type: recordType,
      amount: amount ? parseInt(amount) : undefined,
      reason: fullReason,
    });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({ title: firstError.message, variant: "destructive" });
      return;
    }

    createRecordMutation.mutate({
      userId: selectedEmployee,
      type: recordType,
      amount: amount ? parseInt(amount) : undefined,
      reason: fullReason,
    });
  };

  const filteredRecords = (Array.isArray(records) ? records : []).filter((record) => {
    if (activeTab !== "all" && record.type !== activeTab) return false;
    if (searchQuery) {
      const employee = (Array.isArray(employees) ? employees : []).find((e) => e.id === record.userId);
      if (!employee?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const employeeHistoryRecords = selectedEmployeeHistory
    ? (Array.isArray(records) ? records : []).filter((r) => r.userId === selectedEmployeeHistory)
    : [];

  const warningsCount = (Array.isArray(records) ? records : []).filter((r) => r.type === "warning").length;
  const penaltiesSum = (Array.isArray(records) ? records : []).filter((r) => r.type === "penalty").reduce((sum, r) => sum + (r.amount || 0), 0);
  const rewardsSum = (Array.isArray(records) ? records : []).filter((r) => r.type === "reward").reduce((sum, r) => sum + (r.amount || 0), 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{tCommon('warning')}</Badge>;
      case "penalty":
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('fine')}</Badge>;
      case "reward":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('reward')}</Badge>;
      default:
        return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "penalty":
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case "reward":
        return <Award className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };


  if (recordsError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ErrorState onRetry={refetchRecords} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Intizom <span className="font-bold text-primary">Nazorati</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant={language === "uz" ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage("uz")}
            data-testid="button-lang-uz"
            className={language === "uz" ? "bg-gradient-to-br from-primary to-primary-dim text-white" : ""}
          >
            UZ
          </Button>
          <Button
            variant={language === "ru" ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage("ru")}
            data-testid="button-lang-ru"
            className={language === "ru" ? "bg-gradient-to-br from-primary to-primary-dim text-white" : ""}
          >
            RU
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{tCommon('warning')}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-warnings-count">{warningsCount}</p>
            <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('fine')}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-penalties-sum">
              {penaltiesSum.toLocaleString()}
            </p>
            <TrendingDown className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('reward')}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-4xl font-bold tracking-tight text-on-surface" data-testid="text-rewards-sum">
              {rewardsSum.toLocaleString()}
            </p>
            <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={() => openDialog("warning")} className="bg-yellow-500 hover:bg-yellow-600 text-white" data-testid="button-add-warning">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {tCommon('warning')}
        </Button>
        <Button onClick={() => openDialog("penalty")} className="bg-red-500 hover:bg-red-600 text-white" data-testid="button-add-penalty">
          <DollarSign className="h-4 w-4 mr-2" />
          {t('fine')}
        </Button>
        <Button onClick={() => openDialog("reward")} className="bg-green-500 hover:bg-green-600 text-white" data-testid="button-add-reward">
          <Award className="h-4 w-4 mr-2" />
          {t('reward')}
        </Button>
        <Button onClick={() => openDialog("act")} variant="outline" data-testid="button-add-act">
          <FileText className="h-4 w-4 mr-2" />
          {t('documents')}
        </Button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-on-surface">{tCommon('reports')}</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`${t('employees')} ${tCommon('search').toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {recordsLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface-container-low mb-4">
            <TabsTrigger value="all" data-testid="tab-all">{tCommon('all')}</TabsTrigger>
            <TabsTrigger value="warning" data-testid="tab-warnings">{tCommon('warning')}</TabsTrigger>
            <TabsTrigger value="penalty" data-testid="tab-penalties">{t('fine')}</TabsTrigger>
            <TabsTrigger value="reward" data-testid="tab-rewards">{t('reward')}</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-0">
            <div className="rounded-lg border border-outline-variant overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('date')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t('employees')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('type')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('amount')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{tCommon('description')}</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right rounded-tr-lg"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-on-surface-variant py-8">
                        {tCommon('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (Array.isArray(filteredRecords) ? filteredRecords : []).map((record) => {
                      const employee = (Array.isArray(employees) ? employees : []).find((e) => e.id === record.userId);
                      // Custom severe/medium warning colors logic
                      let rowClass = "hover:bg-surface-container-low transition-colors";
                      if (record.type === "warning") {
                        if (record.reason.includes(finalLabel)) {
                          rowClass = "bg-red-50 border-l-4 border-error hover:bg-red-100 transition-colors";
                        } else if (record.reason.includes(writtenLabel)) {
                          rowClass = "bg-amber-50 border-l-4 border-amber-500 hover:bg-amber-100 transition-colors";
                        }
                      }

                      return (
                        <TableRow key={record.id} data-testid={`row-record-${record.id}`} className={rowClass}>
                          <TableCell className="px-6 py-4">{formatDate(record.createdAt)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-on-surface-variant" />
                              <span className="font-medium text-on-surface">{employee?.fullName || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(record.type)}
                              {getTypeBadge(record.type)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {record.amount ? (
                              <span className={record.type === "penalty" ? "text-error font-semibold" : "text-green-600 font-semibold"}>
                                {record.type === "penalty" ? "-" : "+"}{record.amount.toLocaleString()} {sumLabel}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 max-w-xs truncate text-on-surface-variant">{record.reason}</TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEmployeeHistory(record.userId)}
                              data-testid={`button-history-${record.id}`}
                              className="text-on-surface-variant hover:text-primary"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "warning" && tCommon('warning')}
              {dialogType === "penalty" && t('fine')}
              {dialogType === "reward" && t('reward')}
              {dialogType === "act" && t('documents')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('employees')}</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder={t('employees')} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(employees) ? employees : []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dialogType === "warning" && (
              <div>
                <Label>{tCommon('type')}</Label>
                <Select value={warningType} onValueChange={setWarningType}>
                  <SelectTrigger data-testid="select-warning-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">{oralLabel}</SelectItem>
                    <SelectItem value="written">{writtenLabel}</SelectItem>
                    <SelectItem value="final">{finalLabel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(dialogType === "penalty" || dialogType === "reward") && (
              <div>
                <Label>{tCommon('amount')} ({sumLabel})</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100000"
                  data-testid="input-amount"
                />
              </div>
            )}

            <div>
              <Label>{tCommon('description')}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={tCommon('description')}
                rows={4}
                data-testid="input-reason"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel">
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedEmployee || !reason || createRecordMutation.isPending}
                data-testid="button-save"
              >
                {tCommon('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEmployeeHistory} onOpenChange={() => setSelectedEmployeeHistory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('employeeDetails')}: {(employees ?? []).find((e) => e.id === selectedEmployeeHistory)?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('date')}</TableHead>
                  <TableHead>{tCommon('type')}</TableHead>
                  <TableHead>{tCommon('amount')}</TableHead>
                  <TableHead>{tCommon('description')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(employeeHistoryRecords) ? employeeHistoryRecords : []).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell>{getTypeBadge(record.type)}</TableCell>
                    <TableCell>
                      {record.amount ? (
                        <span className={record.type === "penalty" ? "text-red-500" : "text-green-500"}>
                          {record.type === "penalty" ? "-" : "+"}{record.amount.toLocaleString()} {sumLabel}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{record.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
