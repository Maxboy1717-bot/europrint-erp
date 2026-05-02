import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, AlertTriangle, Clock, Wallet, Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { BonusRecord, FineRecord, OvertimeRecord, CashAdvanceRecord, SalaryHistoryRecord, TranslationFn } from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

interface SalaryBenchmark {
  employeeSalary: number;
  departmentAvg: number | null;
  departmentMax: number | null;
  departmentName: string | null;
}

interface FinanceTabProps {
  tCommon: TranslationFn;
  userId?: string;
  baseSalary?: number;
  salaryType?: string;
  salaryHistory?: SalaryHistoryRecord[];
  bonusDialogOpen: boolean;
  setBonusDialogOpen: (open: boolean) => void;
  bonusForm: { paymentDate: string; amount: string; bonusType: string; description: string };
  setBonusForm: (form: FinanceTabProps["bonusForm"]) => void;
  saveBonusMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingBonuses: boolean;
  bonuses: BonusRecord[] | undefined;
  fineDialogOpen: boolean;
  setFineDialogOpen: (open: boolean) => void;
  fineForm: { fineDate: string; amount: string; fineType: string; description: string; deductedFromSalary: boolean };
  setFineForm: (form: FinanceTabProps["fineForm"]) => void;
  saveFineMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingFines: boolean;
  fines: FineRecord[] | undefined;
  overtimeDialogOpen: boolean;
  setOvertimeDialogOpen: (open: boolean) => void;
  overtimeForm: { workDate: string; hours: string; hourlyRate: string; multiplier: string; reason: string };
  setOvertimeForm: (form: FinanceTabProps["overtimeForm"]) => void;
  saveOvertimeMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingOvertime: boolean;
  overtime: OvertimeRecord[] | undefined;
  cashAdvanceDialogOpen: boolean;
  setCashAdvanceDialogOpen: (open: boolean) => void;
  cashAdvanceForm: { requestDate: string; amount: string; reason: string; status: string };
  setCashAdvanceForm: (form: FinanceTabProps["cashAdvanceForm"]) => void;
  saveCashAdvanceMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingCashAdvances: boolean;
  cashAdvances: CashAdvanceRecord[] | undefined;
}

