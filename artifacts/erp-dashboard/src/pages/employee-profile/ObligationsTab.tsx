/**
 * @module ObligationsTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from '@/lib/queryClient';

interface CashAdvance {
  id: number;
  amount: string | number;
  purpose?: string;
  repaidAmount?: string | number;
  dueDate?: string | null;
  status?: string;
  createdAt?: string;
}

interface Props {
  employeeId: number | string;
  baseSalary?: number | null;
  cashAdvances?: CashAdvance[];
  loadingCashAdvances?: boolean;
}

function fmtMoney(v: string | number | null | undefined) {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? "0" : n.toLocaleString("uz-UZ");
}

export function ObligationsTab({ employeeId, cashAdvances = [], loadingCashAdvances }: Props) {
  const { data: loansData, isLoading: loadingLoans } = useQuery({
    queryKey: ["/api/finance/loans", employeeId],
    queryFn: async () => {
      try {
        const r = await apiRequest('GET', `/api/finance/loans?userId=${employeeId}`);
        if (!r.ok) return [];
        return r.json();
      } catch { return []; }
    },
    enabled: !!employeeId,
  });

  interface LoanItem { id: number; purpose: string; amount: number; status: string }
  const loans = (Array.isArray(loansData) ? loansData : []) as LoanItem[];
  const advances: CashAdvance[] = Array.isArray(cashAdvances) ? cashAdvances : [];

  const totalAdvances = (Array.isArray(advances) ? advances : []).reduce((s, a) => s + parseFloat(String(a.amount ?? 0)), 0);
  const totalRepaid = (Array.isArray(advances) ? advances : []).reduce((s, a) => s + parseFloat(String(a.repaidAmount ?? 0)), 0);
  const outstanding = totalAdvances - totalRepaid;

  const isLoading = loadingCashAdvances || loadingLoans;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { label: "Jami avans", value: fmtMoney(totalAdvances), icon: DollarSign, color: "text-[var(--ep-blue)]", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "To'langan",  value: fmtMoney(totalRepaid),   icon: CheckCircle, color: "text-[var(--ep-green)]", bg: "bg-green-50 dark:bg-green-950/20" },
          {
            label: "Qoldiq qarz",
            value: fmtMoney(outstanding),
            icon: outstanding > 0 ? AlertCircle : CheckCircle,
            color: outstanding > 0 ? "text-[var(--ep-red)]" : "text-[var(--ep-green)]",
            bg: outstanding > 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20",
          },
        ]).map(s => (
          <Card key={s.label} className={`border-border/50 ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-7 h-7 ${s.color} shrink-0`} />
              <div>
                <div className={`text-lg font-bold ${s.color} leading-tight`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cash Advances */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Avanslar ({advances.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="space-y-2">{([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-14 w-full rounded-lg" />)}</div>}
          {!isLoading && advances.length === 0 && (
            <div className="text-center py-10 text-[13px] text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Avanslar yo'q</p>
            </div>
          )}
          <div className="space-y-2">
            {(Array.isArray(advances) ? advances : []).map(a => {
              const amount = parseFloat(String(a.amount ?? 0));
              const repaid = parseFloat(String(a.repaidAmount ?? 0));
              const pct = amount > 0 ? (repaid / amount) * 100 : 0;
              const statusLabel = a.status === "repaid" ? "To'langan" : a.status === "overdue" ? "Kechikkan" : "Faol";
              const statusColor = a.status === "repaid"  ? "bg-green-100 text-[var(--ep-green)]" :
                                  a.status === "overdue" ? "bg-red-100 text-[var(--ep-red)]"     :
                                                           "bg-blue-100 text-[var(--ep-blue)]";
              return (
                <div key={a.id} className="p-4 rounded-lg border border-border/50 bg-muted/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-foreground">{a.purpose ?? "Avans"}</p>
                      {a.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString("uz-UZ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-foreground">{fmtMoney(amount)} so'm</p>
                      <Badge className={`text-xs ${statusColor}`}>{statusLabel}</Badge>
                    </div>
                  </div>
                  {amount > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>To'langan: {fmtMoney(repaid)} so'm</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-blue-400"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {a.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Muddati: {new Date(a.dueDate).toLocaleDateString("uz-UZ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Loans */}
      {loans.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Kreditlar ({loans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Array.isArray(loans) ? loans : []).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="font-medium text-sm">{loan.purpose ?? "Kredit"}</p>
                    <p className="text-xs text-muted-foreground">{fmtMoney(loan.amount)} so'm</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{loan.status ?? "Faol"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
