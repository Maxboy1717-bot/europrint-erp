/**
 * WarehouseAuditLog.tsx
 * ERP — Audit log ko'rish sahifasi (kim/qachon/nima qildi).
 * URL: /wms/audit-log
 *
 * 7 yil saqlash — O'zbekiston soliq talabi.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Search, Calendar, User, FileText, Download } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: number;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: string; color: string }> = {
  "pos.movement.created":         { icon: "🔄", color: "bg-blue-100 text-blue-800" },
  "pos.movement.approved":        { icon: "✅", color: "bg-emerald-100 text-emerald-800" },
  "pos.movement.rejected":        { icon: "❌", color: "bg-red-100 text-red-800" },
  "pos.movement.cancelled":       { icon: "🚫", color: "bg-gray-100 text-gray-800" },
  "pos.movement.balance_override":{ icon: "⚠️", color: "bg-amber-100 text-amber-800" },
  "pos.qc.decided":               { icon: "🔬", color: "bg-violet-100 text-violet-800" },
  "pos.material.created":         { icon: "📦", color: "bg-blue-100 text-blue-800" },
  "pos.warehouse.assigned":       { icon: "👥", color: "bg-purple-100 text-purple-800" },
  "auth.login":                   { icon: "🔓", color: "bg-emerald-100 text-emerald-800" },
  "auth.logout":                  { icon: "🔒", color: "bg-gray-100 text-gray-800" },
};

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString("uz-UZ"); } catch { return iso; }
}

export default function WarehouseAuditLog() {
  const { t } = useTranslation('common');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("limit", "500");
      const r = await apiRequest<AuditLog[] | { rows: AuditLog[] }>("GET", `/api/pos/reports/audit?${params.toString()}`);
      const list = Array.isArray(r) ? r : (r as { rows: AuditLog[] })?.rows ?? [];
      setLogs(list);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = logs.filter(l => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.action ?? "").toLowerCase().includes(q)
          || (l.user_name ?? "").toLowerCase().includes(q)
          || (l.entity_type ?? "").toLowerCase().includes(q)
          || String(l.entity_id ?? "").includes(q);
    }
    return true;
  });

  const actions = Array.from(new Set(logs.map(l => l.action))).sort();

  const exportCsv = () => {
    const headers = ["ID", "Foydalanuvchi", "Amal", "Obyekt turi", "Obyekt ID", "IP", "Sana"];
    const rows = filtered.map(l => [
      l.id, l.user_name ?? l.user_id, l.action,
      l.entity_type ?? "", l.entity_id ?? "",
      l.ip_address ?? "", fmtDate(l.created_at),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-8 w-8 text-[var(--ep-purple)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">{t('auditLog1')}</div>
          <h1 className="text-2xl font-bold">{t("tizimAuditJurnali")}</h1>
          <p className="text-sm text-gray-500">7 yil saqlanadi (O'zbekiston soliq talabi)</p>
        </div>
        <Button onClick={exportCsv} variant="outline" disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" /> CSV eksport
        </Button>
        <Button onClick={load} variant="outline">🔄</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder={t("foydalanuvchiAmalObyekt")} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-3 py-2 border rounded text-sm">
              <option value="all">Barcha amallar ({logs.length})</option>
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
              <Button onClick={load} size="sm" variant="outline">{t("filter3")}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            <div className="lg:col-span-2 overflow-x-auto">
              {loading ? (
                <div className="p-10 text-center text-gray-500">{t("yuklanmoqda")}</div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center text-gray-400">{t("yozuvlarYoq")}</div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("foydalanuvchi")}</TableHead>
                      <TableHead>{t("amal")}</TableHead>
                      <TableHead>{t("obyekt")}</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 200).map(l => {
                      const cfg = ACTION_CONFIG[l.action] ?? { icon: "•", color: "bg-gray-100" };
                      return (
                        <TableRow
                          key={l.id}
                          className={`cursor-pointer ${selected?.id === l.id ? "bg-blue-50" : ""}`}
                          onClick={() => setSelected(l)}
                        >
                          <TableCell className="text-xs text-gray-500">{fmtDate(l.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{l.user_name ?? `#${l.user_id}`}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${cfg.color}`}>
                              {cfg.icon} {l.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {l.entity_type ? `${l.entity_type}#${l.entity_id}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-gray-500">{l.ip_address ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              )}
            </div>

            {/* Detail panel */}
            <div className="border-l border-gray-200 bg-gray-50 p-4">
              {!selected ? (
                <div className="text-center text-gray-400 py-10">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">{t("yozuvniBosibTanlang")}</div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">SANA</div>
                    <div>{fmtDate(selected.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">FOYDALANUVCHI</div>
                    <div>{selected.user_name ?? `#${selected.user_id}`}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">AMAL</div>
                    <Badge variant="outline">{selected.action}</Badge>
                  </div>
                  {selected.entity_type && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">OBYEKT</div>
                      <div className="font-mono text-xs">{selected.entity_type} #{selected.entity_id}</div>
                    </div>
                  )}
                  {selected.ip_address && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">IP MANZIL</div>
                      <div className="font-mono text-xs">{selected.ip_address}</div>
                    </div>
                  )}
                  {selected.old_value && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">OLDINGI</div>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                        {JSON.stringify(selected.old_value, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selected.new_value && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">YANGI</div>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto max-h-32">
                        {JSON.stringify(selected.new_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
