import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Download, Calendar, Users, CheckCircle, AlertTriangle, TrendingUp,
  DollarSign, Award, Laptop, Clock, BarChart3, Printer
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";

function getLastMonths(count: number) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("uz-UZ", { year: "numeric", month: "long" });
    months.push({ value, label });
  }
  return months;
}

const MONTHS = getLastMonths(12);

const UZ_MONTHS: Record<number, string> = {
  1: "Yanvar", 2: "Fevral", 3: "Mart", 4: "Aprel", 5: "May", 6: "Iyun",
  7: "Iyul", 8: "Avgust", 9: "Sentabr", 10: "Oktabr", 11: "Noyabr", 12: "Dekabr"
};

interface MonthlyReport {
  employee: {
    id: string;
    fullName: string;
    employeeId: string;
    departmentName?: string;
    positionName?: string;
  };
  month: string;
  year: number;
  monthNum: number;
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    sickDays: number;
    attendanceRate: number;
  };
  discipline: {
    warnings: number;
    penalties: number;
    rewards: number;
  };
  finance: {
    baseSalary: number;
    totalBonus: number;
    totalFines: number;
    totalAdvances: number;
    pendingAdvances: number;
    netSalary: number;
  };
  inventory: { id: number; deviceName: string; deviceType?: string; deviceTypeLabel?: string; serialNumber?: string }[];
  generatedAt: string;
}

interface MonthlyReportTabProps {
  employeeId: string;
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
      </div>
      <p className="text-2xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

export function MonthlyReportTab({ employeeId }: MonthlyReportTabProps) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const { data: report, isLoading, isError } = useQuery<MonthlyReport>({
    queryKey: ["/api/employees", employeeId, "monthly-report", selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/monthly-report?month=${selectedMonth}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !!employeeId,
  });

  const handlePrint = () => {
    window.print();
  };

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
      r.inventory?.forEach((item) => {
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
          <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Oylik Shaxsiy Hisobot Kartasi
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Barcha ko'rsatkichlar: davomat, KPI, jarima/mukofot, qarz, inventar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48" data-testid="select-report-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(MONTHS) ? MONTHS : []).map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={!report} data-testid="button-download-report">
            <Download className="h-4 w-4 mr-2" />
            Yuklab olish
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrint} disabled={!report} data-testid="button-print-report">
            <Printer className="h-4 w-4 mr-2" />
            Chop etish
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([1, 2, 3, 4]).map(i => <Skeleton key={`k-${i}`} className="h-24" />)}
          </div>
          <Skeleton className="h-48" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-on-surface-variant">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            Hisobotni yuklashda xatolik yuz berdi
          </CardContent>
        </Card>
      ) : report ? (
        <>
          <Card className="border border-outline-variant" data-testid="card-monthly-report">
            <CardHeader className="pb-3 border-b border-outline-variant">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    {report.employee.fullName}
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {report.employee.departmentName} · {report.employee.positionName} · {UZ_MONTHS[report.monthNum]} {report.year}
                  </CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-none">
                  <Calendar className="h-3 w-3 mr-1" />
                  {UZ_MONTHS[report.monthNum]} {report.year}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Davomat
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <MetricCard label="Jami kunlar" value={report.attendance.totalDays} icon={Calendar} color="text-blue-500" />
                  <MetricCard label="Kelgan" value={report.attendance.presentDays} icon={CheckCircle} color="text-green-500" />
                  <MetricCard label="Kelmagan" value={report.attendance.absentDays} icon={AlertTriangle} color="text-red-500" />
                  <MetricCard label="Kech kelgan" value={report.attendance.lateDays} icon={Clock} color="text-amber-500" />
                  <MetricCard
                    label="Davomat %"
                    value={`${report.attendance.attendanceRate}%`}
                    icon={TrendingUp}
                    color={report.attendance.attendanceRate >= 90 ? "text-green-500" : report.attendance.attendanceRate >= 75 ? "text-amber-500" : "text-red-500"}
                  />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                    <span>Davomat darajasi</span>
                    <span className="font-semibold">{report.attendance.attendanceRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        report.attendance.attendanceRate >= 90 ? "bg-green-500" :
                        report.attendance.attendanceRate >= 75 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(report.attendance.attendanceRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Intizom ko'rsatkichlari
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Ogohlantirishlar</p>
                    <p className="text-2xl font-bold text-amber-800 mt-1">{report.discipline.warnings}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Jarimalar</p>
                    <p className="text-2xl font-bold text-red-800 mt-1">{report.discipline.penalties}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Mukofotlar</p>
                    <p className="text-2xl font-bold text-green-800 mt-1">{report.discipline.rewards}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Moliyaviy holat
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ko'rsatkich</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm">Asosiy maosh</TableCell>
                      <TableCell className="text-right font-medium">{report.finance.baseSalary.toLocaleString()} so'm</TableCell>
                    </TableRow>
                    {report.finance.totalBonus > 0 && (
                      <TableRow>
                        <TableCell className="text-sm text-green-700">+ Mukofot</TableCell>
                        <TableCell className="text-right font-medium text-green-700">+{report.finance.totalBonus.toLocaleString()} so'm</TableCell>
                      </TableRow>
                    )}
                    {report.finance.totalFines > 0 && (
                      <TableRow>
                        <TableCell className="text-sm text-red-700">- Jarima/chegirma</TableCell>
                        <TableCell className="text-right font-medium text-red-700">-{report.finance.totalFines.toLocaleString()} so'm</TableCell>
                      </TableRow>
                    )}
                    {report.finance.pendingAdvances > 0 && (
                      <TableRow>
                        <TableCell className="text-sm text-orange-700">- Avans (to'lanmagan)</TableCell>
                        <TableCell className="text-right font-medium text-orange-700">-{report.finance.pendingAdvances.toLocaleString()} so'm</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="border-t-2 border-outline">
                      <TableCell className="font-bold">Sof maosh (taxminiy)</TableCell>
                      <TableCell className={`text-right font-bold ${report.finance.netSalary >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {report.finance.netSalary.toLocaleString()} so'm
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-slate-500" />
                  Korporativ inventar (faol)
                </h3>
                {report.inventory.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-4">Faol inventar yo'q</p>
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

              <p className="text-xs text-on-surface-variant text-right">
                Yaratilgan: {new Date(report.generatedAt).toLocaleString("uz-UZ")}
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
