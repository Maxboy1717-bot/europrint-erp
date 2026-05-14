/**
 * @module WmsAnalytics
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { RefreshCw, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useTurnover, useDeadStock, useRopAlerts } from "./WmsAnalyticsTypes";
import { WmsKpiSummary, RopAlertsSection, TurnoverSection, DeadStockSection } from "./WmsAnalyticsSections";
import { EPPageHeader } from "@/components/ep";

export default function WmsAnalytics() {
  const { t } = useTranslation('wms');
  const turnover = useTurnover();
  const deadStock = useDeadStock();
  const ropAlerts = useRopAlerts();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wms/inventory-turnover"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wms/dead-stock"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wms/rop-alerts"] });
  };

  const maxTurnover = Math.max(
    ...(Array.isArray(turnover.data) ? turnover.data : []).map((item) => item.inventoryTurnover),
    1,
  );
  const avgTurnover = turnover.data?.length
    ? turnover.data.reduce((s, item) => s + item.inventoryTurnover, 0) / turnover.data.length
    : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('inventory_intelligence_title')}</b></>}
        title={t('inventory_intelligence_title')}
        subtitle={t('inventory_intelligence_desc')}
        icon={<BarChart3 className="w-6 h-6"
      />}
        actions={
          <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </Button>
        }
      />

      <WmsKpiSummary
        avgTurnover={avgTurnover}
        deadStockCount={deadStock.data?.length}
        ropCount={ropAlerts.data?.length}
        turnoverLoading={turnover.isLoading}
        deadStockLoading={deadStock.isLoading}
        ropLoading={ropAlerts.isLoading}
        t={t}
      />

      <RopAlertsSection data={ropAlerts.data} isLoading={ropAlerts.isLoading} t={t} />

      <TurnoverSection
        data={turnover.data}
        isLoading={turnover.isLoading}
        maxTurnover={maxTurnover}
        t={t}
      />

      <DeadStockSection data={deadStock.data} isLoading={deadStock.isLoading} t={t} />
    </div>
  );
}
