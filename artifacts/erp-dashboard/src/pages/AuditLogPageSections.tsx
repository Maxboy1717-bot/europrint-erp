/**
 * AuditLogPageSections.tsx
 * Filters and table (with pagination) for AuditLogPage
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { History, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { AuditLogRow, ACTION_COLORS, PAGE_SIZE } from "./AuditLogPageTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Filters ─────────────────────────────────────────────────────────────────

interface FiltersProps {
  action: string; tableName: string; userId: string;
  search: string; from: string; to: string;
  tables: string[];
  onChange: (field: string, value: string) => void;
  onReset: () => void;
}

export function AuditFilters({ action, tableName, userId, search, from, to, tables, onChange, onReset }: FiltersProps) {
  const { t } = useTranslation("common");
  const hasFilter = action || tableName || userId || search || from || to;
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("action2")}</label>
            <select className="w-full h-9 border rounded-md px-2 text-sm bg-background" value={action} onChange={e => onChange("action", e.target.value)}>
              <option value="">{t("Barchasi")}</option>
              <option value="CREATE">YARATILDI</option>
              <option value="UPDATE">YANGILANDI</option>
              <option value="DELETE">{t("ochirildi")}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("jadval")}</label>
            <select className="w-full h-9 border rounded-md px-2 text-sm bg-background" value={tableName} onChange={e => onChange("tableName", e.target.value)}>
              <option value="">{t("Barchasi")}</option>
              {(Array.isArray(tables) ? tables : []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("foydalanuvchiId")}</label>
            <Input placeholder={t("foydalanuvchiId")} value={userId} onChange={e => onChange("userId", e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("search")}</label>
            <Input placeholder={t("jadvalYozuv")} value={search} onChange={e => onChange("search", e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("danSana")}</label>
            <Input type="date" value={from} onChange={e => onChange("from", e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t("gachaSana")}</label>
            <Input type="date" value={to} onChange={e => onChange("to", e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        {hasFilter && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={onReset}>
            <X className="h-4 w-4 mr-1" /> {t("filtrlarniTozalash")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface AuditTableProps {
  rows: AuditLogRow[]; isLoading: boolean;
  page: number; pages: number; total: number;
  onPageChange: (p: number) => void;
  onSelect: (row: AuditLogRow) => void;
}

export function AuditTable({ rows, isLoading, page, pages, total, onPageChange, onSelect }: AuditTableProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Audit yozuvlar
          {isLoading && <span className="text-xs text-muted-foreground font-normal ml-2">{t("yuklanmoqda")}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">{t("sanaVaqt")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">{t("action2")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">{t("jadval")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">{t("yozuvId")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("foydalanuvchi")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">{t("ipManzil")}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {isLoading ? "Yuklanmoqda..." : "Yozuvlar topilmadi"}
                  </td>
                </tr>
              ) : rows.map(row => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${ACTION_COLORS[row.action] ?? "bg-gray-500"} text-white text-xs`}>{row.action}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.table_name}</td>
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-[7rem]" title={row.record_id}>{row.record_id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{row.user_display_name || row.user_full_name || row.user_id || "—"}</div>
                    {row.user_role && <div className="text-xs text-muted-foreground">{row.user_role}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{row.ip_address ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelect(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} / {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm w-16 text-center">{page} / {pages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps { selected: AuditLogRow | null; onClose: () => void; }

export function AuditDetailModal({ selected, onClose }: DetailModalProps) {
  const { t } = useTranslation("common");
  if (!selected) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" /> {t("auditYozuvTafsiloti")}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground text-xs">{t("action2")}</span>
              <div><Badge className={`${ACTION_COLORS[selected.action] ?? "bg-gray-500"} text-white`}>{selected.action}</Badge></div>
            </div>
            <div><span className="text-muted-foreground text-xs">{t("jadval")}</span><div className="font-mono">{selected.table_name}</div></div>
            <div><span className="text-muted-foreground text-xs">{t("yozuvId")}</span><div className="font-mono text-xs break-all">{selected.record_id}</div></div>
            <div><span className="text-muted-foreground text-xs">{t("date")}</span><div>{new Date(selected.created_at).toLocaleString("uz-UZ")}</div></div>
            <div>
              <span className="text-muted-foreground text-xs">{t("foydalanuvchi")}</span>
              <div>{selected.user_display_name ?? selected.user_full_name ?? selected.user_id ?? "—"}</div>
              {selected.user_role && <div className="text-xs text-muted-foreground">{selected.user_role}</div>}
            </div>
            <div><span className="text-muted-foreground text-xs">{t("ipManzil2")}</span><div className="font-mono">{selected.ip_address ?? "—"}</div></div>
            {selected.reason && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">{t("sabab")}</span>
                <div className="text-xs mt-1 text-muted-foreground">{selected.reason}</div>
              </div>
            )}
          </div>
          {selected.changed_fields && selected.changed_fields.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("ozgarganMaydonlar")}</p>
              <div className="flex flex-wrap gap-1">
                {selected.changed_fields.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-mono">{f}</Badge>
                ))}
              </div>
            </div>
          )}
          {selected.old_values && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("oldingiHolat1")}</p>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto max-h-40">{JSON.stringify(selected.old_values, null, 2)}</pre>
            </div>
          )}
          {selected.new_values && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("yangiHolat1")}</p>
              <pre className="p-3 bg-muted rounded text-xs overflow-x-auto max-h-40">{JSON.stringify(selected.new_values, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
