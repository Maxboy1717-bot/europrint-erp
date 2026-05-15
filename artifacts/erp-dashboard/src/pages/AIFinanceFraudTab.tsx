/**
 * @module AIFinanceFraudTab
 * @description FraudTab component for the AI Finance page.
 * Analyses a transaction and returns a fraud risk score.
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import type { FraudRisk } from "./AIFinancePageTypes";
import { riskColor } from "./AIFinancePageTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
function riskBadge(s: string) {
  const { t } = useTranslation("common");
  if (s === "HIGH")   return <Badge variant="error">{t("yuqoriXavf")}</Badge>;
  if (s === "MEDIUM") return <Badge variant="warning">{t("ortaXavf")}</Badge>;
  return                     <Badge variant="success">{t("pastXavf")}</Badge>;
}

export function FraudTab() {
  const { t } = useTranslation("common");
  const [fields, setFields] = useState({
    amount: "",
    vendor: "",
    description: "",
    paymentMethod: "",
    invoiceDate: "",
  });
  const [result, setResult] = useState<FraudRisk | null>(null);

  const mutation = useMutation({
    mutationFn: (transactionData: Record<string, unknown>) =>
      apiRequest<FraudRisk>("POST", "/api/ai/finance/fraud-risk", { transactionData }),
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData: Record<string, unknown> = {};
    if (fields.amount)        transactionData["amount"]        = parseFloat(fields.amount);
    if (fields.vendor)        transactionData["vendor"]        = fields.vendor;
    if (fields.description)   transactionData["description"]   = fields.description;
    if (fields.paymentMethod) transactionData["paymentMethod"] = fields.paymentMethod;
    if (fields.invoiceDate)   transactionData["invoiceDate"]   = fields.invoiceDate;
    mutation.mutate(transactionData);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("shubhaliTranzaksiyaniTekshiringAiFraud")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Miqdor (UZS)</Label>
            <Input type="number" value={fields.amount} onChange={e => setFields(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("tolovUsuli")}</Label>
            <Input value={fields.paymentMethod} onChange={e => setFields(p => ({ ...p, paymentMethod: e.target.value }))} placeholder={t("naqdBankKarta")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Yetkazuvchi / Kontragent</Label>
            <Input value={fields.vendor} onChange={e => setFields(p => ({ ...p, vendor: e.target.value }))} placeholder={t("kompaniyaYokiShaxsNomi")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>{t("progress.description")}</Label>
            <Input value={fields.description} onChange={e => setFields(p => ({ ...p, description: e.target.value }))} placeholder={t("tranzaksiyaMaqsadiYokiSharh")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("date")}</Label>
            <Input type="date" value={fields.invoiceDate} onChange={e => setFields(p => ({ ...p, invoiceDate: e.target.value }))} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending
            ? <><EPLoader className="mr-2" />{t("tekshirilmoqda")}</>
            : <><ShieldAlert className="h-4 w-4 mr-2" />{t("fraudXavfiniBaholash")}</>}
        </Button>
      </form>

      {mutation.isError && (
        <p className="text-sm text-[var(--ep-red)] text-center">{t("xatolikYuzBerdi")}</p>
      )}

      {result && (
        <Card className={`border-2 ${result.riskLevel === "HIGH" ? "border-red-300" : result.riskLevel === "MEDIUM" ? "border-yellow-300" : "border-green-300"}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className={`h-5 w-5 ${result.riskLevel === "HIGH" ? "text-[var(--ep-red)]" : result.riskLevel === "MEDIUM" ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"}`} />
                {t("fraudBaholashNatijasi")}
              </CardTitle>
              {riskBadge(result.riskLevel)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{t("xavfDarajasi")}</span>
                <span className="font-bold">{result.riskScore}/100</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full transition-all ${riskColor(result.riskScore)}`} style={{ width: `${result.riskScore}%` }} />
              </div>
            </div>
            {result.redFlags.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-medium text-[var(--ep-red)] flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {t("qizilBayroqlar")}
                </h5>
                {result.redFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-3 w-3 mt-0.5 text-red-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {result.redFlags.length === 0 && result.riskLevel === "LOW" && (
              <div className="flex items-center gap-2 text-[var(--ep-green)] text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t("shubhaliBelgilarAniqlanmadi")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
