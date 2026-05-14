/**
 * @module ERPDailyReportsTypes
 * @description Types, interfaces and Zod schema for ERPDailyReports.
 */

import { z } from "zod";

export interface DailyReport {
  id: string;
  reportDate: string;
  userId: string | null;
  userName: string | null;
  shift: string | null;
  workCenterId: string | null;
  workCenterName: string | null;
  productionOrderId: string | null;
  orderNumber: string | null;
  planQty: number;
  factQty: number;
  scrapQty: number;
  downtimeMinutes: number;
  downtimeReasonCode: string | null;
  comment: string | null;
  createdAt: string;
}

export const dailyReportFormSchema = z.object({
  reportDate: z.string().min(1, "Sanani kiriting"),
  userId: z.string().min(1, "Xodimni tanlang"),
  shift: z.string().min(1, "Smenani tanlang"),
  workCenterId: z.string().min(1, "Ish markazini tanlang"),
  productionOrderId: z.string().min(1, "Buyurtmani tanlang"),
  planQty: z.number().min(0, "Reja miqdori 0 dan kam bo'lmasligi kerak"),
  factQty: z.number().min(0, "Fakt miqdori 0 dan kam bo'lmasligi kerak"),
  scrapQty: z.number().min(0, "Brak miqdori 0 dan kam bo'lmasligi kerak"),
  downtimeMinutes: z.number().min(0, "To'xtash vaqti 0 dan kam bo'lmasligi kerak"),
  downtimeReasonCode: z.string().max(200, "To'xtash sababi 200 belgidan oshmasligi kerak"),
  comment: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

export type DailyReportFormValues = z.infer<typeof dailyReportFormSchema>;

export const defaultDailyReportValues: DailyReportFormValues = {
  reportDate: new Date().toISOString().split("T")[0],
  userId: "",
  shift: "1-smena",
  workCenterId: "",
  productionOrderId: "",
  planQty: 0,
  factQty: 0,
  scrapQty: 0,
  downtimeMinutes: 0,
  downtimeReasonCode: "",
  comment: "",
};

export function getPerformanceColor(plan: number, fact: number): string {
  if (fact === 0) return "text-muted-foreground";
  const percentage = (fact / plan) * 100;
  if (percentage >= 100) return "text-[var(--ep-green)]";
  if (percentage >= 80) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-red)]";
}
