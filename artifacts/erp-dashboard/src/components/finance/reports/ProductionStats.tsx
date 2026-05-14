/**
 * @module ProductionStats
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, CheckCircle, Clock, Package } from "lucide-react";
import { formatPercent } from "./helpers";
import { ProductionEfficiency } from "./types";
import { useTranslation } from '@/lib/i18n';

interface ProductionStatsProps {
  data: ProductionEfficiency | undefined;
  isLoading: boolean;
}

export function ProductionStats({ data, isLoading }: ProductionStatsProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card data-testid="card-production-orders">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" /> {t("buyurtmalar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <div>
              <div className="text-2xl font-bold">{data?.orderStats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("jamiIshlabChiqarilgan")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-production-quality">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> {t("Sifat")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-[var(--ep-green)]">{formatPercent(data?.efficiencyMetrics?.qualityRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("yaroqliMahsulotUlushi")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-production-delivery">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" /> {t("yetkazibBerish")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-[var(--ep-blue)]">{formatPercent(data?.orderStats?.onTimeDeliveryRate)}</div>
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
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <div>
              <div className="text-2xl font-bold text-[var(--ep-purple)]">{formatPercent(data?.efficiencyMetrics?.overallEquipmentEfficiency)}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("umumiySamaradorlik")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
