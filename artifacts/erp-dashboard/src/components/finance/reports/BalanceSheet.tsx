import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { MonthlySummary } from "./types";

interface BalanceSheetProps {
  data: MonthlySummary | undefined;
  isLoading: boolean;
}

export function BalanceSheet({ data, isLoading }: BalanceSheetProps) {
  return (
    <Card data-testid="card-balance-sheet">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Balans xulosasi
        </CardTitle>
        <CardDescription>Aktivlar, majburiyatlar va xususiy kapital</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {([...Array(3)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Aktivlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-surface-container-lowest/50">
                  <div className="text-xs text-muted-foreground mb-1">Joriy aktivlar</div>
                  <div className="font-bold">{formatCurrency(data?.balanceOverview?.currentAssets || 0)}</div>
                </div>
                <div className="p-3 rounded-lg border bg-surface-container-lowest/50">
                  <div className="text-xs text-muted-foreground mb-1">Asosiy vositalar</div>
                  <div className="font-bold">{formatCurrency(data?.balanceOverview?.fixedAssets || 0)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="font-bold">Jami aktivlar</span>
                <span className="font-bold text-blue-600">{formatCurrency(data?.balanceOverview?.totalAssets || 0)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Majburiyatlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-surface-container-lowest/50">
                  <div className="text-xs text-muted-foreground mb-1">Joriy majburiyatlar</div>
                  <div className="font-bold">{formatCurrency(data?.balanceOverview?.currentLiabilities || 0)}</div>
                </div>
                <div className="p-3 rounded-lg border bg-surface-container-lowest/50">
                  <div className="text-xs text-muted-foreground mb-1">Uzoq muddatli</div>
                  <div className="font-bold">{formatCurrency(data?.balanceOverview?.longTermLiabilities || 0)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="font-bold">Jami majburiyatlar</span>
                <span className="font-bold text-red-600">{formatCurrency(data?.balanceOverview?.totalLiabilities || 0)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                <div>
                  <div className="text-xs opacity-75 uppercase tracking-wider">Xususiy kapital</div>
                  <span className="text-lg font-bold">Kapital va rezervlar</span>
                </div>
                <span className="text-xl font-bold">{formatCurrency(data?.balanceOverview?.equity || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
