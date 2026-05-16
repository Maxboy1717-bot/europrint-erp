/**
 * @module AIFinancePageSections2
 * @description Budget variance and invoice classification tab components
 * for the AI Finance page.
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, AlertTriangle, TrendingUp, TrendingDown, FileText, CheckCircle2 } from "lucide-react";
import type { BudgetVariance, InvoiceClassification } from "./AIFinancePageTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── Badge helpers ─────────────────────────────────────────────────────────────

function trendBadge(trend: string) {
  const { t } = useTranslation("common");
  if (trend === "IMPROVING")  return <Badge variant="success">{t("yaxshilanmoqda")}</Badge>;
  if (trend === "WORSENING")  return <Badge variant="error">{t("yomonlashmoqda")}</Badge>;
  return                            <Badge variant="info">{t("barqaror")}</Badge>;
}

// ─── BudgetVarianceTab ────────────────────────────────────────────────────────

export function BudgetVarianceTab() {
  const { t } = useTranslation("common");
  const [form, setForm] = useState({ category: "", budgeted: "", actual: "", context: "" });
  const [result, setResult] = useState<BudgetVariance | null>(null);

  const mutation = useMutation({
    mutationFn: (body: { category: string; budgeted: number; actual: number; context: string }) =>
      apiRequest<BudgetVariance>("POST", "/api/ai/finance/budget-variance", body),
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.budgeted || !form.actual) return;
    mutation.mutate({
      category: form.category,
      budgeted: parseFloat(form.budgeted),
      actual: parseFloat(form.actual),
      context: form.context,
    });
  };

  const variance = form.budgeted && form.actual
    ? ((parseFloat(form.actual) - parseFloat(form.budgeted)) / parseFloat(form.budgeted)) * 100
    : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("byudjetOgishiniKiritingAiSabablari")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>{t("category")}</Label>
            <Input
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              placeholder={t("masalanMarketingXarajatlariIshlabChiqarish")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("rejalashtirilganUzs")}</Label>
            <Input
              type="number"
              value={form.budgeted}
              onChange={e => setForm(p => ({ ...p, budgeted: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("haqiqiyUzs")}</Label>
            <Input
              type="number"
              value={form.actual}
              onChange={e => setForm(p => ({ ...p, actual: e.target.value }))}
              placeholder="0"
            />
          </div>
          {variance !== null && (
            <div className="col-span-2 flex items-center gap-2 text-sm">
              {variance > 0
                ? <TrendingUp className="h-4 w-4 text-[var(--ep-red)]" />
                : <TrendingDown className="h-4 w-4 text-[var(--ep-green)]" />}
              <span className={variance > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}>
                Og'ish: {variance > 0 ? "+" : ""}{variance.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="col-span-2 space-y-1.5">
            <Label>{t("qoShimchaKontekstIxtiyoriy")}</Label>
            <Input
              value={form.context}
              onChange={e => setForm(p => ({ ...p, context: e.target.value }))}
              placeholder={t("masalanYangiKampaniyaBoshlandiXomashyo")}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || !form.category || !form.budgeted || !form.actual}
        >
          {mutation.isPending
            ? <><EPLoader className="mr-2" />{t("tahlilQilinmoqda")}</>
            : <><Brain className="h-4 w-4 mr-2" />{t("aiTahlili")}</>}
        </Button>
      </form>

      {mutation.isError && (
        <p className="text-sm text-[var(--ep-red)] text-center">{t("error.generic")}</p>
      )}

      {result && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("tahlilNatijasi")}</CardTitle>
              <div className="flex items-center gap-2">
                {trendBadge(result.trend)}
                {result.isAcceptable
                  ? <Badge variant="success">{t("qabulQilinadi")}</Badge>
                  : <Badge variant="error">{t("muhimOgish")}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
              <span className="text-sm text-muted-foreground">{t("ogishFoizi")}</span>
              <span className={`font-bold text-sm ${Math.abs(result.variancePercent) > 15 ? "text-[var(--ep-red)]" : "text-[var(--ep-yellow)]"}`}>
                {result.variancePercent > 0 ? "+" : ""}{result.variancePercent}%
              </span>
            </div>
            {result.mainCauses.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-[var(--ep-yellow)]" /> {t("asosiySabablari")}
                </h5>
                {result.mainCauses.map((c, i) => (
                  <p key={i} className="text-sm text-muted-foreground ml-4">• {c}</p>
                ))}
              </div>
            )}
            {result.correctionActions.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[var(--ep-green)]" /> {t("tuzatishChoralari")}
                </h5>
                {result.correctionActions.map((a, i) => (
                  <p key={i} className="text-sm text-muted-foreground ml-4">• {a}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── InvoiceTab ───────────────────────────────────────────────────────────────

export function InvoiceTab() {
  const { t } = useTranslation("common");
  const [form, setForm] = useState({ description: "", amount: "", vendor: "" });
  const [result, setResult] = useState<InvoiceClassification | null>(null);

  const mutation = useMutation({
    mutationFn: (body: { description: string; amount: number; vendor: string }) =>
      apiRequest<InvoiceClassification>("POST", "/api/ai/finance/classify-invoice", body),
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.vendor) return;
    mutation.mutate({
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      vendor: form.vendor,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("fakturaMalumotlariniKiritingAiKategoriya")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t("yetkazuvchiVendor")}</Label>
          <Input
            value={form.vendor}
            onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))}
            placeholder={t("masalanQogozZavodiItKompaniya")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("progress.description")}</Label>
          <Input
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder={t("fakturaTavsifiYokiMahsulotNomi")}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("miqdorUzs")}</Label>
          <Input
            type="number"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            placeholder="0"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || !form.description || !form.vendor}
        >
          {mutation.isPending
            ? <><EPLoader className="mr-2" />{t("tasniflanmoqda")}</>
            : <><FileText className="h-4 w-4 mr-2" />{t("fakturaniTasnifla")}</>}
        </Button>
      </form>

      {mutation.isError && (
        <p className="text-sm text-[var(--ep-red)] text-center">{t("xatolikYuzBerdi")}</p>
      )}

      {result && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("tasnifNatijasi")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("category")}</p>
                  <p className="font-medium text-sm">{result.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("subkategoriya")}</p>
                  <p className="font-medium text-sm">{result.subcategory || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("soliqKodi")}</p>
                  <p className="font-medium text-sm">{result.taxCode || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-0.5">{t("ishonchlilik")}</p>
                  <p className="font-medium text-sm">{result.confidence}%</p>
                </div>
              </div>
              <Progress value={result.confidence} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

