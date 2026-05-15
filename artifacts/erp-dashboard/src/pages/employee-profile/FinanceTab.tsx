/** @module FinanceTab @description React page component for the employee finance tab. Handles data fetching, monthly aggregation, and orchestrates all finance sub-panels and dialogs. */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift, AlertTriangle, Clock, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import type { FinanceTabProps, SalaryBenchmark } from "./FinanceTabTypes";
import { MonthlySummaryCard, SalaryHistoryCard, BenchmarkCard } from "./FinanceTabSummaryPanels";
import { BonusList, FineList, OvertimeTable, CashAdvanceList } from "./FinanceTabRecordLists";
import { BonusDialog, FineDialog } from "./FinanceTabDialogsBF";
import { OvertimeDialog, CashAdvanceDialog } from "./FinanceTabDialogsOA";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

export function FinanceTab({
  tCommon,
  userId,
  baseSalary,
  salaryType,
  salaryHistory,
  bonusDialogOpen, setBonusDialogOpen, bonusForm, setBonusForm, saveBonusMutation, loadingBonuses, bonuses,
  fineDialogOpen, setFineDialogOpen, fineForm, setFineForm, saveFineMutation, loadingFines, fines,
  overtimeDialogOpen, setOvertimeDialogOpen, overtimeForm, setOvertimeForm, saveOvertimeMutation, loadingOvertime, overtime,
  cashAdvanceDialogOpen, setCashAdvanceDialogOpen, cashAdvanceForm, setCashAdvanceForm, saveCashAdvanceMutation, loadingCashAdvances, cashAdvances,
}: FinanceTabProps) {
  const { t } = useTranslation("common");
  const now = new Date();

  const { data: salaryBenchmark, isLoading: loadingBenchmark } = useQuery<SalaryBenchmark>({
    queryKey: ['/api/finance/salary-benchmark', userId],
    queryFn: async () => {
      const res = (await apiRequest('GET', `/api/finance/salary-benchmark/${userId}`)) as unknown as Response;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
  });

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const bonusesArr = Array.isArray(bonuses) ? bonuses : [];
  const finesArr = Array.isArray(fines) ? fines : [];
  const overtimeArr = Array.isArray(overtime) ? overtime : [];

  const monthBonuses = bonusesArr.filter(b => b.paymentDate?.startsWith(currentMonth));
  const monthFines = finesArr.filter(f => f.fineDate?.startsWith(currentMonth));
  const monthOvertime = overtimeArr.filter(o => o.workDate?.startsWith(currentMonth));

  const totalBonuses = monthBonuses.reduce((s, b) => s + (b.amount || 0), 0);
  const totalFines = monthFines.reduce((s, f) => s + (f.amount || 0), 0);
  const totalOvertime = monthOvertime.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const estimatedSalary = (baseSalary || 0) + totalBonuses + totalOvertime - totalFines;

  return (
    <div className="space-y-6">
      {/* Top row: monthly summary + salary history chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlySummaryCard
          currentMonth={currentMonth}
          baseSalary={baseSalary || 0}
          salaryType={salaryType}
          totalOvertime={totalOvertime}
          totalBonuses={totalBonuses}
          totalFines={totalFines}
          estimatedSalary={estimatedSalary}
        />
        <SalaryHistoryCard salaryHistory={salaryHistory} />
      </div>

      {/* Benchmark */}
      <BenchmarkCard
        loadingBenchmark={loadingBenchmark}
        salaryBenchmark={salaryBenchmark}
        baseSalary={baseSalary}
      />

      {/* Bonuses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-[var(--ep-green)]" /> {t("bonuslar")}
            </CardTitle>
            <CardDescription>{t("xodimgaBerilganBonuslar")}</CardDescription>
          </div>
          <BonusDialog tCommon={tCommon} open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}
            form={bonusForm} setForm={setBonusForm} mutation={saveBonusMutation} />
        </CardHeader>
        <CardContent>
          <BonusList loading={loadingBonuses} bonuses={bonuses} />
        </CardContent>
      </Card>

      {/* Fines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--ep-red)]" /> {t("jarimalar")}
            </CardTitle>
            <CardDescription>{t("xodimgaBerilganJarimalar")}</CardDescription>
          </div>
          <FineDialog tCommon={tCommon} open={fineDialogOpen} onOpenChange={setFineDialogOpen}
            form={fineForm} setForm={setFineForm} mutation={saveFineMutation} />
        </CardHeader>
        <CardContent>
          <FineList loading={loadingFines} fines={fines} />
        </CardContent>
      </Card>

      {/* Overtime */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--ep-primary)]" /> {t("overtaym")}
            </CardTitle>
            <CardDescription>{t("qoshimchaIshVaqtiTolovlari")}</CardDescription>
          </div>
          <OvertimeDialog tCommon={tCommon} open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}
            form={overtimeForm} setForm={setOvertimeForm} mutation={saveOvertimeMutation} />
        </CardHeader>
        <CardContent>
          <OvertimeTable loading={loadingOvertime} overtime={overtime} />
        </CardContent>
      </Card>

      {/* Cash advances */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[var(--ep-blue)]" /> {t("avanslar")}
            </CardTitle>
            <CardDescription>{t("avansSorovlari")}</CardDescription>
          </div>
          <CashAdvanceDialog tCommon={tCommon} open={cashAdvanceDialogOpen} onOpenChange={setCashAdvanceDialogOpen}
            form={cashAdvanceForm} setForm={setCashAdvanceForm} mutation={saveCashAdvanceMutation} />
        </CardHeader>
        <CardContent>
          <CashAdvanceList loading={loadingCashAdvances} cashAdvances={cashAdvances} />
        </CardContent>
      </Card>
    </div>
  );
}
