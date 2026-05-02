import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, CheckCircle, Clock, Package } from "lucide-react";
import { formatPercent } from "./helpers";
import { ProductionEfficiency } from "./types";

interface ProductionStatsProps {
  data: ProductionEfficiency | undefined;
  isLoading: boolean;
}

export function ProductionStats({ data, isLoading }: ProductionStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card data-testid="card-production-orders">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" /> Buyurtmalar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div>
              <div className="text-2xl font-bold">{data?.orderStats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Jami ishlab chiqarilgan</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-production-quality">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Sifat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-green-600">{formatPercent(data?.efficiencyMetrics?.qualityRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">Yaroqli mahsulot ulushi</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-production-delivery">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" /> Yetkazib berish
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-blue-600">{formatPercent(data?.orderStats?.onTimeDeliveryRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">O'z vaqtida yetkazish (OTD)</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-production-oee">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Factory className="h-4 w-4" /> OEE
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatPercent(data?.efficiencyMetrics?.overallEquipmentEfficiency)}</div>
              <p className="text-xs text-muted-foreground mt-1">Umumiy samaradorlik</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
