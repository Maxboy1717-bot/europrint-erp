/**
 * @module OverdueOrdersCard
 * @description React UI component.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Star, TriangleAlert } from "lucide-react";
import { SectionTitle, DaysSince } from "@/components/director/helpers";
import type { ProductionData } from "@/components/director/types";

interface OverdueOrdersCardProps {
  prod: ProductionData | undefined;
  prodLoad: boolean;
  onVipRequest: (orderId: number) => void;
}

export function OverdueOrdersCard({ prod, prodLoad, onVipRequest }: OverdueOrdersCardProps) {
  const overdueOrders = prod?.overdueOrders ?? [];

  return (
    <Card data-testid="card-overdue-orders">
      <CardHeader className="pb-3">
        <SectionTitle icon={TriangleAlert} title="Kechikayotgan Buyurtmalar" sub={`${overdueOrders.length} ta muddati o'tgan`} accent="text-[var(--ep-red)]" />
      </CardHeader>
      <CardContent>
        {prodLoad ? (
          <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={`k-${i}`} className="h-16 rounded-lg" />)}</div>
        ) : overdueOrders.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 text-[var(--ep-green)] mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Barcha buyurtmalar vaqtida</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(overdueOrders) ? overdueOrders : []).slice(0, 6).map(order => {
              const days = order.tayyorBolishSanasi ? DaysSince(order.tayyorBolishSanasi) : 0;
              return (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100" data-testid={`overdue-order-${order.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{order.papkaNo}</p>
                    <p className="text-xs text-muted-foreground">{order.tayyorBolishSanasi} — {order.status}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge className="bg-red-100 text-[var(--ep-red)] text-[10px] border-none">{days}k kechikdi</Badge>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onVipRequest(order.id)} data-testid={`btn-vip-${order.id}`}>
                      <Star className="w-3 h-3 mr-1" /> VIP
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
