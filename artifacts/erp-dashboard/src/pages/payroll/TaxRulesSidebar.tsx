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

interface TaxRulesSidebarProps {
  taxRules: PayrollTaxRule[];
  taxRulesLoading: boolean;
  minWage: number;
}

export function TaxRulesSidebar({ taxRules, taxRulesLoading, minWage }: TaxRulesSidebarProps) {
  const { t: tFinance } = useTranslation('finance');

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
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
                    <p className="font-medium text-orange-600">INPS</p>
                    <p className="text-xs text-muted-foreground">{tFinance('pensionFund')}</p>
                  </div>
                  <Badge className="bg-orange-500 text-white">12%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600">JSHD</p>
                    <p className="text-xs text-muted-foreground">{tFinance('incomeTax')}</p>
                  </div>
                  <Badge className="bg-red-500 text-white">12%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-600">{tFinance('minWageGuarantee')}</p>
                    <p className="text-xs text-muted-foreground">{tFinance('minWageGuarantee')}</p>
                  </div>
                  <Badge className="bg-green-500 text-white">{formatCurrency(minWage)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="text-sm space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              {tFinance('importantNotes')}
            </h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
              <li>INPS va JSHD yalpi ish haqidan hisoblanadi</li>
              <li>Minimal ish haqi kafolati faol bo'lsa, sof ish haqi min. darajadan kam bo'lmaydi</li>
              <li>Avans va qarzlar sof ish haqidan ushlab qolinadi</li>
            </ul>
          </div>

          {taxRulesLoading ? (
            <Skeleton className="h-20 w-full" />
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
            <Badge className="bg-blue-500 text-white shrink-0">Ishbay</Badge>
            <p className="text-xs text-muted-foreground">O'zgarmas oylik maosh. Belgilangan summa oylik sifatida to'lanadi.</p>
          </div>
          <div className="flex items-start gap-3 p-2 rounded bg-purple-500/10">
            <Badge className="bg-purple-500 text-white shrink-0">Vaqtbay</Badge>
            <p className="text-xs text-muted-foreground">Soatlik to'lov. Ishlagan soatlar × soatlik stavka.</p>
          </div>
          <div className="flex items-start gap-3 p-2 rounded bg-green-500/10">
            <Badge className="bg-green-500 text-white shrink-0">Donabay</Badge>
            <p className="text-xs text-muted-foreground">Mahsulot bo'yicha to'lov. Ishlab chiqarilgan birliklar × birlik narxi.</p>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
