import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, FileText, TrendingUp, Target, Plus, AlertTriangle, Clock, CheckCircle, Settings, Activity, Gauge, Wrench } from "lucide-react";
import type {
  Employee, OrgStructureAssignment, EmploymentContract, SalaryHistoryRecord,
  TransferRecord, TranslationFn
} from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";

interface WorkTabProps {
  employee: Employee;
  t: TranslationFn;
  tCommon: TranslationFn;
  orgStructureData: { primary: OrgStructureAssignment; all: OrgStructureAssignment[] } | undefined;
  calculateWorkExperience: () => string;
  contractDialogOpen: boolean;
  setContractDialogOpen: (open: boolean) => void;
  contractForm: {
    contractNumber: string;
    contractType: string;
    startDate: string;
    endDate: string;
    salary: string;
    workSchedule: string;
  };
  setContractForm: (form: WorkTabProps["contractForm"]) => void;
  saveContractMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingContracts: boolean;
  contracts: EmploymentContract[] | undefined;
  salaryDialogOpen: boolean;
  setSalaryDialogOpen: (open: boolean) => void;
  salaryForm: {
    effectiveDate: string;
    previousSalary: string;
    newSalary: string;
    changeType: string;
    notes: string;
  };
  setSalaryForm: (form: WorkTabProps["salaryForm"]) => void;
  saveSalaryChangeMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingSalaryHistory: boolean;
  salaryHistory: SalaryHistoryRecord[] | undefined;
  transfers: TransferRecord[] | undefined;
}

