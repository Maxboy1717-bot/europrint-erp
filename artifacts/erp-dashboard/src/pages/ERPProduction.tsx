/**
 * @module ERPProduction
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Package, ClipboardList, BarChart3, AlertTriangle, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkCenter } from "@shared/schema";
import { ERPDashboardTab } from "./erp/ERPDashboardTab";
import { ERPWorkCentersTab } from "./erp/ERPWorkCentersTab";
import { ERPProductsTab } from "./erp/ERPProductsTab";
import { ERPOrdersTab } from "./erp/ERPOrdersTab";
import { ERPDowntimeTab } from "./erp/ERPDowntimeTab";
import { ERPEmployeeTab } from "./erp/ERPEmployeeTab";
import { EPErrorState, EPPageHeader } from "@/components/ep";

export default function ERPProduction() {
  const { t } = useTranslation('production');
  const [activeTab, setActiveTab] = useState("dashboard");

  const { isError, error, refetch } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"],
  });

  if (isError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <EPErrorState onRetry={refetch}  error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("erpIshlabChiqarish")}</b></>}
        title={t("erpIshlabChiqarish")}
        subtitle={t('productionModuleDesc')}
      />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("refresh")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/40 p-1 rounded-xl flex w-full overflow-x-auto">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('dashboard')}
          </TabsTrigger>
          <TabsTrigger value="work-centers" data-testid="tab-work-centers" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Factory className="h-4 w-4 mr-2" />
            {t('workCenters')}
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Package className="h-4 w-4 mr-2" />
            {t('rawMaterials')}
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <ClipboardList className="h-4 w-4 mr-2" />
            {t('orders')}
          </TabsTrigger>
          <TabsTrigger value="downtime-logs" data-testid="tab-downtime-logs" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('downtimeLogs')}
          </TabsTrigger>
          <TabsTrigger value="employee-assignments" data-testid="tab-employee-assignments" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Users className="h-4 w-4 mr-2" />
            {t('employeeAssignments')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ERPDashboardTab />
        </TabsContent>
        <TabsContent value="work-centers" className="space-y-4">
          <ERPWorkCentersTab />
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <ERPProductsTab />
        </TabsContent>
        <TabsContent value="orders" className="space-y-4">
          <ERPOrdersTab />
        </TabsContent>
        <TabsContent value="downtime-logs" className="space-y-4">
          <ERPDowntimeTab />
        </TabsContent>
        <TabsContent value="employee-assignments" className="space-y-4">
          <ERPEmployeeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
