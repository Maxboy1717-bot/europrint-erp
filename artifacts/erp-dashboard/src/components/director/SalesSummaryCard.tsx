import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { SectionTitle, formatMoney } from "@/components/director/helpers";
import type { DirSummary } from "@/components/director/types";

interface SalesSummaryCardProps {
  dirSum: DirSummary | undefined;
  dirSumLoad: boolean;
}

export function SalesSummaryCard({ dirSum, dirSumLoad }: SalesSummaryCardProps) {
  const stats = [
    { label: "Bugun buyurtma", val: dirSum?.orders?.today ?? 0 },
    { label: "Oylik jami", val: dirSum?.orders?.monthTotal ?? 0 },
    { label: "Ishlab chiqarishda", val: dirSum?.orders?.activeProduction ?? 0 },
    { label: "Kutayotgan", val: dirSum?.orders?.pending ?? 0 },
  ];

  return (
    <Card data-testid="card-sales-summary">
      <CardHeader className="pb-3">
        <SectionTitle icon={ShoppingCart} title="Savdo Ko'rsatkichlari" sub="Joriy oy" accent="text-blue-500" />
      </CardHeader>
      <CardContent>
        {dirSumLoad ? <Skeleton className="h-32 rounded-lg" /> : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(Array.isArray(stats) ? stats : []).map((item, i) => (
                <div key={`k-${i}`} className="rounded-lg bg-muted/40 p-3" data-testid={`sales-stat-${i}`}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold text-foreground">{item.val}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-muted-foreground mb-1">Oylik aylanma (tiraj)</p>
              <p className="text-xl font-bold text-primary">{formatMoney(dirSum?.orders?.monthRevenue ?? 0)} dona</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
