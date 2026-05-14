/**
 * @module FinanceCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle, formatMoney } from "@/components/director/helpers";
import type { FinanceData } from "@/components/director/types";
import { useTranslation } from '@/lib/i18n';

interface FinanceCardProps {
  fin: FinanceData | undefined;
  finLoad: boolean;
}

export function FinanceCard({ fin, finLoad }: FinanceCardProps) {
  const { t } = useTranslation("common");
  const items = [
    { label: "Jami debitorlik", amount: fin?.totalReceivable ?? 0, sub: `${fin?.invoices?.["pending"]?.count ?? 0} ta to'lov kutmoqda`, ok: (fin?.totalReceivable ?? 0) < 100_000_000, isMain: true },
    { label: "Muddati o'tgan", amount: fin?.overdueAmount ?? 0, sub: `${fin?.invoices?.["overdue"]?.count ?? 0} ta hisob-faktura`, ok: (fin?.overdueAmount ?? 0) === 0 },
    { label: "Kutilayotgan to'lov", amount: fin?.pendingAmount ?? 0, sub: "yaqin kunlarda", ok: true },
  ];

  return (
    <Card data-testid="card-finance">
      <CardHeader className="pb-3">
        <SectionTitle icon={DollarSign} title={t("moliyaviyKorinish")} sub="Joriy oy" accent="text-[var(--ep-green)]" />
      </CardHeader>
      <CardContent>
        {finLoad ? <Skeleton className="h-40 rounded-lg" /> : (
          <div className="space-y-3">
            <div className="space-y-2">
              {(Array.isArray(items) ? items : []).map((item, i) => (
                <div key={`k-${i}`} className={cn("p-3 rounded-lg", item.isMain ? "bg-muted/40" : item.ok ? "bg-muted/20" : "bg-red-50 border border-red-100")} data-testid={`finance-row-${i}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    {!item.ok && <AlertTriangle className="w-3.5 h-3.5 text-[var(--ep-red)]" />}
                  </div>
                  <p className={cn("text-lg font-bold", item.ok ? "text-foreground" : "text-[var(--ep-red)]")}>{formatMoney(item.amount)} so'm</p>
                  <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t("hisobTurlari")}</p>
              {fin?.accounts?.slice(0, 4).map((acc, i) => (
                <div key={`k-${i}`} className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">{acc.type ?? "Boshqa"}</span>
                  <span className="font-semibold text-foreground">{acc.count} ta</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
