/** @module FinanceTabSummaryPanels @description Summary, salary-history, and benchmark panel components for the employee finance tab. */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Scale, Gift } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SalaryHistoryRecord } from "./profile-types";
import type { SalaryBenchmark } from "./FinanceTabTypes";
import { SALARY_TYPE_LABEL } from "./FinanceTabTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// MonthlySummaryCard
// ---------------------------------------------------------------------------

interface MonthlySummaryCardProps {
  currentMonth: string;
  baseSalary: number;
  salaryType?: string;
  totalOvertime: number;
  totalBonuses: number;
  totalFines: number;
  estimatedSalary: number;
}

export function MonthlySummaryCard({
  currentMonth, baseSalary, salaryType,
  totalOvertime, totalBonuses, totalFines, estimatedSalary,
}: MonthlySummaryCardProps) {
  const { t } = useTranslation("common");
  const salaryTypeLabel = salaryType ? (SALARY_TYPE_LABEL[salaryType] ?? "Belgilanmagan") : "Belgilanmagan";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-[var(--ep-green)]" />
          {t("joriyOyMoliyaviyXulosasi")}
        </CardTitle>
        <CardDescription>{currentMonth} oy uchun hisob-kitob</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">{t("bazaviyMaosh")}</span>
          <span className="font-medium">{baseSalary.toLocaleString()} so'm</span>
        </div>
        <div className="text-xs text-muted-foreground mb-1">{salaryTypeLabel}</div>
        {totalOvertime > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-[var(--ep-green)]" /> {t("overvaqt")}
            </span>
            <span className="text-[var(--ep-green)]">+{totalOvertime.toLocaleString()} so'm</span>
          </div>
        )}
        {totalBonuses > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Gift className="h-3 w-3 text-[var(--ep-blue)]" /> {t("bonus")}
            </span>
            <span className="text-[var(--ep-blue)]">+{totalBonuses.toLocaleString()} so'm</span>
          </div>
        )}
        {totalFines > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-[var(--ep-red)]" /> {t("jarimalar")}
            </span>
            <span className="text-[var(--ep-red)]">-{totalFines.toLocaleString()} so'm</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border font-semibold">
          <span>{t("taxminiyJami")}</span>
          <span className={`text-lg ${estimatedSalary > baseSalary ? "text-[var(--ep-green)]" : estimatedSalary < baseSalary ? "text-[var(--ep-red)]" : ""}`}>
            {estimatedSalary.toLocaleString()} so'm
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SalaryHistoryCard
// ---------------------------------------------------------------------------

interface SalaryHistoryCardProps {
  salaryHistory?: SalaryHistoryRecord[];
}

export function SalaryHistoryCard({ salaryHistory }: SalaryHistoryCardProps) {
  const chartData = (Array.isArray(salaryHistory) ? salaryHistory : []).slice(0, 12).reverse().map(h => ({
    date: h.effectiveDate ? h.effectiveDate.slice(0, 7) : "?",
    maosh: h.newSalary || 0,
  }));
  if (chartData.length <= 1) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-[var(--ep-purple)]" />
          Maosh tarixi (12 oy)
        </CardTitle>
        <CardDescription>{t("oylikBazaviyMaoshOzgarishi")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()} so'm`, "Maosh"]} />
              <Bar dataKey="maosh" name="Maosh" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// BenchmarkCard
// ---------------------------------------------------------------------------

interface BenchmarkCardProps {
  loadingBenchmark: boolean;
  salaryBenchmark: SalaryBenchmark | null | undefined;
  baseSalary?: number;
}

export function BenchmarkCard({ loadingBenchmark, salaryBenchmark, baseSalary }: BenchmarkCardProps) {
  return (
    <Card data-testid="card-salary-benchmark">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4 text-[var(--ep-blue)]" />
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
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : salaryBenchmark ? (
          <BenchmarkContent salaryBenchmark={salaryBenchmark} baseSalary={baseSalary} />
        ) : (
          <p className="text-muted-foreground text-center py-6 text-sm">
            {t("benchmarkMalumotlariMavjudEmas")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BenchmarkContent({ salaryBenchmark, baseSalary }: { salaryBenchmark: SalaryBenchmark; baseSalary?: number }) {
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
              style={{ width: `${Math.round(((item.value as number) / maxVal) * 100)}%`, backgroundColor: item.color }}
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
}
