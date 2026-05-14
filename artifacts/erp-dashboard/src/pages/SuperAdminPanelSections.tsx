/**
 * @module SuperAdminPanelSections
 * @description Tab panels, section components, and dialogs for SuperAdminPanel.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Users, Database, Server, AlertTriangle, Clock, Rocket, Zap, XCircle, CheckCircle, Trash2, Globe, Filter, Search, ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react";
import { Tenant, ModuleDef, PlatformStats, ExpiryAlertsData, AuditLogEntry, AuditFilters, PLAN_LABELS, STATUS_COLORS, STATUS_LABELS, ACTION_COLORS, ACTION_LABELS, formatDate } from "./SuperAdminPanelTypes";

import { useTranslation } from '@/lib/i18n';
import { EPStatusPill, EPLoader } from "@/components/ep";
// ── Platform Stats ────────────────────────────────────────────────────────────

export function PlatformStatsCards({ platformStats, statsLoading, formatUptime }: { platformStats: PlatformStats | undefined; statsLoading: boolean; formatUptime: (s: number) => string }) { const items = [ { label: "Jami Tenantlar", value: platformStats?.tenants?.total ?? 0, sub: `${platformStats?.tenants?.active ?? 0} faol`, icon: Building2, color: "text-[var(--ep-blue)]" }, { label: "Jami Foydalanuvchilar", value: platformStats?.users?.total ?? 0, sub: "barcha tenantlarda", icon: Users, color: "text-[var(--ep-green)]" }, { label: "DB Hajmi", value: `${platformStats?.database?.sizeMB ?? 0} MB`, sub: "PostgreSQL", icon: Database, color: "text-[var(--ep-primary)]" }, { label: "Uptime", value: formatUptime(platformStats?.uptime ?? 0), sub: platformStats?.version ?? "1.0.0", icon: Server, color: "text-[var(--ep-purple)]" }, ]; return ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"> {statsLoading ? Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>) : items.map((s, i) => ( <Card key={i} data-testid={`saas-stat-${i}`}> <CardContent className="p-4"> <div className="flex items-center gap-2"><s.icon className={`w-4 h-4 ${s.color}`} /><span className="text-xs text-muted-foreground">{s.label}</span></div> <p className="text-xl font-bold mt-1">{s.value}</p> <p className="text-xs text-muted-foreground">{s.sub}</p> </CardContent> </Card> )) } </div> ); } 

// ── Expiry Alerts ───────────────────────────────────────────────────────────── 

export function ExpiryAlertsCard({ expiryData }: { expiryData: ExpiryAlertsData | undefined }) { if ((expiryData?.total ?? 0) === 0) return null; return ( <Card className="border-amber-500/40"> <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-[var(--ep-yellow)] dark:text-amber-400"><AlertTriangle className="w-5 h-5" />Litsenziya muddati yaqinlashmoqda</CardTitle> <CardDescription>{expiryData?.expired ?? 0} ta muddati o'tgan, {expiryData?.expiring ?? 0} ta 30 kun ichida tugaydi</CardDescription> </CardHeader> <CardContent> <div className="space-y-2"> {expiryData?.tenants?.map(t => ( <div key={t.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`expiry-alert-${t.id}`}> <div className="flex items-center gap-3"> <div className={`w-2 h-2 rounded-full ${t.isExpired ? "bg-red-500" : t.daysRemaining <= 7 ? "bg-amber-500" : "bg-yellow-400"}`} /> <div><p className="font-medium text-sm">{t.name}</p><p className="text-xs text-muted-foreground">{t.plan} · {t.expiresAt}</p></div> </div> <div className="flex items-center gap-2"> <Badge variant={t.isExpired ? "destructive" : "outline"}><Clock className="w-3 h-3 mr-1" />{t.isExpired ? "Muddati o'tgan" : `${t.daysRemaining} kun qoldi`}</Badge> {t.contactPhone && <span className="text-xs text-muted-foreground">{t.contactPhone}</span>} </div> </div> ))} </div> </CardContent> </Card> ); } 

// ── Tenants Tab ─────────────────────────────────────────────────────────────── 

export function TenantsTab({ tenants, tenantsLoading, onboardMutation, updateStatusMutation, onEditModules, onDeleteTenant }: { tenants: Tenant[]; tenantsLoading: boolean; onboardMutation: { mutate: (id: string) => void; isPending: boolean }; updateStatusMutation: { mutate: (args: { id: string; status: string }) => void }; onEditModules: (tenant: Tenant) => void; onDeleteTenant: (id: string) => void; }) {
  const { t } = useTranslation('common');
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Tenantlar</CardTitle><CardDescription>Barcha zavodlar va kompaniyalar</CardDescription></CardHeader>
      <CardContent>
        {tenantsLoading ? <div className="flex justify-center py-8"><EPLoader className="w-6 h-6" /></div>
          : tenants.length === 0 ? <div className="text-center py-8 text-[13px] text-muted-foreground">Tenantlar yo'q</div>
          : (
            <div className="ep-table-scroll"><Table>
              <TableHeader className="sticky top-0 z-10 bg-card"><TableRow><TableHead>Nomi</TableHead><TableHead>Domain</TableHead><TableHead>Reja</TableHead><TableHead>{t('status19')}</TableHead><TableHead>Foydalanuvchilar</TableHead><TableHead>Modullar</TableHead><TableHead>Muddati</TableHead><TableHead>Amallar</TableHead></TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(tenants) ? tenants : []).map(t => (
                  <TableRow key={t.id} data-testid={`row-tenant-${t.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell><div><p className="font-medium">{t.name}</p>{t.contactEmail && <p className="text-xs text-muted-foreground">{t.contactEmail}</p>}</div></TableCell>
                    <TableCell className="font-mono text-sm">{t.domain}</TableCell>
                    <TableCell><Badge variant="outline">{PLAN_LABELS[t.plan]}</Badge></TableCell>
                    <TableCell><Badge variant={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge></TableCell>
                    <TableCell>{t.usersCount}</TableCell>
                    <TableCell><EPStatusPill tone="neutral">{t.modulesEnabled.length} modul</EPStatusPill></TableCell>
                    <TableCell className="text-sm">
                      {t.expiresAt ? (<div><p>{t.expiresAt}</p>{(() => { const d = Math.ceil((new Date(t.expiresAt).getTime() - Date.now()) / 86400000); if (d < 0) return <EPStatusPill tone="danger" className="text-xs mt-1">O'tgan</EPStatusPill>; if (d <= 14) return <Badge variant="outline" className="text-xs mt-1 text-[var(--ep-yellow)]">{d}k qoldi</Badge>; return null; })()}</div>) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="Onboarding" data-testid={`button-onboard-${t.id}`} onClick={() => onboardMutation.mutate(t.id)} disabled={onboardMutation.isPending}><Rocket className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" title="Modullarni tahrirlash" data-testid={`button-edit-modules-${t.id}`} onClick={() => onEditModules(t)}><Zap className="w-3 h-3" /></Button>
                        {t.status === "active"
                          ? <Button size="icon" variant="ghost" title="To'xtatish" data-testid={`button-suspend-${t.id}`} onClick={() => updateStatusMutation.mutate({ id: t.id, status: "suspended" })}><XCircle className="w-3 h-3 text-[var(--ep-red)]" /></Button>
                          : <Button size="icon" variant="ghost" title="Faollashtirish" data-testid={`button-activate-${t.id}`} onClick={() => updateStatusMutation.mutate({ id: t.id, status: "active" })}><CheckCircle className="w-3 h-3 text-[var(--ep-green)]" /></Button>}
                        <Button size="icon" variant="ghost" title="O'chirish" data-testid={`button-delete-tenant-${t.id}`} onClick={() => onDeleteTenant(t.id)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
      </CardContent>
    </Card>
  );
}

// ── Add Tenant Dialog ─────────────────────────────────────────────────────────

export function AddTenantDialog({ open, onOpenChange, newTenant, setNewTenant, isPending, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  newTenant: { name: string; domain: string; plan: string; contactEmail: string; contactPhone: string };
  setNewTenant: React.Dispatch<React.SetStateAction<{ name: string; domain: string; plan: string; contactEmail: string; contactPhone: string }>>;
  isPending: boolean; onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Yangi Tenant Qo'shish</DialogTitle><DialogDescription>Yangi zavod yoki kompaniyani ro'yxatdan o'tkazing</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Kompaniya nomi *</Label><Input value={newTenant.name} onChange={e => setNewTenant(p => ({ ...p, name: e.target.value }))} placeholder="Europrint Samarkand" data-testid="input-tenant-name" /></div>
          <div><Label>Domain *</Label><Input value={newTenant.domain} onChange={e => setNewTenant(p => ({ ...p, domain: e.target.value }))} placeholder="samarkand.europrint.uz" data-testid="input-tenant-domain" /></div>
          <div>
            <Label>Reja</Label>
            <Select value={newTenant.plan} onValueChange={v => setNewTenant(p => ({ ...p, plan: v }))}>
              <SelectTrigger data-testid="select-tenant-plan" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>{"Kontakt email"}</Label><Input value={newTenant.contactEmail} onChange={e => setNewTenant(p => ({ ...p, contactEmail: e.target.value }))} placeholder="admin@company.uz" type="email" data-testid="input-tenant-email" /></div>
          <div><Label>Telefon</Label><Input value={newTenant.contactPhone} onChange={e => setNewTenant(p => ({ ...p, contactPhone: e.target.value }))} placeholder="+998 90 000 00 00" data-testid="input-tenant-phone" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
          <Button data-testid="button-submit-tenant" disabled={isPending || !newTenant.name || !newTenant.domain} onClick={onSubmit}>
            {isPending && <EPLoader className="w-4 h-4 mr-2" />}Yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Modules Dialog ───────────────────────────────────────────────────────

export function EditModulesDialog({ editModulesDialog, modules, selectedModules, setSelectedModules, isPending, onClose, onSave }: {
  editModulesDialog: Tenant | null; modules: ModuleDef[]; selectedModules: string[];
  setSelectedModules: React.Dispatch<React.SetStateAction<string[]>>;
  isPending: boolean; onClose: () => void; onSave: () => void;
}) {
  if (!editModulesDialog) return null;
  return (
    <Dialog open={!!editModulesDialog} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Modullarni tahrirlash — {editModulesDialog.name}</DialogTitle><DialogDescription>Ushbu tenant uchun modullarni yoqing yoki o'chiring</DialogDescription></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {(Array.isArray(modules) ? modules : []).map(m => (
            <div key={m.key} className="flex items-center gap-2">
              <Checkbox id={`mod-${m.key}`} checked={selectedModules.includes(m.key)} data-testid={`checkbox-module-${m.key}`} onCheckedChange={checked => { setSelectedModules(prev => checked ? [...prev, m.key] : (Array.isArray(prev) ? prev : []).filter(x => x !== m.key)); }} />
              <label htmlFor={`mod-${m.key}`} className="text-sm cursor-pointer">{m.label}</label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button data-testid="button-save-modules" disabled={isPending} onClick={onSave}>{isPending && <EPLoader className="w-4 h-4 mr-2" />}Saqlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────

export function AuditLogTab({ auditLogs, auditLoading, auditTotal, auditLimit, auditPage, auditTotalPages, auditTables, auditFilters, onFilterChange, onResetFilters, onPageChange, onViewDetail }: {
  auditLogs: AuditLogEntry[]; auditLoading: boolean; auditTotal: number; auditLimit: number;
  auditPage: number; auditTotalPages: number; auditTables: string[]; auditFilters: AuditFilters;
  onFilterChange: (key: keyof AuditFilters, value: string) => void; onResetFilters: () => void;
  onPageChange: (page: number) => void; onViewDetail: (log: AuditLogEntry) => void;
}) {
  const hasFilters = !!(auditFilters.action || auditFilters.table || auditFilters.search || auditFilters.from || auditFilters.to || auditFilters.userId);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Filter className="w-4 h-4" />Filtrlar<span className="ml-auto text-xs text-muted-foreground font-normal">Jami: {auditTotal} ta yozuv</span></CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2"><Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" /><Input className="pl-7 h-9 text-sm" placeholder="Qidirish..." value={auditFilters.search} onChange={e => onFilterChange("search", e.target.value)} data-testid="audit-search" /></div>
            <Select value={auditFilters.action || "__all__"} onValueChange={v => onFilterChange("action", v === "__all__" ? "" : v)}><SelectTrigger className="h-9 text-sm" data-testid="audit-filter-action"><SelectValue placeholder="Amal" /></SelectTrigger><SelectContent><SelectItem value="__all__">Barcha amallar</SelectItem><SelectItem value="CREATE">Yaratish</SelectItem><SelectItem value="INSERT">Qo'shish</SelectItem><SelectItem value="UPDATE">Yangilash</SelectItem><SelectItem value="DELETE">O'chirish</SelectItem></SelectContent></Select>
            <Select value={auditFilters.table || "__all__"} onValueChange={v => onFilterChange("table", v === "__all__" ? "" : v)}><SelectTrigger className="h-9 text-sm" data-testid="audit-filter-table"><SelectValue placeholder="Modul" /></SelectTrigger><SelectContent><SelectItem value="__all__">Barcha modullar</SelectItem>{auditTables.map(tbl => <SelectItem key={tbl} value={tbl}>{tbl}</SelectItem>)}</SelectContent></Select>
            <div><Input type="date" className="h-9 text-sm" value={auditFilters.from} onChange={e => onFilterChange("from", e.target.value)} data-testid="audit-filter-from" title="Boshlanish sanasi" /></div>
            <div className="flex gap-2"><Input type="date" className="h-9 text-sm flex-1" value={auditFilters.to} onChange={e => onFilterChange("to", e.target.value)} data-testid="audit-filter-to" title="Tugash sanasi" />{hasFilters && <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={onResetFilters} title="Filtrlarni tozalash"><XCircle className="w-4 h-4 text-muted-foreground" /></Button>}</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {auditLoading ? <div className="flex justify-center py-12"><EPLoader tone="muted" className="w-6 h-6" /></div>
            : auditLogs.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2"><FileText className="w-8 h-8 opacity-40" /><p className="text-sm">Audit yozuvlari topilmadi</p></div>
            : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card"><TableRow className="bg-muted/30 hover:bg-muted/40 transition-colors"><TableHead className="w-36">Vaqt</TableHead><TableHead className="w-40">Foydalanuvchi</TableHead><TableHead className="w-24">Amal</TableHead><TableHead className="w-36">Modul (jadval)</TableHead><TableHead className="w-32">Yozuv ID</TableHead><TableHead>O'zgargan maydonlar</TableHead><TableHead className="w-12 text-center">Ko'rish</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id} className="hover:bg-muted/30" data-testid={`audit-row-${log.id}`}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                        <TableCell><div><p className="text-sm font-medium leading-none">{log.user_display_name || log.user_full_name || log.user_id || "—"}</p>{log.user_role && <p className="text-xs text-muted-foreground mt-0.5">{log.user_role}</p>}</div></TableCell>
                        <TableCell><Badge variant={ACTION_COLORS[log.action?.toUpperCase()] ?? "outline"} className="text-xs">{ACTION_LABELS[log.action?.toUpperCase()] ?? log.action}</Badge></TableCell>
                        <TableCell><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{log.table_name}</span></TableCell>
                        <TableCell><span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block" title={log.record_id}>{log.record_id}</span></TableCell>
                        <TableCell>{log.changed_fields && log.changed_fields.length > 0 ? <div className="flex flex-wrap gap-1">{log.changed_fields.slice(0, 4).map(f => <span key={f} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{f}</span>)}{log.changed_fields.length > 4 && <span className="text-xs text-muted-foreground">+{log.changed_fields.length - 4}</span>}</div> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-center"><Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => onViewDetail(log)} data-testid={`audit-detail-${log.id}`}><Eye className="w-3.5 h-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
        {auditTotal > auditLimit && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">{(auditPage - 1) * auditLimit + 1}–{Math.min(auditPage * auditLimit, auditTotal)} / {auditTotal}</p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="w-7 h-7" disabled={auditPage <= 1} onClick={() => onPageChange(auditPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs px-2">{auditPage} / {auditTotalPages}</span>
              <Button size="icon" variant="ghost" className="w-7 h-7" disabled={auditPage >= auditTotalPages} onClick={() => onPageChange(auditPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Audit Detail Dialog ───────────────────────────────────────────────────────

export function AuditDetailDialog({ log, onClose }: { log: AuditLogEntry | null; onClose: () => void }) {
  if (!log) return null;
  return (
    <Dialog open={!!log} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-4 h-4" />{"Audit tafsiloti"}</DialogTitle>
          <DialogDescription>{formatDate(log.created_at)} · {log.table_name} · {log.record_id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1"><p className="text-xs text-muted-foreground">Foydalanuvchi</p><p className="font-medium">{log.user_display_name || log.user_full_name || log.user_id || "—"}</p></div>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">Rol</p><p className="font-medium">{log.user_role || "—"}</p></div>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">Amal</p><Badge variant={ACTION_COLORS[log.action?.toUpperCase()] ?? "outline"}>{ACTION_LABELS[log.action?.toUpperCase()] ?? log.action}</Badge></div>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">IP manzil</p><p className="font-mono text-xs">{log.ip_address || "—"}</p></div>
            {log.reason && <div className="col-span-2 space-y-1"><p className="text-xs text-muted-foreground">Sabab</p><p className="text-sm">{log.reason}</p></div>}
          </div>
          {log.changed_fields && log.changed_fields.length > 0 && (
            <div><p className="text-xs text-muted-foreground mb-2">O'zgargan maydonlar</p><div className="flex flex-wrap gap-1">{log.changed_fields.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}</div></div>
          )}
          {log.old_values && (
            <div><p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Eski qiymatlar</p>
              <pre className="text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-3 overflow-x-auto max-h-48 text-[var(--ep-red)] dark:text-red-300">{JSON.stringify(log.old_values, null, 2)}</pre>
            </div>
          )}
          {log.new_values && (
            <div><p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Yangi qiymatlar</p>
              <pre className="text-xs bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded p-3 overflow-x-auto max-h-48 text-[var(--ep-green)] dark:text-green-300">{JSON.stringify(log.new_values, null, 2)}</pre>
            </div>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Yopish</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
