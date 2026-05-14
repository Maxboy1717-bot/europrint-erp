/**
 * @module PosReports
 * @description React UI component.
 */

import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, DollarSign, Package, AlertTriangle } from "lucide-react";
import { DashboardData } from "./types";

interface PosReportsProps {
  dashboard: DashboardData;
}

export function PosReports({ dashboard }: PosReportsProps) {
  const { t } = useTranslation('finance');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("bugunSavdo")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.salesToday)}</div>
            <p className="text-xs text-muted-foreground">{dashboard.transactionsToday} ta tranzaksiya</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("ortachaChek")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard.avgBasket)}</div>
            <p className="text-xs text-muted-foreground">{t("ortachaXaridSummasi")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("topMahsulotlar")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.topProducts.length}</div>
            <p className="text-xs text-muted-foreground">{t("engKopSotilgan")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("kamQolganlar")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboard.lowStockCount}</div>
            <p className="text-xs text-muted-foreground text-destructive">{t("zaxiradaKamQolgan")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("tolovTurlariBoyicha")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tur")}</TableHead>
                  <TableHead className="text-center">{t("count")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(dashboard.paymentBreakdown) ? dashboard.paymentBreakdown : []).map((pb) => (
                  <TableRow key={pb.method} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="capitalize">{pb.method}</TableCell>
                    <TableCell className="text-center">{pb.count}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(pb.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("top5Mahsulot")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Mahsulot")}</TableHead>
                  <TableHead className="text-center">{t("count")}</TableHead>
                  <TableHead className="text-right">{t("tushum")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.topProducts.slice(0, 5).map((p, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="text-xs">
                        <span className="block font-medium truncate max-w-[150px]">{p.name}</span>
                        <span className="text-muted-foreground font-mono">{p.barcode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{p.totalSold}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.totalRevenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">Umumiy savdo (barcha vaqt)</p>
              <p className="text-lg font-bold">{formatCurrency(dashboard.totalSalesAll)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("umumiyTranzaksiyalar")}</p>
              <p className="text-lg font-bold">{dashboard.totalTransactionsAll}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
