/**
 * @module CashFlowARAP
 * @description React UI component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Wallet, Activity, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { formatShortCurrency } from "./helpers";
import { WeeklySummary } from "./types";

interface CashFlowARAPProps {
  data: WeeklySummary | undefined;
  isLoading: boolean;
}

export function CashFlowARAP({ data, isLoading }: CashFlowARAPProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card data-testid="card-cash-flow-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pul oqimi xulosasi
          </CardTitle>
          <CardDescription>Haftalik pul kirim-chiqimi</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-[var(--ep-green)]" />
                  <span>Kirimlar</span>
                </div>
                <span className="font-bold text-[var(--ep-green)]">{formatCurrency(data?.cashFlow?.inflows || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-[var(--ep-red)]" />
                  <span>Chiqimlar</span>
                </div>
                <span className="font-bold text-[var(--ep-red)]">{formatCurrency(data?.cashFlow?.outflows || 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[var(--ep-blue)]" />
                  <span>Sof pul oqimi</span>
                </div>
                <span className={`font-bold ${(data?.cashFlow?.netCashFlow || 0) >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {formatCurrency(data?.cashFlow?.netCashFlow || 0)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-ar-ap-movement">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Debitorlik / Kreditorlik harakati
          </CardTitle>
          <CardDescription>AR/AP haftalik o'zgarishlari</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--ep-green)]">Debitorlik (AR)</span>
                  <Badge variant="outline" className="bg-green-50 text-[var(--ep-green)]">
                    Yig'ilishi kerak
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ochilish:</span>
                    <span>{formatShortCurrency(data?.arMovement?.opening || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yig'ildi:</span>
                    <span className="text-[var(--ep-green)]">-{formatShortCurrency(data?.arMovement?.collected || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yangi:</span>
                    <span className="text-[var(--ep-blue)]">+{formatShortCurrency(data?.arMovement?.newInvoices || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Yopilish:</span>
                    <span>{formatShortCurrency(data?.arMovement?.closing || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--ep-red)]">Kreditorlik (AP)</span>
                  <Badge variant="outline" className="bg-red-50 text-[var(--ep-red)]">
                    To'lanishi kerak
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ochilish:</span>
                    <span>{formatShortCurrency(data?.apMovement?.opening || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To'landi:</span>
                    <span className="text-[var(--ep-green)]">-{formatShortCurrency(data?.apMovement?.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yangi:</span>
                    <span className="text-[var(--ep-red)]">+{formatShortCurrency(data?.apMovement?.newBills || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Yopilish:</span>
                    <span>{formatShortCurrency(data?.apMovement?.closing || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
