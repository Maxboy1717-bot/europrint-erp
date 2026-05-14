/**
 * @module SaaSExtendedSectionsB
 * @description ModulesSection, MonitoringSection, ErrorsSection components.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { RefreshCw, CheckCircle, XCircle, Clock, Database, Cpu, AlertCircle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  SaaSTenant,
  ErrorLog,
  PlatformStats,
  PLAN_LABELS,
  ALL_MODULES,
} from "./SaaSExtendedTypes";

// ===================== MODULES SECTION =====================

interface ModulesSectionProps {
  tenants: SaaSTenant[];
  selectedTenant: string;
  setSelectedTenant: (v: string) => void;
  selectedTenantData: SaaSTenant | undefined;
}

export function ModulesSection({ tenants, selectedTenant, setSelectedTenant, selectedTenantData }: ModulesSectionProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="modules" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("modulNazorati")}</h2>
        <div className="flex items-center gap-2">
          <Label className="text-sm shrink-0">{t("tenant1")}</Label>
          <Select
            value={selectedTenant || (tenants[0]?.id !== undefined ? String(tenants[0].id) : undefined)}
            onValueChange={setSelectedTenant}
          >
            <SelectTrigger className="w-56 h-9" data-testid="select-module-tenant">
              <SelectValue placeholder={t("tenantTanlang")} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {selectedTenantData && (
        <Card>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("modul1")}</TableHead>
                  <TableHead>{t("kalit1")}</TableHead>
                  <TableHead>{t("minTarif")}</TableHead>
                  <TableHead>{String(selectedTenantData.name ?? "")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(ALL_MODULES) ? ALL_MODULES : []).map((mod) => {
                  const tenantModules: string[] = Array.isArray(selectedTenantData?.modulesEnabled) ? selectedTenantData.modulesEnabled : [];
                  const hasAccess = tenantModules.includes(mod.key);
                  const minTier = mod.tiers[0];
                  return (
                    <TableRow key={mod.key} data-testid={`row-module-${mod.key}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{mod.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{mod.key}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{PLAN_LABELS[minTier] || minTier}</Badge></TableCell>
                      <TableCell>
                        {hasAccess
                          ? <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
                          : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

// ===================== MONITORING SECTION =====================

interface MonitoringSectionProps {
  platformStats: PlatformStats | undefined;
  statsLoading: boolean;
  onRefresh: () => void;
}

export function MonitoringSection({ platformStats, statsLoading, onRefresh }: MonitoringSectionProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="monitoring" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("tizimMonitoringi")}</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-stats">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}
        </div>
      ) : platformStats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { icon: Clock, l: "Uptime", v: `${platformStats.uptimeHours}h`, c: "text-[var(--ep-green)]" },
              { icon: Database, l: "DB hajmi", v: `${platformStats.database?.sizeMB || 0} MB`, c: "text-[var(--ep-blue)]" },
              { icon: Cpu, l: "Heap xotira", v: `${platformStats.memory?.heapUsed || 0} MB`, c: "text-[var(--ep-primary)]" },
              { icon: AlertCircle, l: "Xatolar (24h)", v: platformStats.errors?.last24h || 0, c: (platformStats.errors?.last24h ?? 0) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]" },
            ]).map(s => (
              <Card key={s.l}><CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`h-4 w-4 ${s.c}`} />
                  <span className="text-xs text-muted-foreground">{s.l}</span>
                </div>
                <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("tenantStatistika")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {([
                  { l: "Jami", v: platformStats.tenants?.total },
                  { l: "Faol", v: platformStats.tenants?.active },
                  { l: "Sinov", v: platformStats.tenants?.trial },
                  { l: "Bloklangan", v: platformStats.tenants?.suspended },
                  { l: "Bekor qilingan", v: platformStats.tenants?.cancelled },
                  { l: "Jami foydalanuvchilar", v: platformStats.users?.total },
                ]).map(s => (
                  <div key={s.l} className="flex items-center justify-between text-sm" data-testid={`stat-${s.l.replace(" ", "-")}`}>
                    <span className="text-muted-foreground">{s.l}</span>
                    <span className="font-medium">{s.v ?? 0}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("serverHolati")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {([
                  { l: "Versiya", v: platformStats.version },
                  { l: "Muhit", v: platformStats.environment },
                  { l: "RSS xotira", v: `${platformStats.memory?.rss || 0} MB` },
                  { l: "Heap xotira", v: `${platformStats.memory?.heapUsed || 0} MB` },
                  { l: "Uptime", v: `${Math.round((platformStats.uptime || 0) / 60)} daqiqa` },
                ]).map(s => (
                  <div key={s.l} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.l}</span>
                    <span className="font-medium font-mono">{s.v ?? "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            {t("malumotYuklanmadi")}
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

// ===================== ERRORS SECTION =====================

interface ErrorsSectionProps {
  errorLogsData: { logs?: ErrorLog[]; total?: number } | undefined;
  errorsLoading: boolean;
  onRefresh: () => void;
}

export function ErrorsSection({ errorLogsData, errorsLoading, onRefresh }: ErrorsSectionProps) {
  const { t } = useTranslation("common");
  return (
    <TabsContent value="errors" className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("tizimXatolariLogi")}</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-errors">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {errorsLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">{t("Yuklanmoqda...")}</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("time")}</TableHead>
                  <TableHead>{t("tenant")}</TableHead>
                  <TableHead>{t("daraja")}</TableHead>
                  <TableHead>{t("modul1")}</TableHead>
                  <TableHead>{t("xabar")}</TableHead>
                  <TableHead>{t("yol")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(errorLogsData?.logs || []).map((e: ErrorLog, i: number) => (
                  <TableRow key={e.id || i} data-testid={`row-error-${i}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-xs font-mono">{e.createdAt ? new Date(e.createdAt).toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm">{e.tenantId || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={e.level === "error" ? "destructive" : e.level === "warn" ? "secondary" : "outline"} className="text-xs">{e.level}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{e.module || "—"}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{e.message}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{e.requestPath || "—"}</TableCell>
                  </TableRow>
                ))}
                {(errorLogsData?.logs || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-8 w-8 text-[var(--ep-green)] mx-auto mb-2" />
                      {t("hechQandayXatoYoq")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
