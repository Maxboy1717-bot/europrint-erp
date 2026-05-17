/**
 * @module PlanningBoardSections
 * @description Major section components for PlanningBoard:
 *   - PlanningBoardHeader  — page title bar + action buttons
 *   - PlanningFiltersCard  — filter inputs (papka, status, date range)
 *   - OperationsTableTab   — TabsContent for the "operations" tab
 */

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Plus, Filter, Calendar as CalendarIcon, Download, Pencil } from "lucide-react";
import type { PlanningOperation, PapkaOrder, Equipment, PlanningTranslationMap, PlanningFilters } from "./PlanningBoardTypes";
import { exportOperationsCSV } from "./PlanningBoardTypes";
import { EPPageHeader, EPLoader } from "@/components/ep";

// ---------------------------------------------------------------------------
// PlanningBoardHeader
// ---------------------------------------------------------------------------

interface PlanningBoardHeaderProps {
  t: PlanningTranslationMap & ((key: string) => string);
  lang: "uz" | "ru";
  operationsData: { operations?: PlanningOperation[]; items?: PlanningOperation[] } | undefined;
  onToggleLang: () => void;
  onExport: () => void;
  onAddOperation: () => void;
}

export function PlanningBoardHeader({
  t,
  lang,
  operationsData,
  onToggleLang,
  onExport,
  onAddOperation,
}: PlanningBoardHeaderProps) {
  const handleExport = () => {
    // exportOperationsCSV takes a permissive Record<string, unknown>[] shape;
    // PlanningOperation is a stricter subtype so we widen via unknown.
    exportOperationsCSV(operationsData as unknown as { operations?: Record<string, unknown>[]; items?: Record<string, unknown>[] } | undefined);
    onExport();
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CalendarIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <EPPageHeader
        breadcrumb={<><b className="text-foreground">{t.title}</b></>}
        title={t.title}
        subtitle={t.subtitle}
      />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none"
          onClick={onToggleLang}
          data-testid="button-lang-toggle"
        >
          {lang === "uz" ? "RU" : "UZ"}
        </Button>
        <Button
          variant="outline"
          className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none gap-2"
          onClick={handleExport}
          data-testid="button-export"
        >
          <Download className="h-4 w-4" />
          {t.exportExcel}
        </Button>
        <Button
          className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2"
          onClick={onAddOperation}
          data-testid="button-add-operation"
        >
          <Plus className="h-4 w-4" />
          {t.addOperation}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanningFiltersCard
// ---------------------------------------------------------------------------

interface PlanningFiltersCardProps {
  t: PlanningTranslationMap & ((key: string) => string);
  filters: PlanningFilters;
  onFiltersChange: (filters: PlanningFilters) => void;
}

export function PlanningFiltersCard({ t, filters, onFiltersChange }: PlanningFiltersCardProps) {
  return (
    <Card className="bg-card rounded-lg border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          {t.filters}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.papkaNo}
            </label>
            <Input
              placeholder={t.papkaNo}
              value={filters.papkaNo}
              onChange={(e) => onFiltersChange({ ...filters, papkaNo: e.target.value })}
              className="bg-muted/60 border-none"
              data-testid="input-filter-papka"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.status}
            </label>
            <Select
              value={filters.status}
              onValueChange={(val) => onFiltersChange({ ...filters, status: val })}
            >
              <SelectTrigger
                className="bg-muted/60 border-none h-9"
                data-testid="select-filter-status"
              >
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="planned">{t.planned}</SelectItem>
                <SelectItem value="in_progress">{t.inProgress}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.dateRange} (Start)
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              className="bg-muted/60 border-none"
              data-testid="input-filter-start-date"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.dateRange} (End)
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              className="bg-muted/60 border-none"
              data-testid="input-filter-end-date"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// OperationsTableTab
// ---------------------------------------------------------------------------

interface OperationsTableTabProps {
  t: PlanningTranslationMap & ((key: string) => string);
  isLoadingOps: boolean;
  operationsData: { items?: PlanningOperation[] } | undefined;
  papkaOrdersList: PapkaOrder[];
  equipmentList: Equipment[];
  onEdit: (op: PlanningOperation) => void;
}

export function OperationsTableTab({
  t,
  isLoadingOps,
  operationsData,
  papkaOrdersList,
  equipmentList,
  onEdit,
}: OperationsTableTabProps) {
  return (
    <TabsContent value="operations" className="space-y-4 mt-0">
      <Card className="bg-card rounded-lg border-none shadow-none">
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                {[t.papkaNo, t.operationNo, t.workCenter, t.plannedQty, t.plannedStart, t.plannedEnd, t.status].map((h) => (
                  <TableHead key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{h}</TableHead>
                ))}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOps ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[13px] text-muted-foreground">
                    <EPLoader className="w-6 h-6 mx-auto mr-2 inline" />
                    {t.loading}
                  </TableCell>
                </TableRow>
              ) : operationsData?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-[13px] text-muted-foreground">
                    {t.noData}
                  </TableCell>
                </TableRow>
              ) : (
                operationsData?.items?.map((op: PlanningOperation) => (
                  <TableRow key={op.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-operation-${op.id}`}>
                    <TableCell className="py-3 px-6 font-medium">
                      <Link href={`/papka-orders/${op.papkaOrderId}`}>
                        <a className="text-primary hover:underline" data-testid={`link-papka-${op.id}`}>
                          {(Array.isArray(papkaOrdersList) ? papkaOrdersList : []).find((p: PapkaOrder) => p.id === op.papkaOrderId)?.papkaNo || op.papkaOrderId}
                        </a>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{op.operationCode}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{(Array.isArray(equipmentList) ? equipmentList : []).find((e: Equipment) => e.id === op.equipmentId)?.name || "-"}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{op.plannedQuantity} {op.plannedUnit}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{op.plannedDate} {op.plannedStartTime}</TableCell>
                    <TableCell className="py-3 px-6 text-muted-foreground">{op.plannedEndTime}</TableCell>
                    <TableCell className="py-3 px-6">
                      <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", op.status === "completed" ? "bg-green-100 text-green-800" : op.status === "in_progress" ? "bg-amber-100 text-amber-800" : op.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary")}>
                        {(t as unknown as Record<string, string>)[op.status] || op.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(op)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted" data-testid={`button-edit-${op.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

