/**
 * @module MonthlyReportTabSections
 * @description Section UI components for MonthlyReportTab.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Calendar, Award, DollarSign, Laptop,
  CheckCircle, AlertTriangle, TrendingUp, Clock,
} from "lucide-react";
import type { MonthlyReport } from "./MonthlyReportTabTypes";
import { UZ_MONTHS } from "./MonthlyReportTabTypes";
import { useTranslation } from '@/lib/i18n';

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card rounded-lg p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ── ReportCardHeader ──────────────────────────────────────────────────────────

export function ReportCardHeader({ report }: { report: MonthlyReport }) {
  return (
    <CardHeader className="pb-3 border-b border-border">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            {report.employee.fullName}
          </CardTitle>
          <CardDescription className="mt-0.5">
            {report.employee.departmentName} · {report.employee.positionName} ·{" "}
            {UZ_MONTHS[report.monthNum]} {report.year}
          </CardDescription>
        </div>
        <Badge className="bg-primary/10 text-primary border-none">
          <Calendar className="h-3 w-3 mr-1" />
          {UZ_MONTHS[report.monthNum]} {report.year}
        </Badge>
      </div>
    </CardHeader>
  );
}

// ── AttendanceSection ─────────────────────────────────────────────────────────

export function AttendanceSection({ report }: { report: MonthlyReport }) {
  const { t } = useTranslation("common");
  const { attendance } = report;
  const rateColor =
    attendance.attendanceRate >= 90
      ? "text-[var(--ep-green)]"
      : attendance.attendanceRate >= 75
      ? "text-[var(--ep-yellow)]"
      : "text-[var(--ep-red)]";
  const barColor =
    attendance.attendanceRate >= 90
      ? "bg-green-500"
      : attendance.attendanceRate >= 75
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-[var(--ep-blue)]" />
        {t("davomat")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label={t("jamiKunlar")}  value={attendance.totalDays}   icon={Calendar}       color="text-[var(--ep-blue)]" />
        <MetricCard label={t("kelgan")}        value={attendance.presentDays}  icon={CheckCircle}    color="text-[var(--ep-green)]" />
        <MetricCard label={t("kelmagan")}      value={attendance.absentDays}   icon={AlertTriangle}  color="text-[var(--ep-red)]" />
        <MetricCard label={t("kechKelgan")}   value={attendance.lateDays}     icon={Clock}          color="text-[var(--ep-yellow)]" />
        <MetricCard label={t("davomat1")}     value={`${attendance.attendanceRate}%`} icon={TrendingUp} color={rateColor} />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{t("davomatDarajasi")}</span>
          <span className="font-semibold">{attendance.attendanceRate}%</span>
        </div>
        <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(attendance.attendanceRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── DisciplineSection ─────────────────────────────────────────────────────────

export function DisciplineSection({ report }: { report: MonthlyReport }) {
  const { t } = useTranslation("common");
  const { discipline } = report;
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Award className="h-4 w-4 text-[var(--ep-yellow)]" />
        {t("intizomKorsatkichlari")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-[var(--ep-yellow)] uppercase tracking-wider">{t("ogohlantirishlar")}</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{discipline.warnings}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-[var(--ep-red)] uppercase tracking-wider">{t("jarimalar")}</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{discipline.penalties}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-[var(--ep-green)] uppercase tracking-wider">{t("mukofotlar")}</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{discipline.rewards}</p>
        </div>
      </div>
    </div>
  );
}

// ── FinanceSection ────────────────────────────────────────────────────────────

export function FinanceSection({ report }: { report: MonthlyReport }) {
  const { t } = useTranslation("common");
  const { finance } = report;
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <DollarSign className="h-4 w-4 text-[var(--ep-green)]" />
        {t("moliyaviyHolat")}
      </h3>
      <div className="ep-table-scroll"><Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("korsatkich")}</TableHead>
            <TableHead className="text-right">{t("summa")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-sm">{t("asosiyMaosh1")}</TableCell>
            <TableCell className="text-right font-medium">{finance.baseSalary.toLocaleString()} so'm</TableCell>
          </TableRow>
          {finance.totalBonus > 0 && (
            <TableRow>
              <TableCell className="text-sm text-[var(--ep-green)]">{t("mukofot1")}</TableCell>
              <TableCell className="text-right font-medium text-[var(--ep-green)]">+{finance.totalBonus.toLocaleString()} so'm</TableCell>
            </TableRow>
          )}
          {finance.totalFines > 0 && (
            <TableRow>
              <TableCell className="text-sm text-[var(--ep-red)]">{t("jarimaChegirma")}</TableCell>
              <TableCell className="text-right font-medium text-[var(--ep-red)]">-{finance.totalFines.toLocaleString()} so'm</TableCell>
            </TableRow>
          )}
          {finance.pendingAdvances > 0 && (
            <TableRow>
              <TableCell className="text-sm text-[var(--ep-primary)]">{t("avansToLanmagan")}</TableCell>
              <TableCell className="text-right font-medium text-[var(--ep-primary)]">-{finance.pendingAdvances.toLocaleString()} so'm</TableCell>
            </TableRow>
          )}
          <TableRow className="border-t-2 border-border hover:bg-muted/40 transition-colors">
            <TableCell className="font-bold">{t("sofMaoshTaxminiy")}</TableCell>
            <TableCell className={`text-right font-bold ${finance.netSalary >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
              {finance.netSalary.toLocaleString()} so'm
            </TableCell>
          </TableRow>
        </TableBody>
      </Table></div>
    </div>
  );
}

// ── InventorySection ──────────────────────────────────────────────────────────

export function InventorySection({ report }: { report: MonthlyReport }) {
  const { t } = useTranslation("common");
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <Laptop className="h-4 w-4 text-slate-500" />
        Korporativ inventar (faol)
      </h3>
      {report.inventory.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("faolInventarYoq")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(report.inventory) ? report.inventory : []).map((item) => (
            <Badge key={item.id} variant="outline" className="text-xs gap-1.5">
              <Laptop className="h-3 w-3" />
              {item.deviceName}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FullReportCard ────────────────────────────────────────────────────────────

export function FullReportCard({ report }: { report: MonthlyReport }) {
  return (
    <Card className="border border-border" data-testid="card-monthly-report">
      <ReportCardHeader report={report} />
      <CardContent className="pt-4 space-y-6">
        <AttendanceSection report={report} />
        <DisciplineSection report={report} />
        <FinanceSection report={report} />
        <InventorySection report={report} />
        <p className="text-xs text-muted-foreground text-right">
          Yaratilgan: {new Date(report.generatedAt).toLocaleString("uz-UZ")}
        </p>
      </CardContent>
    </Card>
  );
}
