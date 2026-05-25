/**
 * @module FinanceTab
 * @description React UI component.
 */

import { SdFinanceData } from "./sd-types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, AlertTriangle, TrendingUp, Star, Wallet, CreditCard } from "lucide-react";
import { KpiCard, PaymentRatingBadge, fmtMoney, fmtDate, fmtNum } from "./helpers";
import { useTranslation } from '@/lib/i18n';

export function FinanceTab({ finance }: { finance: SdFinanceData }) {
  const { t } = useTranslation("common");
  if (!finance) return <div className="text-muted-foreground text-sm py-8 text-center">{t("moliyaviyMalumotlarYoq")}</div>;

  // Handle both old and new response shapes
  const totalDebt = finance.totalDebt ?? finance.openDebt ?? 0;
  const creditLimit = finance.creditLimit ?? 0;
  const overdueDebt = finance.overdueDebt ?? 0;
  const availableCredit = finance.availableCredit ?? (creditLimit - Number(totalDebt));
  const debtPercent = creditLimit > 0 ? Math.min(100, (Number(totalDebt) / creditLimit) * 100) : 0;
  const totalRevenue = (finance.totalRevenue ?? 0) as number;
  const totalPaid = (finance.totalPaid ?? 0) as number;
  const avgOrderValue = (finance.avgOrderValue ?? 0) as number;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label={t("jamiDaromad")} value={fmtMoney(totalRevenue)}
          color="text-[var(--ep-green)]" gradient="" />
        <KpiCard icon={Wallet} label={t("tolangan")} value={fmtMoney(totalPaid)}
          color="text-[var(--ep-blue)]" gradient="" />
        <KpiCard icon={AlertTriangle} label={t("ochiqQarz")} value={fmtMoney(totalDebt)}
          color={Number(totalDebt) > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]"}
          gradient="" />
        <KpiCard icon={TrendingUp} label={t("ortachaBuyurtma")} value={fmtMoney(avgOrderValue)}
          gradient="" />
      </div>

      {/* Credit limit bar */}
      {creditLimit > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />{t("kreditLimitiHolati")}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("ishlatilgan")}<span className="font-medium text-foreground">{fmtMoney(totalDebt)}</span></span>
              <span className="text-muted-foreground">{t("limit")}<span className="font-medium text-foreground">{fmtMoney(creditLimit)}</span></span>
            </div>
            <Progress value={debtPercent}
              className={`h-2.5 rounded-full ${debtPercent > 80 ? "[&>div]:bg-rose-500" : debtPercent > 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />
            <p className="text-xs text-muted-foreground">
              {debtPercent.toFixed(1)}% ishlatilgan &middot; To'lov muddati: {finance.paymentTermsDays || 30} kun
            </p>
          </div>
        </div>
      )}

      {/* Overdue breakdown */}
      {(finance.overdueBreakdown?.days1_30 > 0 || finance.overdueBreakdown?.days31_60 > 0 ||
        finance.overdueBreakdown?.days61_90 > 0 || finance.overdueBreakdown?.days90Plus > 0) && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">{t("muddatiOtganQarzlarTaqsimoti")}</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "1-30 kun", val: finance.overdueBreakdown?.days1_30, cls: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200" },
                { label: "31-60 kun", val: finance.overdueBreakdown?.days31_60, cls: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200" },
                { label: "61-90 kun", val: finance.overdueBreakdown?.days61_90, cls: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200" },
                { label: "90+ kun", val: finance.overdueBreakdown?.days90Plus, cls: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200" },
              ].map(item => (
                <div key={item.label} className={`p-3 rounded-xl text-center border ${item.cls}`}>
                  <p className="text-[11px] font-medium">{item.label}</p>
                  <p className="text-sm font-bold mt-1">{fmtMoney(item.val)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment discipline */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />{t("tolovIntizomi")}
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t("tolovReytingi")}</span>
            <PaymentRatingBadge rating={finance.paymentRating || "A"} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("ortachaKechikish")}</span>
            <span className={Number(finance.averagePaymentDelayDays || 0) > 30 ? "text-destructive font-medium" : "font-medium"}>
              {Math.round(finance.averagePaymentDelayDays || 0)} kun
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("ozVaqtidaTolagan")}</span>
            <span className="font-medium">{finance.onTimePaymentRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      {(finance.recentInvoices || []).length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">{t("songgiInvoicelar")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {["Invoice №", "Sana", "Muddati", "Summa", "Qoldiq", "Holat"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(finance.recentInvoices || []).map((inv) => {
                  const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.payment_status !== "paid";
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-3 py-2.5 text-xs">{fmtDate(inv.invoice_date)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : ""}`}>{fmtDate(inv.due_date)}</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{fmtMoney(inv.total_amount)}</td>
                      <td className="px-3 py-2.5">{fmtMoney(inv.balance)}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={inv.payment_status === "paid" ? "default" : "destructive"} className="text-[10px]">
                          {inv.payment_status === "paid" ? "To'landi" : "To'lanmagan"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments list from 360 data */}
      {((finance.payments as unknown[] | undefined) || []).length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">{t("tolovlarTarixi")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  {["Sana", "Summa", "Usul", "Holat"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(finance.payments as { id: number; paymentDate: string; amount: number; method: string; status: string }[]).map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs">{fmtDate(p.paymentDate)}</td>
                    <td className="px-4 py-2.5 font-medium">{fmtMoney(p.amount)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.method || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                        {p.status || "To'langan"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
