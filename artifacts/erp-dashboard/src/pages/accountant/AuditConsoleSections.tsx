/**
 * @module AuditConsoleSections
 * @description Stats cards, Timeline tab, Search tab, and Document trace tab
 *              for AuditConsole. Export tab lives in AuditConsoleExportTab.tsx.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from '@/lib/i18n';
import {
  Database, CheckCircle, RefreshCw, Trash2, History,
  Activity, Clock, Search, FileText, Download, FileSearch,
} from "lucide-react";
import {
  type AuditLog,
  type AuditStats,
  type AuditFilters,
  getActionBadgeColor,
  getSourceIcon,
} from "./AuditConsoleTypes";

// ─── StatsCards ───────────────────────────────────────────────────────────────

interface StatsCardsProps {
  auditStats: AuditStats | undefined;
}

export function StatsCards({auditStats }: StatsCardsProps) {
  const { t } = useTranslation('common');
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-[var(--ep-blue)]" />
            <span className="font-medium">{t("jamiLoglar")}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ep-blue)]">{auditStats?.totalLogs || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
            <span className="font-medium">YARATILDI</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ep-green)]">
            {auditStats?.actionStats?.find(s => s.actionType === "CREATE")?.count || 0}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-5 w-5 text-[var(--ep-yellow)]" />
            <span className="font-medium">YANGILANDI</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ep-yellow)]">
            {auditStats?.actionStats?.find(s => s.actionType === "UPDATE")?.count || 0}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-5 w-5 text-[var(--ep-red)]" />
            <span className="font-medium">{t("ochirildi")}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--ep-red)]">
            {auditStats?.actionStats?.find(s => s.actionType === "DELETE")?.count || 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TimelineTab ──────────────────────────────────────────────────────────────

interface TimelineTabProps {
  auditLogs: AuditLog[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectLog: (log: AuditLog) => void;
}

export function TimelineTab({ auditLogs, isLoading, onRefresh, onSelectLog }: TimelineTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t("songgiOzgarishlar")}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onRefresh}
          data-testid="button-refresh-audit"
        >
          <RefreshCw className="h-4 w-4" />
          {t("refresh")}
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("hozirchaAuditYozuvlarYoq")}</p>
            <p className="text-sm mt-2">{t("tizimdaBirorOzgarishQilganingizdaBu")}</p>
          </div>
        ) : (
          (Array.isArray(auditLogs) ? auditLogs : []).map((log: AuditLog) => (
            <div
              key={log.id}
              className="p-3 border rounded-lg hover-elevate cursor-pointer"
              onClick={() => onSelectLog(log)}
              data-testid={`audit-log-${log.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {getSourceIcon(log.source)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionBadgeColor(log.actionType)}>{log.actionType}</Badge>
                      <span className="font-medium">{log.entityType}</span>
                      {log.documentNo && <Badge variant="outline">{log.documentNo}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.actorFullName || log.actorUserId || "Tizim"} • {log.sourceRef}
                    </p>
                    {log.description && <p className="text-sm mt-1">{log.description}</p>}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground shrink-0">
                  <p>{log.timestamp && new Date(log.timestamp).toLocaleDateString("uz-UZ")}</p>
                  <p>{log.timestamp && new Date(log.timestamp).toLocaleTimeString("uz-UZ")}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── SearchTab ────────────────────────────────────────────────────────────────

interface SearchTabProps {
  filters: AuditFilters;
  actionTypes: { value: string; label: string }[];
  sourceTypes: { value: string; label: string }[];
  onFiltersChange: (filters: AuditFilters) => void;
}

export function SearchTab({ filters, actionTypes, sourceTypes, onFiltersChange }: SearchTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium mb-1 block">{t("actionTuri")}</label>
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={filters.actionType}
            onChange={(e) => onFiltersChange({ ...filters, actionType: e.target.value })}
          >
            <option value="">{t("Barchasi")}</option>
            {(Array.isArray(actionTypes) ? actionTypes : []).map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t("source1")}</label>
          <select
            className="w-full p-2 border rounded-md bg-background"
            value={filters.source}
            onChange={(e) => onFiltersChange({ ...filters, source: e.target.value })}
          >
            <option value="">{t("Barchasi")}</option>
            {(Array.isArray(sourceTypes) ? sourceTypes : []).map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t("entityTuri")}</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md bg-background"
            placeholder={"users, products..."}
            value={filters.entityType}
            onChange={(e) => onFiltersChange({ ...filters, entityType: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">{t("hujjatRaqami")}</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md bg-background"
            placeholder="SO-0001..."
            value={filters.documentNo}
            onChange={(e) => onFiltersChange({ ...filters, documentNo: e.target.value })}
          />
        </div>
      </div>
      <Button
        onClick={() => onFiltersChange({ actionType: "", entityType: "", source: "", documentNo: "" })}
        variant="outline"
        size="sm"
      >
        {t("filtrlarniTozalash")}
      </Button>
    </div>
  );
}

// ─── DocumentTraceTab ─────────────────────────────────────────────────────────

interface DocumentTraceTabProps {
  docSearchQuery: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
}

export function DocumentTraceTab({ docSearchQuery, onQueryChange, onSearch }: DocumentTraceTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-muted rounded-lg">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <FileSearch className="h-4 w-4" />
          {t("hujjatTrace")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("hujjatRaqaminiKiritingVaUnga")}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded-md bg-background"
            placeholder="Hujjat raqami (masalan: SO-0001, INV-0001)"
            value={docSearchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <Button className="gap-2" onClick={onSearch} data-testid="button-doc-search">
            <Search className="h-4 w-4" />
            {t("search")}
          </Button>
        </div>
        <div className="mt-4 p-4 bg-background rounded-lg border">
          <p className="text-sm text-muted-foreground text-center">
            {t("hujjatRaqaminiKiritibQidiringNatijada")}
            <br />
            <span className="text-[var(--ep-green)]">{t("orderInvoicePayment")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
