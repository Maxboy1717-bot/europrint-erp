/**
 * @module AuditLogPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw, Download } from "lucide-react";
import {
  AuditLogRow, FilteredResponse, TablesResponse, PAGE_SIZE,
} from "./AuditLogPageTypes";
import { AuditFilters, AuditTable, AuditDetailModal } from "./AuditLogPageSections";

import { useTranslation } from '@/lib/i18n';
export default function AuditLogPage() {
  const { t } = useTranslation('common');
  const [page, setPage]           = useState(1);
  const [action, setAction]       = useState("");
  const [tableName, setTableName] = useState("");
  const [userId, setUserId]       = useState("");
  const [search, setSearch]       = useState("");
  const [from, setFrom]           = useState("");
  const [to, setTo]               = useState("");
  const [selected, setSelected]   = useState<AuditLogRow | null>(null);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    ...(action    ? { action }          : {}),
    ...(tableName ? { table: tableName } : {}),
    ...(userId    ? { userId }          : {}),
    ...(search    ? { search }          : {}),
    ...(from      ? { from }            : {}),
    ...(to        ? { to }              : {}),
  });

  const { data, isLoading, refetch } = useQuery<FilteredResponse>({
    queryKey: ["audit-filtered", page, action, tableName, userId, search, from, to],
    queryFn: () => apiRequest<FilteredResponse>("GET", `/api/admin/audit-filtered?${params}`),
  });

  const { data: tablesData } = useQuery<TablesResponse>({
    queryKey: ["audit-tables"],
    queryFn: () => apiRequest<TablesResponse>("GET", "/api/admin/audit-tables"),
    staleTime: 60_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = (field: string, value: string) => {
    setPage(1);
    switch (field) {
      case "action":    setAction(value);    break;
      case "tableName": setTableName(value); break;
      case "userId":    setUserId(value);    break;
      case "search":    setSearch(value);    break;
      case "from":      setFrom(value);      break;
      case "to":        setTo(value);        break;
    }
  };

  const reset = () => {
    setAction(""); setTableName(""); setUserId("");
    setSearch(""); setFrom(""); setTo(""); setPage(1);
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const header = "ID,Table,RecordID,Action,User,IP,Reason,CreatedAt";
    const body = rows.map(r =>
      [r.id, r.table_name, r.record_id, r.action,
       r.user_display_name ?? r.user_id ?? "",
       r.ip_address ?? "", r.reason ?? "",
       r.created_at].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('auditLog')}</h1>
            <p className="text-sm text-muted-foreground">
              Tizimda barcha CREATE / UPDATE / DELETE amallar — {total.toLocaleString()} ta yozuv
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> {t("refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <AuditFilters
        action={action}
        tableName={tableName}
        userId={userId}
        search={search}
        from={from}
        to={to}
        tables={Array.isArray(tablesData?.tables) ? tablesData.tables : []}
        onChange={handleFilterChange}
        onReset={reset}
      />

      <AuditTable
        rows={rows}
        isLoading={isLoading}
        page={page}
        pages={pages}
        total={total}
        onPageChange={setPage}
        onSelect={setSelected}
      />

      <AuditDetailModal selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}