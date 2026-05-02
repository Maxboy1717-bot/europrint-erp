import { SdFinanceData } from "./sd-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, AlertTriangle, TrendingUp, Star } from "lucide-react";
import { KpiCard, PaymentRatingBadge, fmtMoney, fmtDate, fmtNum } from "./helpers";

export function FinanceTab({ finance }: { finance: SdFinanceData }) {
  if (!finance) return <div className="text-muted-foreground text-sm py-8 text-center">Moliyaviy ma'lumotlar yo'q</div>;

  const debtPercent = finance.creditLimit > 0 ? Math.min(100, (finance.totalDebt / finance.creditLimit) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="Jami qarz" value={fmtMoney(finance.totalDebt)}
          color={finance.totalDebt > 0 ? "text-red-600" : "text-green-600"} />
        <KpiCard icon={AlertTriangle} label="Muddati o'tgan" value={fmtMoney(finance.overdueDebt)}
          color={finance.overdueDebt > 0 ? "text-destructive" : "text-green-600"} />
        <KpiCard icon={TrendingUp} label="Bo'sh limit" value={fmtMoney(finance.availableCredit)}
          color={finance.availableCredit < 0 ? "text-destructive" : "text-green-600"} />
        <KpiCard icon={Star} label="To'lov reytingi" value={finance.paymentRating || "A"} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Kredit limiti holati</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Ishlatilgan: {fmtMoney(finance.totalDebt)}</span>
            <span>Limit: {fmtMoney(finance.creditLimit)}</span>
          </div>
          <Progress value={debtPercent}
            className={debtPercent > 80 ? "[&>div]:bg-destructive" : debtPercent > 60 ? "[&>div]:bg-yellow-500" : ""} />
          <p className="text-xs text-muted-foreground">
            {debtPercent.toFixed(1)}% ishlatilgan • To'lov muddati: {finance.paymentTermsDays} kun
          </p>
        </CardContent>
      </Card>

      {(finance.overdueBreakdown?.days1_30 > 0 || finance.overdueBreakdown?.days31_60 > 0 ||
        finance.overdueBreakdown?.days61_90 > 0 || finance.overdueBreakdown?.days90Plus > 0) && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Muddati o'tgan qarzlar taqsimoti</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { label: "1-30 kun", val: finance.overdueBreakdown?.days1_30, cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
                { label: "31-60 kun", val: finance.overdueBreakdown?.days31_60, cls: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
                { label: "61-90 kun", val: finance.overdueBreakdown?.days61_90, cls: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
                { label: "90+ kun", val: finance.overdueBreakdown?.days90Plus, cls: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100" },
              ]).map(item => (
                <div key={item.label} className={`p-3 rounded-md text-center ${item.cls}`}>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-sm font-bold mt-1">{fmtMoney(item.val)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">To'lov intizomi</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">To'lov reytingi</span>
            <PaymentRatingBadge rating={finance.paymentRating || "A"} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">O'rtacha kechikish</span>
            <span className={finance.averagePaymentDelayDays > 30 ? "text-destructive font-medium" : ""}>
              {Math.round(finance.averagePaymentDelayDays || 0)} kun
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">O'z vaqtida to'lagan</span>
            <span className="font-medium">{finance.onTimePaymentRate || 0}%</span>
          </div>
        </CardContent>
      </Card>

      {(finance.recentInvoices || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">So'nggi invoicelar</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    {(["Invoice №", "Sana", "Muddati", "Summa", "Qoldiq", "Holat"]).map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(finance.recentInvoices || []).map((inv) => {
                    const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.payment_status !== "paid";
                    return (
                      <tr key={inv.id} className="border-b hover-elevate">
                        <td className="px-3 py-2 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="px-3 py-2">{fmtDate(inv.invoice_date)}</td>
                        <td className="px-3 py-2">
                          <span className={isOverdue ? "text-destructive font-medium" : ""}>{fmtDate(inv.due_date)}</span>
                        </td>
                        <td className="px-3 py-2">{fmtMoney(inv.total_amount)}</td>
                        <td className="px-3 py-2">{fmtMoney(inv.balance)}</td>
                        <td className="px-3 py-2">
                          <Badge variant={inv.payment_status === "paid" ? "default" : "destructive"}>
                            {inv.payment_status === "paid" ? "To'landi" : "To'lanmagan"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