export function FinanceTab({
  tCommon,
  userId,
  baseSalary, salaryType, salaryHistory,
  bonusDialogOpen, setBonusDialogOpen, bonusForm, setBonusForm, saveBonusMutation, loadingBonuses, bonuses,
  fineDialogOpen, setFineDialogOpen, fineForm, setFineForm, saveFineMutation, loadingFines, fines,
  overtimeDialogOpen, setOvertimeDialogOpen, overtimeForm, setOvertimeForm, saveOvertimeMutation, loadingOvertime, overtime,
  cashAdvanceDialogOpen, setCashAdvanceDialogOpen, cashAdvanceForm, setCashAdvanceForm, saveCashAdvanceMutation, loadingCashAdvances, cashAdvances,
}: FinanceTabProps) {
  const now = new Date();

  const { data: salaryBenchmark, isLoading: loadingBenchmark } = useQuery<SalaryBenchmark>({
    queryKey: ['/api/finance/salary-benchmark', userId],
    queryFn: async () => {
      const res = await fetch(`/api/finance/salary-benchmark/${userId}`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
  });
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthBonuses = (bonuses || []).filter(b => b.paymentDate?.startsWith(currentMonth));
  const monthFines = (fines || []).filter(f => f.fineDate?.startsWith(currentMonth));
  const monthOvertime = (overtime || []).filter(o => o.workDate?.startsWith(currentMonth));

  const totalBonuses = (Array.isArray(monthBonuses) ? monthBonuses : []).reduce((s, b) => s + (b.amount || 0), 0);
  const totalFines = (Array.isArray(monthFines) ? monthFines : []).reduce((s, f) => s + (f.amount || 0), 0);
  const totalOvertime = (Array.isArray(monthOvertime) ? monthOvertime : []).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const netImpact = totalBonuses + totalOvertime - totalFines;
  const estimatedSalary = (baseSalary || 0) + netImpact;

  const salaryTypeLabel = salaryType === "ishbay" ? "Ishbay (dona × tarif)"
    : salaryType === "soatbay" ? "Soatbay (soat × tarif)"
    : salaryType === "oylik" ? "Oylik (bazaviy ± qo'shimchalar)"
    : "Belgilanmagan";

  const salaryChartData = (salaryHistory || []).slice(0, 12).reverse().map(h => ({
    date: h.effectiveDate ? h.effectiveDate.slice(0, 7) : "?",
    maosh: h.newSalary || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-green-500" />
                Joriy oy moliyaviy xulosasi
              </CardTitle>
              <CardDescription>{currentMonth} oy uchun hisob-kitob</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Bazaviy maosh</span>
                <span className="font-medium">{(baseSalary || 0).toLocaleString()} so'm</span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{salaryTypeLabel}</div>
              {totalOvertime > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3 w-3 text-green-500" /> Overvaqt</span>
                  <span className="text-green-600">+{totalOvertime.toLocaleString()} so'm</span>
                </div>
              )}
              {totalBonuses > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Gift className="h-3 w-3 text-blue-500" /> Bonus</span>
                  <span className="text-blue-600">+{totalBonuses.toLocaleString()} so'm</span>
                </div>
              )}
              {totalFines > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><TrendingDown className="h-3 w-3 text-red-500" /> Jarimalar</span>
                  <span className="text-red-600">-{totalFines.toLocaleString()} so'm</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border font-semibold">
                <span>Taxminiy jami</span>
                <span className={`text-lg ${estimatedSalary > (baseSalary || 0) ? "text-green-600" : estimatedSalary < (baseSalary || 0) ? "text-red-600" : ""}`}>
                  {estimatedSalary.toLocaleString()} so'm
                </span>
              </div>
            </CardContent>
          </Card>

          {salaryChartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  Maosh tarixi (12 oy)
                </CardTitle>
                <CardDescription>Oylik bazaviy maosh o'zgarishi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salaryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => [`${v.toLocaleString()} so'm`, "Maosh"]} />
                      <Bar dataKey="maosh" name="Maosh" fill="#8b5cf6" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      <Card data-testid="card-salary-benchmark">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-blue-500" />
            Maosh solishtirmasi (Benchmark)
          </CardTitle>
          <CardDescription>
            {salaryBenchmark?.departmentName
              ? `${salaryBenchmark.departmentName} bo'limi bo'yicha solishtirma`
              : "Bo'lim bo'yicha maosh solishtirmasi"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBenchmark ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : salaryBenchmark ? (
            (() => {
              const empSalary = salaryBenchmark.employeeSalary || (baseSalary ?? 0);
              const deptAvg = salaryBenchmark.departmentAvg;
              const deptMax = salaryBenchmark.departmentMax;
              const maxVal = Math.max(empSalary, deptAvg ?? 0, deptMax ?? 0, 1);
              const barData = ([
                { name: "Siz", value: empSalary, color: "#3b82f6" },
                { name: "Bo'lim o'rtachasi", value: deptAvg, color: "#10b981" },
                { name: "Bo'lim maksimali", value: deptMax, color: "#f59e0b" },
              ]).filter(item => item.value !== null && item.value !== undefined);

              return (
                <div className="space-y-4" data-testid="benchmark-values">
                  {(Array.isArray(barData) ? barData : []).map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-semibold" data-testid={`benchmark-value-${item.name}`}>
                          {(item.value as number).toLocaleString()} so'm
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round(((item.value as number) / maxVal) * 100)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {(deptAvg !== null && deptAvg !== undefined && deptAvg > 0) && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {empSalary >= deptAvg
                          ? `Sizning maoshingiz bo'lim o'rtachasidan ${((empSalary - deptAvg) / deptAvg * 100).toFixed(1)}% yuqori`
                          : `Sizning maoshingiz bo'lim o'rtachasidan ${((deptAvg - empSalary) / deptAvg * 100).toFixed(1)}% past`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <p className="text-muted-foreground text-center py-6 text-sm">
              Benchmark ma'lumotlari mavjud emas
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-500" />
                    Bonuslar
                  </CardTitle>
                  <CardDescription>Xodimga berilgan bonuslar</CardDescription>
                </div>
                <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-bonus">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi bonus
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi bonus qo'shish</DialogTitle>
                      <DialogDescription>Xodimga bonus berish</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>To'lov sanasi</Label>
                          <Input
                            type="date"
                            value={bonusForm.paymentDate}
                            onChange={(e) => setBonusForm({ ...bonusForm, paymentDate: e.target.value })}
                            data-testid="input-bonus-date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Summa (so'm)</Label>
                          <Input
                            type="number"
                            value={bonusForm.amount}
                            onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })}
                            placeholder="500000"
                            data-testid="input-bonus-amount"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Bonus turi</Label>
                        <Select
                          value={bonusForm.bonusType}
                          onValueChange={(value) => setBonusForm({ ...bonusForm, bonusType: value })}
                        >
                          <SelectTrigger data-testid="select-bonus-type">
                            <SelectValue placeholder="Turni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="performance">Samaradorlik</SelectItem>
                            <SelectItem value="annual">Yillik</SelectItem>
                            <SelectItem value="holiday">Bayram</SelectItem>
                            <SelectItem value="project">Loyiha</SelectItem>
                            <SelectItem value="other">Boshqa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Izoh</Label>
                        <Input
                          value={bonusForm.description}
                          onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })}
                          placeholder="Bonus sababi..."
                          data-testid="input-bonus-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveBonusMutation.mutate(bonusForm)}
                        disabled={saveBonusMutation.isPending || !bonusForm.paymentDate || !bonusForm.amount}
                        data-testid="button-save-bonus"
                      >
                        {saveBonusMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingBonuses ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                ) : bonuses && bonuses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Array.isArray(bonuses) ? bonuses : []).map((bonus: BonusRecord) => {
                      const bonusTypeLabels: Record<string, string> = {
                        performance: "Samaradorlik",
                        annual: "Yillik",
                        holiday: "Bayram",
                        project: "Loyiha",
                        other: "Boshqa"
                      };
                      return (
                        <Card key={bonus.id} className="border" data-testid={`card-bonus-${bonus.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Gift className="h-4 w-4 text-green-500" />
                                <Badge className="bg-green-500">{bonusTypeLabels[bonus.bonusType] || bonus.bonusType}</Badge>
                              </div>
                            </div>
                            <p className="text-2xl font-bold text-green-600 mb-2">
                              +{bonus.amount?.toLocaleString()} so'm
                            </p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Sana: {bonus.paymentDate}</p>
                              {bonus.description && <p>Izoh: {bonus.description}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Bonuslar yo'q
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Jarimalar
                  </CardTitle>
                  <CardDescription>Xodimga berilgan jarimalar</CardDescription>
                </div>
                <Dialog open={fineDialogOpen} onOpenChange={setFineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive" data-testid="button-add-fine">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi jarima
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi jarima qo'shish</DialogTitle>
                      <DialogDescription>Xodimga jarima yozish</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Jarima sanasi</Label>
                          <Input
                            type="date"
                            value={fineForm.fineDate}
                            onChange={(e) => setFineForm({ ...fineForm, fineDate: e.target.value })}
                            data-testid="input-fine-date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Summa (so'm)</Label>
                          <Input
                            type="number"
                            value={fineForm.amount}
                            onChange={(e) => setFineForm({ ...fineForm, amount: e.target.value })}
                            placeholder="100000"
                            data-testid="input-fine-amount"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Jarima turi</Label>
                        <Select
                          value={fineForm.fineType}
                          onValueChange={(value) => setFineForm({ ...fineForm, fineType: value })}
                        >
                          <SelectTrigger data-testid="select-fine-type">
                            <SelectValue placeholder="Turni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="late">Kechikish</SelectItem>
                            <SelectItem value="absence">Ishga kelmaslik</SelectItem>
                            <SelectItem value="damage">Zarar</SelectItem>
                            <SelectItem value="quality">Sifat</SelectItem>
                            <SelectItem value="safety">Xavfsizlik</SelectItem>
                            <SelectItem value="other">Boshqa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Izoh</Label>
                        <Input
                          value={fineForm.description}
                          onChange={(e) => setFineForm({ ...fineForm, description: e.target.value })}
                          placeholder="Jarima sababi..."
                          data-testid="input-fine-description"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="deducted"
                          checked={fineForm.deductedFromSalary}
                          onChange={(e) => setFineForm({ ...fineForm, deductedFromSalary: e.target.checked })}
                          className="h-4 w-4 rounded border-outline-variant/40"
                          data-testid="checkbox-deducted"
                        />
                        <Label htmlFor="deducted">Maoshdan ushlab qolindi</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveFineMutation.mutate(fineForm)}
                        disabled={saveFineMutation.isPending || !fineForm.fineDate || !fineForm.amount}
                        data-testid="button-save-fine"
                      >
                        {saveFineMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingFines ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                ) : fines && fines.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Array.isArray(fines) ? fines : []).map((fine: FineRecord) => {
                      const fineTypeLabels: Record<string, string> = {
                        late: "Kechikish",
                        absence: "Ishga kelmaslik",
                        damage: "Zarar",
                        quality: "Sifat",
                        safety: "Xavfsizlik",
                        other: "Boshqa"
                      };
                      return (
                        <Card key={fine.id} className="border" data-testid={`card-fine-${fine.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <Badge variant="destructive">{fineTypeLabels[fine.fineType] || fine.fineType}</Badge>
                              </div>
                              {fine.deductedFromSalary && (
                                <Badge className="bg-blue-500">To'lab tashlandi</Badge>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-red-600 mb-2">
                              -{fine.amount?.toLocaleString()} so'm
                            </p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Sana: {fine.fineDate}</p>
                              {fine.description && <p>Izoh: {fine.description}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Jarimalar yo'q
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Overtaym
                  </CardTitle>
                  <CardDescription>Qo'shimcha ish vaqti to'lovlari</CardDescription>
                </div>
                <Dialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-overtime">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi overtaym
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi overtaym qo'shish</DialogTitle>
                      <DialogDescription>Qo'shimcha ish vaqtini ro'yxatga olish</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ish sanasi</Label>
                          <Input
                            type="date"
                            value={overtimeForm.workDate}
                            onChange={(e) => setOvertimeForm({ ...overtimeForm, workDate: e.target.value })}
                            data-testid="input-overtime-date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Soatlar</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={overtimeForm.hours}
                            onChange={(e) => setOvertimeForm({ ...overtimeForm, hours: e.target.value })}
                            placeholder="2"
                            data-testid="input-overtime-hours"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Soatlik stavka (so'm)</Label>
                          <Input
                            type="number"
                            value={overtimeForm.hourlyRate}
                            onChange={(e) => setOvertimeForm({ ...overtimeForm, hourlyRate: e.target.value })}
                            placeholder="50000"
                            data-testid="input-overtime-rate"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ko'paytirish koeffitsienti</Label>
                          <Select
                            value={overtimeForm.multiplier}
                            onValueChange={(value) => setOvertimeForm({ ...overtimeForm, multiplier: value })}
                          >
                            <SelectTrigger data-testid="select-overtime-multiplier">
                              <SelectValue placeholder="Koeffitsient" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1x</SelectItem>
                              <SelectItem value="1.5">1.5x</SelectItem>
                              <SelectItem value="2">2x</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sabab</Label>
                        <Input
                          value={overtimeForm.reason}
                          onChange={(e) => setOvertimeForm({ ...overtimeForm, reason: e.target.value })}
                          placeholder="Overtaym sababi..."
                          data-testid="input-overtime-reason"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveOvertimeMutation.mutate(overtimeForm)}
                        disabled={saveOvertimeMutation.isPending || !overtimeForm.workDate || !overtimeForm.hours}
                        data-testid="button-save-overtime"
                      >
                        {saveOvertimeMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingOvertime ? (
                  <Skeleton className="h-40 w-full" />
                ) : overtime && overtime.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Soatlar</TableHead>
                        <TableHead>Stavka</TableHead>
                        <TableHead>Koeff.</TableHead>
                        <TableHead>Jami</TableHead>
                        <TableHead>Sabab</TableHead>
                        <TableHead>Holat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(overtime) ? overtime : []).map((record: OvertimeRecord) => (
                        <TableRow key={record.id} data-testid={`row-overtime-${record.id}`}>
                          <TableCell>{record.workDate}</TableCell>
                          <TableCell>{record.hours} soat</TableCell>
                          <TableCell>{record.hourlyRate?.toLocaleString()} so'm</TableCell>
                          <TableCell>{record.multiplier}x</TableCell>
                          <TableCell className="font-bold text-orange-600">
                            {record.totalAmount?.toLocaleString()} so'm
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{record.reason || "-"}</TableCell>
                          <TableCell>
                            {record.isPaid ? (
                              <Badge className="bg-green-500">To'langan</Badge>
                            ) : (
                              <Badge variant="secondary">Kutilmoqda</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Overtaym yozuvlari yo'q
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-500" />
                    Avanslar
                  </CardTitle>
                  <CardDescription>Avans so'rovlari</CardDescription>
                </div>
                <Dialog open={cashAdvanceDialogOpen} onOpenChange={setCashAdvanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-cash-advance">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi avans
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi avans so'rovi</DialogTitle>
                      <DialogDescription>Avans so'rovini ro'yxatga olish</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>So'rov sanasi</Label>
                          <Input
                            type="date"
                            value={cashAdvanceForm.requestDate}
                            onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, requestDate: e.target.value })}
                            data-testid="input-advance-date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Summa (so'm)</Label>
                          <Input
                            type="number"
                            value={cashAdvanceForm.amount}
                            onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, amount: e.target.value })}
                            placeholder="1000000"
                            data-testid="input-advance-amount"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sabab</Label>
                        <Input
                          value={cashAdvanceForm.reason}
                          onChange={(e) => setCashAdvanceForm({ ...cashAdvanceForm, reason: e.target.value })}
                          placeholder="Avans sababi..."
                          data-testid="input-advance-reason"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Holat</Label>
                        <Select
                          value={cashAdvanceForm.status}
                          onValueChange={(value) => setCashAdvanceForm({ ...cashAdvanceForm, status: value })}
                        >
                          <SelectTrigger data-testid="select-advance-status">
                            <SelectValue placeholder="Holatni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Kutilmoqda</SelectItem>
                            <SelectItem value="approved">Tasdiqlangan</SelectItem>
                            <SelectItem value="rejected">Rad etilgan</SelectItem>
                            <SelectItem value="paid">To'langan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveCashAdvanceMutation.mutate(cashAdvanceForm)}
                        disabled={saveCashAdvanceMutation.isPending || !cashAdvanceForm.requestDate || !cashAdvanceForm.amount}
                        data-testid="button-save-advance"
                      >
                        {saveCashAdvanceMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingCashAdvances ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                  </div>
                ) : cashAdvances && cashAdvances.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Array.isArray(cashAdvances) ? cashAdvances : []).map((advance: CashAdvanceRecord) => {
                      const statusConfig: Record<string, { label: string; color: string }> = {
                        pending: { label: "Kutilmoqda", color: "bg-yellow-500" },
                        approved: { label: "Tasdiqlangan", color: "bg-green-500" },
                        rejected: { label: "Rad etilgan", color: "bg-red-500" },
                        paid: { label: "To'langan", color: "bg-blue-500" }
                      };
                      const status = statusConfig[advance.status] || { label: advance.status, color: "bg-gray-500" };
                      return (
                        <Card key={advance.id} className="border" data-testid={`card-advance-${advance.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-blue-500" />
                                <Badge className={status.color}>{status.label}</Badge>
                              </div>
                            </div>
                            <p className="text-2xl font-bold text-blue-600 mb-2">
                              {advance.amount?.toLocaleString()} so'm
                            </p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Sana: {advance.requestDate}</p>
                              {advance.reason && <p>Sabab: {advance.reason}</p>}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Avans so'rovlari yo'q
                  </p>
                )}
              </CardContent>
            </Card>
    </div>
  );
}
