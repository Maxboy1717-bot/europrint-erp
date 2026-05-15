/**
 * @module MonthlyReportTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, AlertTriangle, BarChart3, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import { apiRequest } from "@/lib/queryClient";

import type { MonthlyReport, MonthlyReportTabProps } from "./MonthlyReportTabTypes";
import { UZ_MONTHS, MONTHS } from "./MonthlyReportTabTypes";
import { FullReportCard } from "./MonthlyReportTabSections";
import { useTranslation } from '@/lib/i18n';

export function MonthlyReportTab({ employeeId }: MonthlyReportTabProps) {
  const { t } = useTranslation("common");
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const { data: report, isLoading, isError } = useQuery<MonthlyReport>({
    queryKey: ["/api/employees", employeeId, "monthly-report", selectedMonth],
    queryFn: async () => {
      const res = (await apiRequest("GET", `/api/employees/${employeeId}/monthly-report?month=${selectedMonth}`)) as unknown as Response;
      if (!res.ok) throw new Error("Failed to fetch report");
      const json = await res.json();
      const inner = (json?.ok === true && json?.data != null) ? json.data : (json?.data ?? json);
      if (!inner || typeof inner !== "object" || !inner.employee) return null as unknown as MonthlyReport;
      if (!inner.attendance) inner.attendance = { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, sickDays: 0, attendanceRate: 0 };
      if (!inner.discipline) inner.discipline = { warnings: 0, penalties: 0, rewards: 0 };
      if (!inner.finance)    inner.finance    = { baseSalary: 0, totalBonus: 0, totalFines: 0, totalAdvances: 0, pendingAdvances: 0, netSalary: 0 };
      if (!Array.isArray(inner.inventory)) inner.inventory = [];
      return inner as MonthlyReport;
    },
    enabled: !!employeeId,
  });

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    if (!report) return;
    const r = report;
    const m = UZ_MONTHS[r.monthNum] || String(r.monthNum);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 20;

    const section = (title: string) => {
      y += 4;
      doc.setFillColor(245, 245, 250);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 2, y + 5);
      doc.setFont("helvetica", "normal");
      y += 10;
    };

    const row = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 55, y);
      y += 6;
    };

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("OYLIK SHAXSIY HISOBOT KARTASI", pageW / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${m} ${r.year}`, pageW / 2, y, { align: "center" });
    y += 10;
    doc.setDrawColor(200, 200, 210);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    section("XODIM MA'LUMOTLARI");
    row("Xodim:", r.employee.fullName || "-");
    row("Tabel raqami:", r.employee.employeeId || "-");
    row("Bo'lim:", r.employee.departmentName || "-");
    row("Lavozim:", r.employee.positionName || "-");

    section("DAVOMAT");
    row("Jami ish kunlari:", String(r.attendance.totalDays));
    row("Kelgan kunlar:", String(r.attendance.presentDays));
    row("Kelmagan kunlar:", String(r.attendance.absentDays));
    row("Kech kelgan:", String(r.attendance.lateDays));
    row("Kasal kunlar:", String(r.attendance.sickDays));
    row("Davomat foizi:", `${r.attendance.attendanceRate}%`);

    section("INTIZOM");
    row("Ogohlantirishlar:", String(r.discipline.warnings));
    row("Jarimalar:", String(r.discipline.penalties));
    row("Mukofotlar:", String(r.discipline.rewards));

    section("MOLIYA (so'm)");
    row("Asosiy maosh:", r.finance.baseSalary.toLocaleString());
    row("Mukofot:", `+${r.finance.totalBonus.toLocaleString()}`);
    row("Jarima:", `-${r.finance.totalFines.toLocaleString()}`);
    row("Avans (qolgan):", `-${r.finance.pendingAdvances.toLocaleString()}`);
    doc.setFont("helvetica", "bold");
    row("Sof maosh:", r.finance.netSalary.toLocaleString());
    doc.setFont("helvetica", "normal");

    section("KORPORATIV INVENTAR (faol)");
    if (r.inventory.length === 0) {
      doc.setFontSize(9);
      doc.text("Faol inventar yo'q", margin, y);
      y += 6;
    } else {
      (Array.isArray(r.inventory) ? r.inventory : []).forEach((item) => {
        doc.setFontSize(9);
        doc.text(`- ${item.deviceName} (${item.deviceTypeLabel || item.deviceType})  S/N: ${item.serialNumber || "-"}`, margin, y);
        y += 6;
      });
    }

    y += 6;
    doc.setDrawColor(200, 200, 210);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Yaratilgan: ${new Date(r.generatedAt).toLocaleString("uz-UZ")}  |  EuroPrint ERP tizimi`, margin, y);

    doc.save(`${r.employee.fullName}_${selectedMonth}_hisobot.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("oylikShaxsiyHisobotKartasi")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Barcha ko'rsatkichlar: davomat, KPI, jarima/mukofot, qarz, inventar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 h-9" data-testid="select-report-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(MONTHS) ? MONTHS : []).map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={!report} data-testid="button-download-report">
            <Download className="h-4 w-4 mr-2" />
            {t("download")}
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} disabled={!report} data-testid="button-print-report">
            <Printer className="h-4 w-4 mr-2" />
            {t("print1")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {([1, 2, 3, 4]).map((i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-yellow)]" />
            {t("hisobotniYuklashdaXatolikYuzBerdi")}
          </CardContent>
        </Card>
      ) : report?.employee ? (
        <FullReportCard report={report} />
      ) : null}
    </div>
  );
}
