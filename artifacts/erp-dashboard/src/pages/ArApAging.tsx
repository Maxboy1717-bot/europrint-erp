/**
 * @module ArApAging
 * @description Consolidated AR/AP aging page — debitor (AR, IFRS-9 ECL) + kreditor (AP) aging
 *   by due-date bucket (0-30 / 31-60 / 61-90 / 90+) plus an FP-cycle (financial-period) config
 *   card that makes the previously-hardcoded INPS/JSHD payroll-tax rates owner-configurable.
 *
 *   Read endpoints (real fi_invoices data — no echo):
 *     GET /api/ar/ecl-aging  → { totalAr, totalEcl, current, thirtyDays, sixtyDays, ninetyDaysPlus }
 *     GET /api/ap/ecl-aging  → { totalAp, current, thirtyDays, sixtyDays, ninetyDaysPlus }
 *   FP-cycle config (cfo_config upsert):
 *     GET /api/finance/cfo-config        → all config rows
 *     PUT /api/finance/cfo-config/:key   → update one rate (drives INPS/JSHD/employer/limit)
 *
 *   EP design tokens + templates only (Qoida 21/41); F1 loading skeletons; F2 mutation onError.
 * @layer Frontend page (Finance / Accounting)
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingDown, TrendingUp, Save, Settings, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EPPageHeader, EPKpiCard, EPErrorState, EPSkeletonTable } from "@/components/ep";

// ─── BE result shapes (mirror ar-aging.handler / ap-aging.handler) ──────────────────────────
interface AgingBucket {
  days: string;
  amount: number;
  invoiceCount: number;
  percentage: number;
  ecl?: number;
  eclRate?: number;
}
interface ArAgingResult {
  totalAr: number;
  totalEcl: number;
  current: AgingBucket;
  thirtyDays: AgingBucket;
  sixtyDays: AgingBucket;
  ninetyDaysPlus: AgingBucket;
  asOf: string;
}
interface ApAgingResult {
  totalAp: number;
  current: AgingBucket;
  thirtyDays: AgingBucket;
  sixtyDays: AgingBucket;
  ninetyDaysPlus: AgingBucket;
  asOf: string;
}
interface CfoConfigRow {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: string;
}

// FP-cycle (financial-period) configurable rates — the INPS/JSHD set that was hardcoded.
const FP_CYCLE_KEYS = [
  "payroll_inps_rate",
  "payroll_jshd_rate",
  "payroll_employer_social_rate",
  "cashier_daily_cash_limit_uzs",
] as const;
const FP_KEY_LABEL: Record<string, string> = {
  payroll_inps_rate: "INPS — daromad solig'i",
  payroll_jshd_rate: "JSHD — xodim ijtimoiy hissasi",
  payroll_employer_social_rate: "Ish beruvchi ijtimoiy soliq (ESP)",
  cashier_daily_cash_limit_uzs: "Kassir kunlik naqd limiti (UZS)",
};
const isRateKey = (k: string) => k !== "cashier_daily_cash_limit_uzs";

export default function ArApAging() {
  const { t } = useTranslation("finance");
  const { toast } = useToast();
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const arQuery = useQuery<ArAgingResult>({
    queryKey: ["/api/ar/ecl-aging"],
    queryFn: () => apiRequest("GET", "/api/ar/ecl-aging"),
  });
  const apQuery = useQuery<ApAgingResult>({
    queryKey: ["/api/ap/ecl-aging"],
    queryFn: () => apiRequest("GET", "/api/ap/ecl-aging"),
  });
  const configQuery = useQuery<CfoConfigRow[]>({
    queryKey: ["/api/finance/cfo-config"],
    queryFn: () => apiRequest("GET", "/api/finance/cfo-config"),
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      apiRequest("PUT", `/api/finance/cfo-config/${key}`, { value }),
    onSuccess: (_d, vars) => {
      toast({ title: t("arApAging.saved", "Saqlandi"), description: FP_KEY_LABEL[vars.key] ?? vars.key });
      setEditValues((prev) => { const n = { ...prev }; delete n[vars.key]; return n; });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cfo-config"] });
    },
    onError: () => toast({ title: t("error", "Xatolik"), description: t("arApAging.saveFailed", "Saqlab bo'lmadi"), variant: "destructive" }),
  });

  const refreshAll = () => {
    void arQuery.refetch();
    void apQuery.refetch();
    void configQuery.refetch();
  };

  const handleSaveConfig = (key: string) => {
    const num = parseFloat(editValues[key] ?? "");
    if (isNaN(num) || num < 0) {
      toast({ title: t("error", "Xatolik"), description: t("arApAging.invalidNumber", "Noto'g'ri qiymat"), variant: "destructive" });
      return;
    }
    if (isRateKey(key) && num > 1) {
      toast({ title: t("error", "Xatolik"), description: t("arApAging.rateRange", "Stavka 0-1 oralig'ida (masalan 0.12)"), variant: "destructive" });
      return;
    }
    updateConfigMutation.mutate({ key, value: num });
  };

  if (arQuery.isError && apQuery.isError) {
    return <EPErrorState onRetry={refreshAll} error={arQuery.error as Error} />;
  }

  const arBuckets = arQuery.data
    ? [arQuery.data.current, arQuery.data.thirtyDays, arQuery.data.sixtyDays, arQuery.data.ninetyDaysPlus]
    : [];
  const apBuckets = apQuery.data
    ? [apQuery.data.current, apQuery.data.thirtyDays, apQuery.data.sixtyDays, apQuery.data.ninetyDaysPlus]
    : [];

  const fpConfigs = (Array.isArray(configQuery.data) ? configQuery.data : []).filter((c) =>
    (FP_CYCLE_KEYS as readonly string[]).includes(c.configKey),
  );

  return (
    <div className="flex flex-col h-full gap-5 p-4">
      <EPPageHeader
        data-testid="text-page-title"
        icon={<TrendingDown className="h-5 w-5" />}
        title={t("arApAging.title", "Debitor / Kreditor — yoshlanish (aging)")}
        subtitle={t("arApAging.subtitle", "Muddati bo'yicha debitorlik va kreditorlik qarzlari + FP-tsikl sozlamalari")}
        actions={
          <Button variant="ghost" size="sm" onClick={refreshAll} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      <Tabs defaultValue="debitor" className="flex-1 flex flex-col">
        <TabsList data-testid="tabs-aging">
          <TabsTrigger value="debitor" data-testid="tab-debitor">
            <TrendingDown className="h-4 w-4 mr-1" /> {t("arApAging.tabDebitor", "Debitor (AR)")}
          </TabsTrigger>
          <TabsTrigger value="kreditor" data-testid="tab-kreditor">
            <TrendingUp className="h-4 w-4 mr-1" /> {t("arApAging.tabKreditor", "Kreditor (AP)")}
          </TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">
            <Settings className="h-4 w-4 mr-1" /> {t("arApAging.tabConfig", "FP-tsikl sozlamalari")}
          </TabsTrigger>
        </TabsList>

        {/* Debitor (AR) — ECL aging */}
        <TabsContent value="debitor" className="mt-3 space-y-4">
          {arQuery.isLoading ? (
            <EPSkeletonTable rows={5} />
          ) : (
            <>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                <EPKpiCard label={t("arApAging.totalAr", "Jami debitorlik")} icon={TrendingDown} staticValue={formatCurrency(Number(arQuery.data?.totalAr ?? 0))} />
                <EPKpiCard label={t("arApAging.totalEcl", "Kutilayotgan kredit yo'qotishi (ECL)")} icon={Percent} staticValue={formatCurrency(Number(arQuery.data?.totalEcl ?? 0))} iconBg="#ef4444" />
                <EPKpiCard label={t("arApAging.asOf", "Holat sanasi")} icon={RefreshCw} staticValue={arQuery.data?.asOf ? new Date(arQuery.data.asOf).toLocaleDateString() : "—"} />
              </div>
              <Table data-testid="table-ar-aging">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("arApAging.colBucket", "Muddat")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colCount", "Hisob-faktura")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colAmount", "Summa")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colPct", "%")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colEclRate", "ECL stavka")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colEcl", "ECL")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arBuckets.map((b) => (
                    <TableRow key={b.days} data-testid={`row-ar-${b.days}`}>
                      <TableCell className="font-medium">{b.days}</TableCell>
                      <TableCell className="text-right">{b.invoiceCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(b.amount))}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Number(b.percentage).toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-muted-foreground">{((b.eclRate ?? 0) * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(Number(b.ecl ?? 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </TabsContent>

        {/* Kreditor (AP) — aging (no ECL on payables) */}
        <TabsContent value="kreditor" className="mt-3 space-y-4">
          {apQuery.isLoading ? (
            <EPSkeletonTable rows={5} />
          ) : (
            <>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                <EPKpiCard label={t("arApAging.totalAp", "Jami kreditorlik")} icon={TrendingUp} staticValue={formatCurrency(Number(apQuery.data?.totalAp ?? 0))} iconBg="#f59e0b" />
                <EPKpiCard label={t("arApAging.asOf", "Holat sanasi")} icon={RefreshCw} staticValue={apQuery.data?.asOf ? new Date(apQuery.data.asOf).toLocaleDateString() : "—"} />
              </div>
              <Table data-testid="table-ap-aging">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("arApAging.colBucket", "Muddat")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colCount", "Hisob-faktura")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colAmount", "Summa")}</TableHead>
                    <TableHead className="text-right">{t("arApAging.colPct", "%")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apBuckets.map((b) => (
                    <TableRow key={b.days} data-testid={`row-ap-${b.days}`}>
                      <TableCell className="font-medium">{b.days}</TableCell>
                      <TableCell className="text-right">{b.invoiceCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(b.amount))}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Number(b.percentage).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </TabsContent>

        {/* FP-cycle config — INPS / JSHD / employer / cashier limit (cfo_config upsert) */}
        <TabsContent value="config" className="mt-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("arApAging.fpCycleTitle", "FP-tsikl: soliq stavkalari va limitlar")}</CardTitle>
              <CardDescription>
                {t("arApAging.fpCycleDesc", "INPS/JSHD stavkalari ilgari kod ichida qattiq yozilgan edi — endi shu yerdan sozlanadi (qayta kompilyatsiyasiz).")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configQuery.isLoading ? (
                <EPSkeletonTable rows={4} />
              ) : fpConfigs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("arApAging.noConfig", "Sozlamalar topilmadi")}</p>
              ) : (
                <div className="divide-y">
                  {fpConfigs.map((cfg) => {
                    const editing = editValues[cfg.configKey] !== undefined;
                    const displayVal = editing ? editValues[cfg.configKey] : cfg.configValue;
                    const rate = isRateKey(cfg.configKey);
                    return (
                      <div key={cfg.configKey} className="flex items-center justify-between gap-3 py-3" data-testid={`config-row-${cfg.configKey}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{FP_KEY_LABEL[cfg.configKey] ?? cfg.configKey}</p>
                          <p className="text-xs text-muted-foreground truncate">{cfg.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {rate && !editing && (
                            <Badge variant="outline" className="text-xs">{(parseFloat(cfg.configValue) * 100).toFixed(1)}%</Badge>
                          )}
                          <Input
                            type="number"
                            step={rate ? "0.01" : "1000"}
                            min={0}
                            max={rate ? 1 : undefined}
                            className="w-32 h-9 text-xs"
                            value={displayVal}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, [cfg.configKey]: e.target.value }))}
                            data-testid={`input-${cfg.configKey}`}
                          />
                          <Button
                            size="sm"
                            variant={editing ? "default" : "outline"}
                            className="h-9 px-2"
                            disabled={!editing || updateConfigMutation.isPending}
                            onClick={() => handleSaveConfig(cfg.configKey)}
                            data-testid={`button-save-${cfg.configKey}`}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
