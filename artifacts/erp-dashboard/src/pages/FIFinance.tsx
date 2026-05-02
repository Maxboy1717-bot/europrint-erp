import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Building2,
  TrendingUp,
  BookOpen,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { CostCentersTab } from "@/components/finance/CostCentersTab";
import { ProfitCentersTab } from "@/components/finance/ProfitCentersTab";
import { GLDocumentsTab } from "@/components/finance/GLDocumentsTab";
import { AccountingPeriodsTab } from "@/components/finance/AccountingPeriodsTab";

export default function FIFinance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          label="Europrint ERP · FI"
          title="Moliya"
          boldWord="Boshqaruvi"
          subtitle="Xarajat markazlari, foyda markazlari, bosh daftar va hisob davrlari"
          data-testid="text-fi-finance-title"
        />
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <Tabs defaultValue="cost-centers" className="w-full space-y-4">
        <TabsList className="bg-surface-container p-1 rounded-lg">
          <TabsTrigger value="cost-centers" data-testid="tab-cost-centers" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">
            <Building2 className="mr-2 h-4 w-4" />
            Xarajat Markazlari
          </TabsTrigger>
          <TabsTrigger value="profit-centers" data-testid="tab-profit-centers" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">
            <TrendingUp className="mr-2 h-4 w-4" />
            Foyda Markazlari
          </TabsTrigger>
          <TabsTrigger value="gl-documents" data-testid="tab-gl-documents" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">
            <BookOpen className="mr-2 h-4 w-4" />
            Bosh Daftar
          </TabsTrigger>
          <TabsTrigger value="accounting-periods" data-testid="tab-accounting-periods" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">
            <Calendar className="mr-2 h-4 w-4" />
            Hisob Davrlari
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost-centers">
          <CostCentersTab />
        </TabsContent>

        <TabsContent value="profit-centers">
          <ProfitCentersTab />
        </TabsContent>

        <TabsContent value="gl-documents">
          <GLDocumentsTab />
        </TabsContent>

        <TabsContent value="accounting-periods">
          <AccountingPeriodsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
