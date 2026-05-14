/**
 * @module DailyReportPageDialogs
 * @description HR admin panels: department filter, submitted/missing columns, all-reports list.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, XCircle, AlertCircle, Wrench, Gauge } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DailyReportEmployee, DeptItem, ReportType } from "./DailyReportPageTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ── DeptFilterBar ────────────────────────────────────────────────────────────
interface DeptFilterBarProps {
  selectedDept: string;
  reportType: ReportType;
  deptList: DeptItem[];
  today: string;
  onDeptChange: (v: string) => void;
  onTypeChange: (v: ReportType) => void;
}

export function DeptFilterBar({
  selectedDept,
  reportType,
  deptList,
  today,
  onDeptChange,
  onTypeChange,
}: DeptFilterBarProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={selectedDept} onValueChange={v => onDeptChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-56 bg-input border-border h-9" data-testid="select-dept-filter">
          <SelectValue placeholder={t("bolimniTanlang1")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("barchaBolimlar")}</SelectItem>
          {(Array.isArray(deptList) ? deptList : []).map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedDept && (
        <div
          className="flex items-center gap-1 bg-muted border border-border rounded-lg p-1"
          data-testid="filter-report-type"
        >
          {(["all", "operator", "office"] as const).map(tp => (
            <button
              key={tp}
              onClick={() => onTypeChange(tp)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                reportType === tp
                  ? tp === "operator"
                    ? "bg-[var(--ep-blue)] text-white"
                    : tp === "office"
                    ? "bg-[var(--ep-purple)] text-white"
                    : "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`filter-${tp}`}
            >
              {tp === "operator" && <Wrench className="w-3 h-3" />}
              {tp === "all" ? "Barchasi" : tp === "operator" ? "Operator hisobotlari" : "Ofis hisobotlari"}
            </button>
          ))}
        </div>
      )}
      <div className="text-sm text-muted-foreground">Bugun: {today}</div>
    </div>
  );
}

// ── DeptReportColumns ────────────────────────────────────────────────────────
interface DeptReportColumnsProps {
  submittedList: DailyReportEmployee[];
  missingList: DailyReportEmployee[];
  overrideId: number | null;
  overrideReason: string;
  isOverridePending: boolean;
  onSetOverrideId: (id: number | null) => void;
  onSetOverrideReason: (reason: string) => void;
  onOverride: (id: number) => void;
}

export function DeptReportColumns({
  submittedList,
  missingList,
  overrideId,
  overrideReason,
  isOverridePending,
  onSetOverrideId,
  onSetOverrideReason,
  onOverride,
}: DeptReportColumnsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2 text-base">
            <CheckCircle className="w-4 h-4" /> Topshirilgan ({submittedList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {(Array.isArray(submittedList) ? submittedList : []).map((r) => (
            <div key={r.id} className="p-3 bg-green-900/10 border border-green-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground text-sm">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-muted-foreground">{r.employee_code}</div>
                </div>
                <div className="text-right">
                  {r.submitted_at && (
                    <div className="text-xs text-muted-foreground">{new Date(r.submitted_at).toLocaleTimeString()}</div>
                  )}
                  <Badge className="bg-green-800 text-white text-xs mt-1">{t("topshirildi")}</Badge>
                </div>
              </div>
              {r.tasks_completed && (
                <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{r.tasks_completed}</p>
              )}
              {overrideId === r.id ? (
                <div className="mt-3 space-y-2">
                  <Input
                    value={overrideReason}
                    onChange={e => onSetOverrideReason(e.target.value)}
                    placeholder="Sabab (majburiy)..."
                    className="bg-input border-border text-xs h-7"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-6 text-xs bg-red-700 hover:bg-red-800"
                      disabled={!overrideReason || isOverridePending}
                      onClick={() => onOverride(r.id)}
                    >
                      {t("yoqlikDebBelgilash")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs text-muted-foreground"
                      onClick={() => { onSetOverrideId(null); onSetOverrideReason(""); }}
                    >
                      {t("Bekor")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-6 text-xs text-muted-foreground hover:text-foreground p-0"
                  onClick={() => onSetOverrideId(r.id)}
                >
                  <AlertCircle className="w-3 h-3 mr-1" /> HR override
                </Button>
              )}
            </div>
          ))}
          {submittedList.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">{t("haliHechKimTopshirmagan")}</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2 text-base">
            <XCircle className="w-4 h-4" /> Topshirmagan ({missingList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {(Array.isArray(missingList) ? missingList : []).map((e) => (
            <div key={e.id} className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground text-sm">{e.first_name} {e.last_name}</div>
                <div className="text-xs text-muted-foreground">{e.employee_code}</div>
              </div>
              <div className="flex items-center gap-2">
                {e.is_machine_operator && (
                  <Badge className="bg-blue-800 text-white text-xs">{t("Operator")}</Badge>
                )}
                <Badge className="bg-red-800/60 text-red-300 text-xs">{t("topshirmagan")}</Badge>
              </div>
            </div>
          ))}
          {missingList.length === 0 && (
            <div className="text-center py-6 text-green-400 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              {t("barchaXodimlarHisobotTopshirdi")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── AllReportsList ───────────────────────────────────────────────────────────
interface AllReportsListProps {
  allReports: DailyReportEmployee[];
  isLoading: boolean;
  reportType: ReportType;
}

export function AllReportsList({ allReports, isLoading, reportType }: AllReportsListProps) {
  const { t } = useTranslation("common");
  const heading =
    reportType === "operator" ? "Operator hisobotlari (bugun)" :
    reportType === "office" ? "Ofis xodimlari hisobotlari (bugun)" :
    "Barcha hisobotlar (bugun)";

  const emptyMsg =
    reportType === "operator" ? "Bugun operator hisobotlari yo'q" :
    reportType === "office" ? "Bugun ofis hisobotlari yo'q" :
    "Bugun hech qanday hisobot topshirilmagan";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          {reportType === "operator" && <Wrench className="w-4 h-4 text-blue-400" />}
          {heading}
        </h3>
        {Array.isArray(allReports) && (
          <span className="text-xs text-muted-foreground">{allReports.length} ta hisobot</span>
        )}
      </div>

      {isLoading && <div className="text-center py-8 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>}
      {!isLoading && Array.isArray(allReports) && allReports.length === 0 && (
        <div className="text-center py-12 text-[13px] text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      )}
      {!isLoading && Array.isArray(allReports) && allReports.length > 0 && (
        <div className="space-y-2">
          {allReports.map((r) => {
            const isOp = r.is_machine_operator_report || r.is_machine_operator;
            let prodData: Record<string, unknown> = {};
            if (isOp && r.tasks_completed) {
              try { prodData = JSON.parse(r.tasks_completed); } catch { /* not JSON */ }
            }
            return (
              <div key={r.id} className={`p-3 rounded-lg border ${
                isOp ? "border-blue-800/40 bg-blue-900/10" :
                r.is_auto_absent ? "border-red-800/40 bg-red-900/10" :
                "border-border bg-card"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isOp && <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span className="font-medium text-foreground text-sm truncate">
                      {r.first_name} {r.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.employee_code}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOp && prodData.oee !== undefined && (
                      <span className="text-xs flex items-center gap-0.5 text-blue-300">
                        <Gauge className="w-3 h-3" />
                        {Number(prodData.oee).toFixed(1)}%
                      </span>
                    )}
                    {r.is_auto_absent ? (
                      <EPStatusPill tone="danger">{t("yoqlik")}</EPStatusPill>
                    ) : r.status === "submitted" ? (
                      <EPStatusPill tone="success">{t("topshirildi")}</EPStatusPill>
                    ) : (
                      <EPStatusPill tone="warning">{t("Kutilmoqda")}</EPStatusPill>
                    )}
                  </div>
                </div>
                {!isOp && r.tasks_completed && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.tasks_completed}</p>
                )}
                {isOp && prodData.produced !== undefined && (
                  <p className="text-xs text-blue-300/70 mt-1">
                    Ishlab chiqarildi: {Number((prodData.produced as number) || (prodData.today_produced as number) || 0).toLocaleString()} dona
                    {prodData.defects !== undefined && ` · Nuqson: ${prodData.defects}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