function OperatorProductionBlock({ employeeId }: { employeeId: string | number }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/hr/employees/operator-stats", employeeId],
    queryFn: () => apiRequest("GET", `/api/hr/employees/${employeeId}/operator-stats`),
    enabled: !!employeeId,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
          <div className="h-20 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.error) return null;

  const oee = stats.today_oee ?? 0;
  const oeeColor = oee >= 85 ? "text-green-600" : oee >= 70 ? "text-amber-600" : "text-red-600";
  const produced = stats.today_produced ?? 0;
  const target = stats.today_target ?? 0;
  const defects = stats.today_defects ?? 0;
  const withinTarget = produced >= target;
  const defectRate = produced > 0 ? ((defects / produced) * 100).toFixed(2) : "0.00";

  return (
    <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800/40 dark:bg-blue-950/10" data-testid="card-operator-production">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-5 w-5 text-blue-600" />
          Ishlab Chiqarish Ma'lumotlari
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Dastgoh</p>
            <p className="font-semibold flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-blue-500" />
              {stats.machine_name || "—"}
              {stats.machine_id && <span className="text-xs text-muted-foreground">(ID: {stats.machine_id})</span>}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Smena</p>
            <p className="font-semibold">{stats.shift_type || "—"}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Bugungi OEE</p>
            <p className={`text-2xl font-bold ${oeeColor}`}>{oee.toFixed(1)}%</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Bajarildi</p>
            <p className="font-semibold flex items-center gap-1">
              <Activity className="h-4 w-4 text-green-500" />
              {produced.toLocaleString()} dona
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Nuqsonli</p>
            <p className="font-semibold flex items-center gap-1 text-red-600">
              <span>❌</span>
              {defects} dona ({defectRate}%)
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Me'yor / Holat</p>
            <p className="font-semibold flex items-center gap-1">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              {target.toLocaleString()} dona/kun
            </p>
            <p className={`text-xs font-medium ${withinTarget ? "text-green-600" : "text-red-600"}`}>
              {withinTarget ? "✅ Me'yor ichida" : "⚠️ Me'yordan past"}
            </p>
          </div>
        </div>
        {stats.last_report_date && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            So'nggi hisobot: {stats.last_report_date}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkTab({
  employee, t, tCommon, orgStructureData, calculateWorkExperience,
  contractDialogOpen, setContractDialogOpen, contractForm, setContractForm, saveContractMutation,
  loadingContracts, contracts,
  salaryDialogOpen, setSalaryDialogOpen, salaryForm, setSalaryForm, saveSalaryChangeMutation,
  loadingSalaryHistory, salaryHistory, transfers,
}: WorkTabProps) {
  return (
    <div className="space-y-6">
            {employee.is_machine_operator && (
              <OperatorProductionBlock employeeId={employee.id} />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {t('currentWorkplace')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('position')}</p>
                      {orgStructureData?.primary ? (
                        <Link href="/org-structure/hierarchy">
                          <p className="font-medium text-primary underline cursor-pointer hover:text-primary/80">
                            {orgStructureData.primary.positionName || orgStructureData.primary.functionName}
                          </p>
                        </Link>
                      ) : (
                        <Link href="/org-structure/hierarchy">
                          <p className="font-medium text-muted-foreground underline cursor-pointer hover:text-foreground">
                            {tCommon('notSpecified')}
                          </p>
                        </Link>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('department')}</p>
                      {orgStructureData?.primary ? (
                        <Link href="/org-structure/hierarchy">
                          <p className="font-medium text-primary underline cursor-pointer hover:text-primary/80">
                            {orgStructureData.primary.departmentName}
                          </p>
                        </Link>
                      ) : (
                        <Link href="/org-structure/hierarchy">
                          <p className="font-medium text-muted-foreground underline cursor-pointer hover:text-foreground">
                            {tCommon('notSpecified')}
                          </p>
                        </Link>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('hireDate')}</p>
                      <p className="font-medium">{employee.hireDate || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('experience')}</p>
                      <p className="font-medium">{calculateWorkExperience()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('shift')}</p>
                      <p className="font-medium">{employee.shift || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('manager')}</p>
                      <p className="font-medium">{employee.manager?.fullName || tCommon('notSpecified')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {t('ckpAndAttestation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('ckpCode')}</p>
                      <p className="font-medium">{employee.ckpCode || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('hierarchyLevel')}</p>
                      <p className="font-medium">{employee.hierarchyLevel || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('attestationDate')}</p>
                      <p className="font-medium">{employee.attestationDate || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('role')}</p>
                      <Badge variant="outline">{employee.role}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('employmentContracts')}
                  </CardTitle>
                  <CardDescription>{t('employeeDetails')}</CardDescription>
                </div>
                <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-contract">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('newContract')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('newContract')}</DialogTitle>
                      <DialogDescription>{t('employeeDetails')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('contractNumber')}</Label>
                          <Input
                            value={contractForm.contractNumber}
                            onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                            placeholder="SH-001"
                            data-testid="input-contract-number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('contractType')}</Label>
                          <Select
                            value={contractForm.contractType}
                            onValueChange={(value) => setContractForm({ ...contractForm, contractType: value })}
                          >
                            <SelectTrigger data-testid="select-contract-type">
                              <SelectValue placeholder={tCommon('select')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indefinite">Muddatsiz</SelectItem>
                              <SelectItem value="fixed_term">Muddatli</SelectItem>
                              <SelectItem value="probation">Sinov muddati</SelectItem>
                              <SelectItem value="project">Loyiha asosida</SelectItem>
                              <SelectItem value="seasonal">{t('seasonal')}</SelectItem>
                              <SelectItem value="part_time">{t('partTime')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('startDate')}</Label>
                          <Input
                            type="date"
                            value={contractForm.startDate}
                            onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                            data-testid="input-contract-start"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('endDate')}</Label>
                          <Input
                            type="date"
                            value={contractForm.endDate}
                            onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                            data-testid="input-contract-end"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('salary')}</Label>
                          <Input
                            type="number"
                            value={contractForm.salary}
                            onChange={(e) => setContractForm({ ...contractForm, salary: e.target.value })}
                            placeholder="5000000"
                            data-testid="input-contract-salary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('workSchedule')}</Label>
                          <Input
                            value={contractForm.workSchedule}
                            onChange={(e) => setContractForm({ ...contractForm, workSchedule: e.target.value })}
                            placeholder="09:00 - 18:00"
                            data-testid="input-contract-schedule"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveContractMutation.mutate(contractForm)}
                        disabled={saveContractMutation.isPending || !contractForm.contractNumber || !contractForm.startDate}
                        data-testid="button-save-contract"
                      >
                        {saveContractMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingContracts ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : contracts && contracts.length > 0 ? (
                  <div className="space-y-3">
                    {(Array.isArray(contracts) ? contracts : []).map((contract: EmploymentContract) => {
                      const now = new Date();
                      const endDate = contract.endDate ? new Date(contract.endDate) : null;
                      const isActive = !endDate || endDate >= now;
                      const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
                      const isExpired = daysLeft !== null && daysLeft < 0;
                      const contractTypeLabels: Record<string, string> = {
                        indefinite: "Muddatsiz",
                        fixed_term: "Muddatli",
                        probation: "Sinov muddati",
                        project: "Loyiha asosida",
                        seasonal: t('seasonal'),
                        part_time: t('partTime')
                      };
                      const CONTRACT_TYPE_COLORS: Record<string, string> = {
                        indefinite: "bg-blue-100 text-blue-800",
                        fixed_term: "bg-purple-100 text-purple-800",
                        probation: "bg-orange-100 text-orange-800",
                        project: "bg-teal-100 text-teal-800",
                        seasonal: "bg-yellow-100 text-yellow-800",
                        part_time: "bg-gray-100 text-gray-800",
                      };
                      return (
                        <Card key={contract.id} className={`border ${isExpired ? "border-red-300 bg-red-50/30" : isExpiringSoon ? "border-amber-300 bg-amber-50/30" : ""}`} data-testid={`card-contract-${contract.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{contract.contractNumber}</span>
                                <Badge className={`text-xs border-none ${CONTRACT_TYPE_COLORS[contract.contractType] || "bg-surface-container text-on-surface-variant"}`}>
                                  {contractTypeLabels[contract.contractType] || contract.contractType}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isExpired ? (
                                  <Badge className="bg-red-100 text-red-800 border-none text-xs gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Muddati o'tgan
                                  </Badge>
                                ) : isExpiringSoon ? (
                                  <Badge className="bg-amber-100 text-amber-800 border-none text-xs gap-1">
                                    <Clock className="h-3 w-3" />
                                    {daysLeft} kun qoldi
                                  </Badge>
                                ) : isActive ? (
                                  <Badge className="bg-green-100 text-green-800 border-none text-xs gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    {tCommon('active')}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                            {isExpiringSoon && !isExpired && (
                              <div className="mb-3 p-2 rounded-md bg-amber-50 border border-amber-200 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-700">
                                  Shartnoma muddati {daysLeft} kunda tugaydi! HR va rahbarga eslatma yuborildi.
                                </p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t('salary')}</p>
                                <p className="font-medium text-green-600">{contract.salary?.toLocaleString()} so'm</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t('startDate')}</p>
                                <p className="font-medium">{contract.startDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t('endDate')}</p>
                                <p className={`font-medium ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : ""}`}>
                                  {contract.endDate || "Muddatsiz"}
                                </p>
                              </div>
                              {contract.workSchedule && (
                                <div>
                                  <p className="text-muted-foreground">{t('workSchedule')}</p>
                                  <p className="font-medium">{contract.workSchedule}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {tCommon('noData')}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('salaryHistory')}
                  </CardTitle>
                  <CardDescription>{t('employeeDetails')}</CardDescription>
                </div>
                <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-salary-change">
                      <Plus className="h-4 w-4 mr-2" />
                      {tCommon('add')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('salaryHistory')}</DialogTitle>
                      <DialogDescription>{t('employeeDetails')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('effectiveDate')}</Label>
                          <Input
                            type="date"
                            value={salaryForm.effectiveDate}
                            onChange={(e) => setSalaryForm({ ...salaryForm, effectiveDate: e.target.value })}
                            data-testid="input-salary-date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('changeType')}</Label>
                          <Select
                            value={salaryForm.changeType}
                            onValueChange={(value) => setSalaryForm({ ...salaryForm, changeType: value })}
                          >
                            <SelectTrigger data-testid="select-salary-type">
                              <SelectValue placeholder={tCommon('select')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promotion">{t('promotion')}</SelectItem>
                              <SelectItem value="annual_review">{t('annualReview')}</SelectItem>
                              <SelectItem value="adjustment">{t('adjustment')}</SelectItem>
                              <SelectItem value="probation_end">{t('probationEnd')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t('previousSalary')}</Label>
                          <Input
                            type="number"
                            value={salaryForm.previousSalary}
                            onChange={(e) => setSalaryForm({ ...salaryForm, previousSalary: e.target.value })}
                            placeholder="4000000"
                            data-testid="input-previous-salary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('newSalary')}</Label>
                          <Input
                            type="number"
                            value={salaryForm.newSalary}
                            onChange={(e) => setSalaryForm({ ...salaryForm, newSalary: e.target.value })}
                            placeholder="5000000"
                            data-testid="input-new-salary"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{tCommon('note')}</Label>
                        <Input
                          value={salaryForm.notes}
                          onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                          placeholder="Qo'shimcha ma'lumot..."
                          data-testid="input-salary-notes"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveSalaryChangeMutation.mutate(salaryForm)}
                        disabled={saveSalaryChangeMutation.isPending || !salaryForm.effectiveDate || !salaryForm.newSalary}
                        data-testid="button-save-salary"
                      >
                        {saveSalaryChangeMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingSalaryHistory ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : salaryHistory && salaryHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tCommon('date')}</TableHead>
                        <TableHead>{t('previousSalary')}</TableHead>
                        <TableHead>{t('newSalary')}</TableHead>
                        <TableHead>{t('change')}</TableHead>
                        <TableHead>{tCommon('type')}</TableHead>
                        <TableHead>{tCommon('note')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(salaryHistory) ? salaryHistory : []).map((record: SalaryHistoryRecord) => {
                        const changeTypeLabels: Record<string, string> = {
                          promotion: t('promotion'),
                          annual_review: t('annualReview'),
                          adjustment: t('adjustment'),
                          probation_end: t('probationEnd')
                        };
                        const changePercent = record.changePercent || 0;
                        return (
                          <TableRow key={record.id} data-testid={`row-salary-${record.id}`}>
                            <TableCell>{record.effectiveDate}</TableCell>
                            <TableCell>{record.previousSalary?.toLocaleString()} so'm</TableCell>
                            <TableCell className="font-medium">{record.newSalary?.toLocaleString()} so'm</TableCell>
                            <TableCell>
                              <span className={changePercent >= 0 ? "text-green-600" : "text-red-600"}>
                                {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{changeTypeLabels[record.changeType] || record.changeType}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">{record.notes || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {tCommon('noData')}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t('positionChanges')}
                </CardTitle>
                <CardDescription>{t('employeeDetails')}</CardDescription>
              </CardHeader>
              <CardContent>
                {transfers && transfers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tCommon('date')}</TableHead>
                        <TableHead>{t('previousPosition')}</TableHead>
                        <TableHead>{t('newPosition')}</TableHead>
                        <TableHead>{t('reason')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(transfers) ? transfers : []).map((transfer: TransferRecord) => (
                        <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`}>
                          <TableCell>{transfer.transferDate}</TableCell>
                          <TableCell>{transfer.fromPositionName || "-"}</TableCell>
                          <TableCell>{transfer.toPositionName}</TableCell>
                          <TableCell>{transfer.reason || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {tCommon('noData')}
                  </p>
                )}
              </CardContent>
            </Card>
    </div>
  );
}
