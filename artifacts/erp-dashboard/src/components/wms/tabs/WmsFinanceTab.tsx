/**
 * @module WmsFinanceTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, BarChart2 } from "lucide-react";
import { fmtMoney, fmtDate } from "@/components/wms/helpers";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { FinanceData, MaterialBasic } from "@/components/wms/wms-types";
import { useTranslation } from '@/lib/i18n';

interface WmsFinanceTabProps {
  finance: FinanceData | null | undefined;
  basic: MaterialBasic;
}

export function WmsFinanceTab({ finance, basic }: WmsFinanceTabProps) {
  const { t } = useTranslation("common");
  if (!finance) return <div className="text-muted-foreground text-sm py-8 text-center">{t("moliyaviyMalumotlarYoq")}</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label={t("joriyOrtNarx")} value={fmtMoney(finance.currentAvgPrice, finance.currency)} sub={`/${basic.unitOfMeasure}`} />
        <KpiCard icon={ShoppingCart} label={t("oxirgiXaridNarxi")} value={fmtMoney(finance.lastPurchasePrice, finance.currency)} sub={`/${basic.unitOfMeasure}`} />
        <KpiCard icon={Package} label={t("omborQiymati")} value={fmtMoney(finance.currentStockValue, finance.currency)} color="text-primary" />
        <KpiCard icon={BarChart2} label="Oylik xarajat (o'rt)" value={fmtMoney(finance.monthlySpendAvg, finance.currency)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("narxMalumotlari")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Joriy o'rtacha narx", value: fmtMoney(finance.currentAvgPrice, finance.currency) },
              { label: "Oxirgi xarid narxi", value: fmtMoney(finance.lastPurchasePrice, finance.currency) },
              { label: "Narx trendi", value: finance.priceTrend === "up" ? "O'sish" : finance.priceTrend === "down" ? "Pasayish" : "Barqaror" },
              { label: "Yillik xarajat (taxmin)", value: fmtMoney(finance.annualSpendEstimate, finance.currency) },
            ]).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("yetkazibBeruvchi")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              {finance.supplierName && <div className="flex justify-between"><span className="text-muted-foreground">{t("nomi1")}</span><span className="font-medium">{finance.supplierName}</span></div>}
              {finance.vendor && <div className="flex justify-between"><span className="text-muted-foreground">{t("shahri")}</span><span>{finance.vendor?.city || "—"}</span></div>}
              {fmtDate(basic.lastPurchaseDate) !== "—" && <div className="flex justify-between"><span className="text-muted-foreground">{t("oxirgiXaridSanasi")}</span><span>{fmtDate(basic.lastPurchaseDate)}</span></div>}
              {!finance.supplierName && !finance.vendor && <p className="text-muted-foreground text-xs">{t("yetkazibBeruvchiMalumotiYoq")}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
