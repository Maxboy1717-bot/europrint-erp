/**
 * @module ERPDailyReportsSections
 * @description Section UI components for ERPDailyReports page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter, Pencil, Trash2 } from "lucide-react";
import { PageState } from "@/components/ui/page-state";
import type { DailyReport } from "./ERPDailyReportsTypes";
import { getPerformanceColor } from "./ERPDailyReportsTypes";
import { useTranslation } from '@/lib/i18n';

interface FilterState {
  startDate: string;
  endDate: string;
  shift: string;
}

interface FiltersCardProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FiltersCard({ filters, onFiltersChange }: FiltersCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t("filtrlar")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate">{t("startDate")}</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              data-testid="input-filter-start-date"
            />
          </div>
          <div>
            <Label htmlFor="endDate">{t("endDate")}</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              data-testid="input-filter-end-date"
            />
          </div>
          <div>
            <Label htmlFor="filterShift">{t("smena")}</Label>
            <Select
              value={filters.shift || "all"}
              onValueChange={(value) => onFiltersChange({ ...filters, shift: value === "all" ? "" : value })}
            >
              <SelectTrigger id="filterShift" data-testid="select-filter-shift" className="h-9">
                <SelectValue placeholder={t("barchaSmenalar")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("barchaSmenalar")}</SelectItem>
                <SelectItem value="1-smena">1-smena</SelectItem>
                <SelectItem value="2-smena">2-smena</SelectItem>
                <SelectItem value="3-smena">3-smena</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportsTableCardProps {
  reports: DailyReport[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: string) => void;
}

export function ReportsTableCard({ reports, isLoading, isError, onRetry, onEdit, onDelete }: ReportsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hisobotlar ro'yxati ({reports.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <PageState
          isLoading={isLoading}
          isError={isError}
          isEmpty={reports.length === 0}
          onRetry={onRetry}
          skeleton="table"
          skeletonRows={5}
          skeletonColumns={9}
          errorTitle="Hisobotlar yuklanmadi"
          errorMessage="Server bilan bog'lanishda xatolik. Qayta urinib ko'ring."
          emptyIcon={Filter}
          emptyTitle="Hisobotlar topilmadi"
          emptyDescription="Filtrni o'zgartiring yoki yangi hisobot qo'shing."
        >
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("smena")}</TableHead>
                <TableHead>{t("xodim1")}</TableHead>
                <TableHead>{t("ishMarkazi")}</TableHead>
                <TableHead>{t("Buyurtma")}</TableHead>
                <TableHead className="text-right">{t("reja")}</TableHead>
                <TableHead className="text-right">{t("fakt")}</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">{t("Brak")}</TableHead>
                <TableHead className="text-right">{t("toxtash")}</TableHead>
                <TableHead className="text-center">{t("Amallar")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(reports) ? reports : []).map((report) => {
                const percentage = report.planQty > 0 ? (report.factQty / report.planQty * 100).toFixed(1) : "0";
                return (
                  <TableRow key={report.id} data-testid={`row-report-${report.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{report.reportDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.shift}</Badge>
                    </TableCell>
                    <TableCell>{report.userName || "-"}</TableCell>
                    <TableCell>{report.workCenterName || "-"}</TableCell>
                    <TableCell>{report.orderNumber || "-"}</TableCell>
                    <TableCell className="text-right">{report.planQty}</TableCell>
                    <TableCell className="text-right font-semibold">{report.factQty}</TableCell>
                    <TableCell className={`text-right font-bold ${getPerformanceColor(report.planQty, report.factQty)}`}>
                      {percentage}%
                    </TableCell>
                    <TableCell className="text-right text-[var(--ep-red)]">{report.scrapQty}</TableCell>
                    <TableCell className="text-right">{report.downtimeMinutes} daq</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(report)}
                          data-testid={`button-edit-${report.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(report.id)}
                          data-testid={`button-delete-${report.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        </PageState>
      </CardContent>
    </Card>
  );
}
