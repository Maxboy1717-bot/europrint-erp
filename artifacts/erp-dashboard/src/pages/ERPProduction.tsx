import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
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

export default function ERPProduction() {
  const { t } = useTranslation('production');
  const [activeTab, setActiveTab] = useState("dashboard");

  const { isError, refetch } = useQuery<WorkCenter[]>({
    queryKey: ["/api/erp/work-centers"],
  });

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            ERP <span className="font-bold text-primary">Ishlab Chiqarish</span>
          </h1>
          <p className="text-on-surface-variant">{t('productionModuleDesc')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-container-low p-1 rounded-xl flex w-full overflow-x-auto">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('dashboard')}
          </TabsTrigger>
          <TabsTrigger value="work-centers" data-testid="tab-work-centers" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Factory className="h-4 w-4 mr-2" />
            {t('workCenters')}
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <Package className="h-4 w-4 mr-2" />
            {t('products')}
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <ClipboardList className="h-4 w-4 mr-2" />
            {t('orders')}
          </TabsTrigger>
          <TabsTrigger value="downtime-logs" data-testid="tab-downtime-logs" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('downtimeLogs')}
          </TabsTrigger>
          <TabsTrigger value="employee-assignments" data-testid="tab-employee-assignments" className="flex-1 rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
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
