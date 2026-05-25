/**
 * @module TaxRulesSidebar
 * @description React page component. Route-level UI.
 */

import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { Percent, AlertCircle, TrendingUp, RefreshCw } from "lucide-react";
import type { PayrollTaxRule } from "./types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { EPStatusPill } from "@/components/ep";

interface TaxRulesSidebarProps {
  taxRules: PayrollTaxRule[];
  taxRulesLoading: boolean;
  minWage: number;
}

export function TaxRulesSidebar({ taxRules, taxRulesLoading, minWage }: TaxRulesSidebarProps) {
  const { t } = useTranslation("common");
  const { t: tFinance } = useTranslation('finance');

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            {tFinance('taxRules')}
          </CardTitle>
          <CardDescription>{tFinance('taxRules')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Card className="bg-orange-500/10 border-orange-500/30">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--ep-primary)]">INPS</p>
                    <p className="text-xs text-muted-foreground">{tFinance('pensionFund')}</p>
                  </div>
                  <Badge className="bg-[var(--ep-primary)] text-white">12%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--ep-red)]">JSHD</p>
                    <p className="text-xs text-muted-foreground">{tFinance('incomeTax')}</p>
                  </div>
                  <EPStatusPill tone="danger">12%</EPStatusPill>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--ep-green)]">{tFinance('minWageGuarantee')}</p>
                    <p className="text-xs text-muted-foreground">{tFinance('minWageGuarantee')}</p>
                  </div>
                  <EPStatusPill tone="success">{formatCurrency(minWage)}</EPStatusPill>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="text-sm space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--ep-blue)]" />
              {tFinance('importantNotes')}
            </h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
              <li>{t("inpsVaJshdYalpiIsh")}</li>
              <li>{t("minimalIshHaqiKafolatiFaol")}</li>
              <li>{t("avansVaQarzlarSofIsh")}</li>
            </ul>
          </div>

          {taxRulesLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : taxRules.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{tFinance('taxRules')}</h4>
                {(Array.isArray(taxRules) ? taxRules : []).map((rule) => (
                  <div key={rule.id} className="flex justify-between text-xs p-2 bg-muted rounded">
                    <span>{rule.taxName}</span>
                    <Badge variant="outline" className="text-xs">{rule.rate}%</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            {tFinance('paymentTypes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-2 rounded bg-blue-500/10">
            <EPStatusPill tone="info">{t("ishbay")}</EPStatusPill>
            <p className="text-xs text-muted-foreground">{t("ozgarmasOylikMaoshBelgilanganSumma")}</p>
          </div>
          <div className="flex items-start gap-3 p-2 rounded bg-purple-500/10">
            <Badge className="bg-[var(--ep-purple)] text-white shrink-0">{t("vaqtbay")}</Badge>
            <p className="text-xs text-muted-foreground">{t("soatlikTolovIshlaganSoatlarSoatlik")}</p>
          </div>
          <div className="flex items-start gap-3 p-2 rounded bg-green-500/10">
            <EPStatusPill tone="success">{t("donabay")}</EPStatusPill>
            <p className="text-xs text-muted-foreground">{t("mahsulotBoyichaTolovIshlabChiqarilgan")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
