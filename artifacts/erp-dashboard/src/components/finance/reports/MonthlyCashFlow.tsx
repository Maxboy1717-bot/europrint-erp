import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { MonthlySummary } from "./types";

interface MonthlyCashFlowProps {
  data: MonthlySummary | undefined;
  isLoading: boolean;
}

export function MonthlyCashFlow({ data, isLoading }: MonthlyCashFlowProps) {
  return (
    <Card data-testid="card-cash-flow-statement">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Pul oqimi to'g'risida hisobot
        </CardTitle>
        <CardDescription>Bilvosita usul bo'yicha pul oqimi</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {([...Array(5)]).map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Operatsion faoliyatdan pul oqimi</span>
              <span className={`font-medium ${(data?.cashFlowStatement?.operatingActivities || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(data?.cashFlowStatement?.operatingActivities || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Investitsiya faoliyatidan pul oqimi</span>
              <span className={`font-medium ${(data?.cashFlowStatement?.investingActivities || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(data?.cashFlowStatement?.investingActivities || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Moliyalashtirish faoliyatidan pul oqimi</span>
              <span className={`font-medium ${(data?.cashFlowStatement?.financingActivities || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(data?.cashFlowStatement?.financingActivities || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <span className="font-bold">Sof pul oqimi</span>
              <span className={`font-bold ${(data?.cashFlowStatement?.netChange || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {formatCurrency(data?.cashFlowStatement?.netChange || 0)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-2">
                <div className="text-xs text-muted-foreground uppercase">Davr boshi</div>
                <div className="font-bold">{formatCurrency(data?.cashFlowStatement?.openingBalance || 0)}</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xs text-muted-foreground uppercase">Davr oxiri</div>
                <div className="font-bold text-green-600">{formatCurrency(data?.cashFlowStatement?.closingBalance || 0)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
