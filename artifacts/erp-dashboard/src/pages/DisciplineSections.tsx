/**
 * @module DisciplineSections
 * @description Stats cards, action buttons, and records table for Discipline.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import {
  AlertTriangle, Award, FileText, DollarSign, Search,
  User, TrendingUp, TrendingDown, History,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { User as UserType } from "@shared/schema";
import type { DisciplineWithUser, DialogType } from "./DisciplineTypes";
import { useTranslation } from "@/lib/i18n";

// ─── StatsCards ───────────────────────────────────────────────────────────────

interface DisciplineStatsProps {
  warningsCount: number;
  penaltiesSum: number;
  rewardsSum: number;
  tCommon: (key: string) => string;
  t: (key: string) => string;
}

export function DisciplineStats({ warningsCount, penaltiesSum, rewardsSum, tCommon, t, }: DisciplineStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-card rounded-lg p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {tCommon("warning")}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-warnings-count">
            {warningsCount}
          </p>
          <AlertTriangle className="h-8 w-8 text-[var(--ep-yellow)] opacity-20" />
        </div>
      </div>
      <div className="bg-card rounded-lg p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("fine")}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-penalties-sum">
            {penaltiesSum.toLocaleString()}
          </p>
          <TrendingDown className="h-8 w-8 text-[var(--ep-red)] opacity-20" />
        </div>
      </div>
      <div className="bg-card rounded-lg p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("reward")}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-rewards-sum">
            {rewardsSum.toLocaleString()}
          </p>
          <TrendingUp className="h-8 w-8 text-[var(--ep-green)] opacity-20" />
        </div>
      </div>
    </div>
  );
}

// ─── ActionButtons ────────────────────────────────────────────────────────────

interface ActionButtonsProps {
  onOpenDialog: (type: DialogType) => void;
  tCommon: (key: string) => string;
  t: (key: string) => string;
}

export function ActionButtons({ onOpenDialog, tCommon, t }: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        onClick={() => onOpenDialog("warning")}
        className="bg-[var(--ep-yellow)] hover:bg-[var(--ep-yellow)]/90 text-white"
        data-testid="button-add-warning"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        {tCommon("warning")}
      </Button>
      <Button
        onClick={() => onOpenDialog("penalty")}
        className="bg-[var(--ep-red)] hover:bg-[var(--ep-red)]/90 text-white"
        data-testid="button-add-penalty"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        {t("fine")}
      </Button>
      <Button
        onClick={() => onOpenDialog("reward")}
        className="bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
        data-testid="button-add-reward"
      >
        <Award className="h-4 w-4 mr-2" />
        {t("reward")}
      </Button>
      <Button
        onClick={() => onOpenDialog("act")}
        variant="outline"
        data-testid="button-add-act"
      >
        <FileText className="h-4 w-4 mr-2" />
        {t("documents")}
      </Button>
    </div>
  );
}

// ─── RecordsTable ─────────────────────────────────────────────────────────────

interface RecordsTableProps {
  filteredRecords: DisciplineWithUser[];
  employees: UserType[];
  recordsLoading: boolean;
  activeTab: string;
  searchQuery: string;
  onTabChange: (tab: string) => void;
  onSearchChange: (q: string) => void;
  onShowHistory: (userId: string) => void;
  getTypeBadge: (type: string) => React.ReactNode;
  getTypeIcon: (type: string) => React.ReactNode;
  finalLabel: string;
  writtenLabel: string;
  sumLabel: string;
  tCommon: (key: string) => string;
  t: (key: string) => string;
}

export function RecordsTable({
  filteredRecords, employees, recordsLoading,
  activeTab, searchQuery,
  onTabChange, onSearchChange, onShowHistory,
  getTypeBadge, getTypeIcon,
  finalLabel, writtenLabel, sumLabel,
  tCommon, t,
}: RecordsTableProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">{tCommon("reports")}</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t("employees")} ${tCommon("search").toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      {recordsLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="bg-muted/40 mb-4">
            <TabsTrigger value="all"     data-testid="tab-all">{tCommon("all")}</TabsTrigger>
            <TabsTrigger value="warning" data-testid="tab-warnings">{tCommon("warning")}</TabsTrigger>
            <TabsTrigger value="penalty" data-testid="tab-penalties">{t("fine")}</TabsTrigger>
            <TabsTrigger value="reward"  data-testid="tab-rewards">{t("reward")}</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    {[tCommon("date"), t("employees"), tCommon("type"), tCommon("amount"), tCommon("description"), ""].map((h, i) => (
                      <TableHead
                        key={i}
                        className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {tCommon("noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (Array.isArray(filteredRecords) ? filteredRecords : []).map((record) => {
                      const employee = (Array.isArray(employees) ? employees : []).find(
                        (e) => e.id === record.userId,
                      );
                      let rowClass = "hover:bg-muted/40 transition-colors";
                      if (record.type === "warning") {
                        if (record.reason.includes(finalLabel)) {
                          rowClass = "bg-red-50 border-l-4 border-error hover:bg-red-100 transition-colors";
                        } else if (record.reason.includes(writtenLabel)) {
                          rowClass = "bg-amber-50 border-l-4 border-amber-500 hover:bg-amber-100 transition-colors";
                        }
                      }
                      return (
                        <TableRow
                          key={record.id}
                          data-testid={`row-record-${record.id}`}
                          className={rowClass}
                        >
                          <TableCell className="px-6 py-4">{formatDate(record.createdAt)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{employee?.fullName || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(record.type)}
                              {getTypeBadge(record.type)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {record.amount ? (
                              <span className={record.type === "penalty" ? "text-[var(--ep-red)] font-semibold" : "text-[var(--ep-green)] font-semibold"}>
                                {record.type === "penalty" ? "-" : "+"}{record.amount.toLocaleString()} {sumLabel}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 max-w-xs truncate text-muted-foreground">
                            {record.reason}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onShowHistory(record.userId)}
                              data-testid={`button-history-${record.id}`}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table></div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
