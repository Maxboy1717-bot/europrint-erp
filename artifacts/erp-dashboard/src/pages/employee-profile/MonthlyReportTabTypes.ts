/**
 * @module MonthlyReportTabTypes
 * @description Type definitions and constants for MonthlyReportTab.
 */

export interface MonthlyReport {
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
  inventory: {
    id: number;
    deviceName: string;
    deviceType?: string;
    deviceTypeLabel?: string;
    serialNumber?: string;
  }[];
  generatedAt: string;
}

export interface MonthlyReportTabProps {
  employeeId: string;
}

export const UZ_MONTHS: Record<number, string> = {
  1: "Yanvar",  2: "Fevral",  3: "Mart",     4: "Aprel",
  5: "May",     6: "Iyun",    7: "Iyul",      8: "Avgust",
  9: "Sentabr", 10: "Oktabr", 11: "Noyabr",  12: "Dekabr",
};

export function getLastMonths(count: number): { value: string; label: string }[] {
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

export const MONTHS = getLastMonths(12);
