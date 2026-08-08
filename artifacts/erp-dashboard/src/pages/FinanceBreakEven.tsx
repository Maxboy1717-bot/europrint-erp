/**
 * @module FinanceBreakEven
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, AlertCircle, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { EPPageHeader } from "@/components/ep";

interface BreakEvenDto {
  productName: string;
  period: string;
  fixedCostUzs: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  contributionMargin: number;
  breakEvenQty: number;
  breakEvenRevenue: number;
  marginOfSafetyQty: number;
  marginOfSafetyPct: number;
  degreesOfOperatingLeverage: number;
  actualSalesQty: number;
  warning: string | null;
}

function buildChartData(d: BreakEvenDto) {
  const maxUnits = Math.ceil(d.breakEvenQty * 2.5);
  const step     = Math.max(1, Math.floor(maxUnits / 12));
  const points   = [];
  for (let u = 0; u <= maxUnits; u += step) {
    points.push({
      units:     u,
      revenue:   parseFloat((u * d.sellingPricePerUnit).toFixed(0)),
      totalCost: parseFloat((d.fixedCostUzs + u * d.variableCostPerUnit).toFixed(0)),
    });
  }
  return points;
}

const CostStructureSchema = z.object({
  productName: z.string().min(1),
  period: z.string().min(1),
  fixedCostUzs: z.number().positive(),
  variableCostUzs: z.number().positive(),
  sellingPriceUzs: z.number().positive(),
});

export default function FinanceBreakEven() {
  const { t } = useTranslation('finance');
  const qc = useQueryClient();
  const [form, setForm] = useState({
    productName: "",
    period: new Date().toISOString().slice(0, 7),
  });
  useForm({ resolver: zodResolver(CostStructureSchema), defaultValues: { productName: "", period: new Date().toISOString().slice(0, 7), fixedCostUzs: 0, variableCostUzs: 0, sellingPriceUzs: 0 } });
  const [structForm, setStructForm] = useState({
    productName: "",
    period: new Date().toISOString().slice(0, 7),
    fixedCostUzs: "",
    variableCostUzs: "",
    sellingPriceUzs: "",
  });
  const [showStructForm, setShowStructForm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery<BreakEvenDto>({
    queryKey: ["break-even", form.productName, form.period],
    queryFn: () =>
      apiRequest("GET", `/api/finance/break-even?productName=${encodeURIComponent(form.productName)}&period=${form.period}`),
    enabled: false,
    retry: false,
  });

  const saveMut = useMutation({
    mutationFn: (body: typeof structForm) =>
      apiRequest("POST", "/api/finance/break-even/cost-structure", {
        productName:     body.productName,
        period:          body.period,
        fixedCostUzs:    Number(body.fixedCostUzs),
        variableCostUzs: Number(body.variableCostUzs),
        sellingPriceUzs: Number(body.sellingPriceUzs),
      }),
    onSuccess: () => {
      setShowStructForm(false);
      qc.invalidateQueries({ queryKey: ["break-even"] });
    },
  });

  const chartData = data ? buildChartData(data) : [];
  const cmrPct    = data
    ? ((data.contributionMargin / data.sellingPricePerUnit) * 100).toFixed(1)
    : "—";

  return (
    <div className="flex flex-col gap-6 p-6">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('breakEvenAnalysis')}</b></>}
        title={t('breakEvenAnalysis')}
        subtitle={t('breakEvenSubtitle')}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('analysisParams')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-40">
              <Label>{t('productNameLabel')}</Label>
              <Input
                placeholder={t('productPlaceholder')}
                value={form.productName}
                onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              />
            </div>
            <div>
              <Label>{t('periodLabel')}</Label>
              <Input
                placeholder="2026-04"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} disabled={!form.productName || !form.period || isLoading}>
              <Calculator className="h-4 w-4 mr-2" />
              {isLoading ? t('calculatingBtn') : t('calculateBtn')}
            </Button>
            <Button variant="outline" onClick={() => setShowStructForm(!showStructForm)}>
              {showStructForm ? t('closeBtn') : t('addCostStructure')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showStructForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('addCostStructure')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="col-span-2">
                <Label>{t('productNameLabel')} *</Label>
                <Input value={structForm.productName} onChange={e => setStructForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
              <div>
                <Label>{t('periodLabel')} *</Label>
                <Input value={structForm.period} onChange={e => setStructForm(f => ({ ...f, period: e.target.value }))} />
              </div>
              <div>
                <Label>{t('fixedCostLabel')} (UZS) *</Label>
                <Input type="number" value={structForm.fixedCostUzs} onChange={e => setStructForm(f => ({ ...f, fixedCostUzs: e.target.value }))} />
              </div>
              <div>
                <Label>{t('vcPerUnit')} *</Label>
                <Input type="number" value={structForm.variableCostUzs} onChange={e => setStructForm(f => ({ ...f, variableCostUzs: e.target.value }))} />
              </div>
              <div>
                <Label>{t('spPerUnit')} *</Label>
                <Input type="number" value={structForm.sellingPriceUzs} onChange={e => setStructForm(f => ({ ...f, sellingPriceUzs: e.target.value }))} />
              </div>
            </div>
            <Button
              onClick={() => saveMut.mutate(structForm)}
              disabled={saveMut.isPending || !structForm.productName || !structForm.fixedCostUzs}
            >
              {saveMut.isPending ? t('savingBtn') : t('saveBtn')}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-16 w-full rounded-lg" /></CardContent></Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {String((error as Error)?.message ?? "")}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {data.warning && (
            <Card className="border-[var(--ep-yellow)] bg-[var(--ep-yellow-soft)]">
              <CardContent className="pt-4 pb-4 flex items-center gap-2 text-sm text-[var(--ep-yellow)]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {data.warning}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t('contributionMarginPerUnit')}</div>
                <div className="text-xl font-bold text-[var(--ep-green)]">{formatCurrency(data.contributionMargin)}</div>
                <div className="text-xs text-muted-foreground">CMR: {cmrPct}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t('bepUnits')}</div>
                <div className="text-xl font-bold">{data.breakEvenQty.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">dona</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t('bepRevenue')}</div>
                <div className="text-xl font-bold">{formatCurrency(data.breakEvenRevenue)}</div>
              </CardContent>
            </Card>
            <Card className={data.marginOfSafetyPct >= 0 ? "border-[var(--ep-green)]" : "border-[var(--ep-red)]"}>
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground mb-1">{t('safetyMargin')}</div>
                <div className={`text-xl font-bold ${data.marginOfSafetyPct >= 20 ? "text-[var(--ep-green)]" : data.marginOfSafetyPct >= 0 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
                  {data.marginOfSafetyPct.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">{data.marginOfSafetyQty.toLocaleString()} dona</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('cvpChart')}</CardTitle>
              <CardDescription>{t('cvpSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="units" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1_000_000).toFixed(0) + "M"} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={u => `${u}${t('perUnitLabel')}`} />
                  <Legend />
                  <ReferenceLine
                    x={data.breakEvenQty}
                    stroke="var(--ep-yellow)"
                    strokeDasharray="6 3"
                    label={{ value: t('bepLabel'), fill: "var(--ep-yellow)", fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="revenue"   name={t('revenueLabel')}   stroke="var(--ep-green)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalCost" name={t('totalCostLabel')} stroke="var(--ep-red)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailsSection')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {[
                  [t('fixedCostLabel'),      formatCurrency(data.fixedCostUzs)],
                  [t('vcPerUnit'),            formatCurrency(data.variableCostPerUnit)],
                  [t('spPerUnit'),            formatCurrency(data.sellingPricePerUnit)],
                  [t('actualSalesQty'),       data.actualSalesQty.toLocaleString() + t('unitsSuffix', ' dona')],
                  [t('safetyQty'),            data.marginOfSafetyQty.toLocaleString()],
                  [t('operatingLeverage'),    data.degreesOfOperatingLeverage.toFixed(2) + t('xSuffix', 'x')],
                ].map(([label, value]) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-semibold mt-1">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
