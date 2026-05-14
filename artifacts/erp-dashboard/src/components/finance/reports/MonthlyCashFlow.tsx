/**
 * @module MonthlyCashFlow
 * @description React UI component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { MonthlySummary } from "./types";
import { useTranslation } from '@/lib/i18n';

interface MonthlyCashFlowProps {
  data: MonthlySummary | undefined;
  isLoading: boolean;
}

export function MonthlyCashFlow({ data, isLoading }: MonthlyCashFlowProps) {
  const { t } = useTranslation("common");
  return (
    <Card data-testid="card-cash-flow-statement">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t("pulOqimiTogrisidaHisobot")}
        </CardTitle>
        <CardDescription>{t("bilvositaUsulBoyichaPulOqimi")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>{t("operatsionFaoliyatdanPulOqimi")}</span>
              <span className={`font-medium ${(data?.cashFlowStatement?.operatingActivities || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                {formatCurrency(data?.cashFlowStatement?.operatingActivities || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>{t("investitsiyaFaoliyatidanPulOqimi")}</span>
              <span className={`font-medium ${(data?.cashFlowStatement?.investingActivities || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                {formatCurrency(data?.cashFlowStatement?.investingActivities || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>{t("moliyalashtirishFaoliyatidanPulOqimi")}</span>
              <span className={`font-medium ${(data?.cashFlowStatement?.financingActivities || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                {formatCurrency(data?.cashFlowStatement?.financingActivities || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="font-bold">{t("sofPulOqimi")}</span>
              <span className={`font-bold ${(data?.cashFlowStatement?.netChange || 0) >= 0 ? "text-[var(--ep-blue)]" : "text-[var(--ep-red)]"}`}>
                {formatCurrency(data?.cashFlowStatement?.netChange || 0)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-2">
                <div className="text-xs text-muted-foreground uppercase">{t("davrBoshi")}</div>
                <div className="font-bold">{formatCurrency(data?.cashFlowStatement?.openingBalance || 0)}</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xs text-muted-foreground uppercase">{t("davrOxiri")}</div>
                <div className="font-bold text-[var(--ep-green)]">{formatCurrency(data?.cashFlowStatement?.closingBalance || 0)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
