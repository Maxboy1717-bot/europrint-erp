import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useInventoryCountTranslations } from "./useInventoryCountTranslations";

interface DiscrepancyReportProps {
  varianceSummary: {
    positive: number;
    negative: number;
    total: number;
  };
}

export function DiscrepancyReport({ varianceSummary }: DiscrepancyReportProps) {
  const t = useInventoryCountTranslations();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t.detail.summary.positive}</p>
              <p className="text-xl font-bold text-green-500">+{formatCurrency(varianceSummary.positive)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">{t.detail.summary.negative}</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(varianceSummary.negative)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${varianceSummary.total >= 0 ? "text-green-500" : "text-red-500"}`} />
            <div>
              <p className="text-sm text-muted-foreground">{t.detail.summary.total}</p>
              <p className={`text-xl font-bold ${varianceSummary.total >= 0 ? "text-green-500" : "text-red-500"}`}>
                {varianceSummary.total >= 0 ? "+" : ""}{formatCurrency(varianceSummary.total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
