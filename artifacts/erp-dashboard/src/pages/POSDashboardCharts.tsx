/**
 * @module POSDashboardCharts
 * @description Chart components and the daily sales table displayed in the
 * Reports tab of the POS Dashboard. Depends on recharts and shadcn/ui.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTranslation } from '@/lib/i18n';
import {
  formatUZS,
  type DailyData,
  type MonthlySummaryRow,
  type PaymentMethodRow,
} from "./POSDashboardTypes";

// ---------------------------------------------------------------------------
// Helpers — transform raw API rows into recharts data
// ---------------------------------------------------------------------------

export function buildMonthlyChartData(rows: MonthlySummaryRow[] | undefined) {
  const { t } = useTranslation("common");
  return (Array.isArray(rows) ? rows : []).map(row => ({
    day: new Date(row.day).toLocaleDateString("uz-UZ", {
      month: "short",
      day: "numeric",
    }),
    total: Number(row.total),
    count: Number(row.sale_count),
  }));
}

export function buildPaymentChartData(rows: PaymentMethodRow[] | undefined) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    method:
      row.payment_method === "cash"
        ? "Naqd"
        : row.payment_method === "card"
        ? "Karta"
        : "O'tkazma",
    total: Number(row.total),
    count: Number(row.count),
  }));
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface MonthlyChartCardProps {
  rows: MonthlySummaryRow[] | undefined;
}

/** 30-day bar chart of daily revenue. */
export function MonthlyChartCard({ rows }: MonthlyChartCardProps) {
  const data = buildMonthlyChartData(rows);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">30 kunlik sotuv grafigi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => (v / 1_000_000).toFixed(1) + "M"}
            />
            <Tooltip formatter={(v: number) => formatUZS(v)} />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface PaymentChartCardProps {
  rows: PaymentMethodRow[] | undefined;
}

/** Horizontal bar chart showing revenue broken down by payment method. */
export function PaymentChartCard({ rows }: PaymentChartCardProps) {
  const data = buildPaymentChartData(rows);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("tolovUsullariBoyicha")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => (v / 1_000_000).toFixed(1) + "M"}
            />
            <YAxis
              dataKey="method"
              type="category"
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip formatter={(v: number) => formatUZS(v)} />
            <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DailySalesTableProps {
  daily: DailyData | undefined;
}

/** Table listing every sale that occurred today. */
export function DailySalesTable({ daily }: DailySalesTableProps) {
  const sales = Array.isArray(daily?.sales) ? daily!.sales : [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("bugungiSotuvlarRoyxati")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("raqam")}</TableHead>
              <TableHead>{t("kassir")}</TableHead>
              <TableHead>{t("mijoz1")}</TableHead>
              <TableHead>{t("tolov1")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-400 py-8"
                >
                  {t("bugunSotuvYoq")}
                </TableCell>
              </TableRow>
            ) : (
              sales.map(sale => (
                <TableRow key={sale.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm">
                    {sale.sale_number}
                  </TableCell>
                  <TableCell>{sale.cashier_name ?? "—"}</TableCell>
                  <TableCell>{sale.customer_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.payment_method}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatUZS(Number(sale.total))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
