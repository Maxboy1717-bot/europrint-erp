import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Building2, User, ArrowLeft } from "lucide-react";
import { CategoryBadge, StatusBadge } from "./helpers";
import { BasicTab } from "./BasicTab";
import { OrdersTab } from "./OrdersTab";
import { FinanceTab } from "./FinanceTab";
import { CommunicationsTab } from "./CommunicationsTab";
import { ComplaintsTab } from "./ComplaintsTab";
import { SegmentationTab } from "./SegmentationTab";
import { GrowthTab } from "./GrowthTab";
import { CompetitorsTab } from "./CompetitorsTab";
import { ContractsTab } from "./ContractsTab";
import { LtvTab } from "./LtvTab";

const TABS = [
  { value: "basic", label: "1. Asosiy" },
  { value: "orders", label: "2. Buyurtmalar" },
  { value: "finance", label: "3. Moliya" },
  { value: "communications", label: "4. Muloqot" },
  { value: "complaints", label: "5. Shikoyatlar" },
  { value: "segmentation", label: "6. ABC" },
  { value: "growth", label: "7. Rivojlanish" },
  { value: "competitors", label: "8. Raqobat" },
  { value: "contracts", label: "9. Shartnomalar" },
  { value: "ltv", label: "10. LTV" },
];

export function Customer360View({ customerId, onBack }: { customerId: number; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/sd/customers", customerId, "360"],
    queryFn: () => apiRequest("GET", `/api/sd/customers/${customerId}/360`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{data?.error || "Ma'lumot yuklanmadi"}</p>
        <Button variant="outline" className="mt-3" onClick={onBack}>Orqaga</Button>
      </div>
    );
  }

  const basic = data.basic;
  const phones = (basic?.phones as { value: string }[] | null) || [];
  const primaryPhone = phones[0]?.value;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="btn-back-to-list">
          <ArrowLeft className="h-4 w-4 mr-1" />Ro'yxat
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {basic?.customerType === "individual"
                ? <User className="h-5 w-5 text-primary" />
                : <Building2 className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">{basic?.title}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {basic?.customerCode && (
                  <code className="text-xs bg-muted px-2 py-0.5 rounded">{basic.customerCode}</code>
                )}
                <CategoryBadge cat={basic?.customerCategory} />
                <StatusBadge status={basic?.status} />
                {primaryPhone && <span className="text-sm text-muted-foreground">{primaryPhone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max gap-1 h-auto">
            {(Array.isArray(TABS) ? TABS : []).map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="text-xs px-3 py-1.5" data-testid={`tab-${t.value}`}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="basic" className="mt-4">
          <BasicTab data={basic} contacts={data.contacts || []} />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab orders={data.orders} />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinanceTab finance={data.finance} />
        </TabsContent>
        <TabsContent value="communications" className="mt-4">
          <CommunicationsTab customerId={customerId} communications={data.communications} />
        </TabsContent>
        <TabsContent value="complaints" className="mt-4">
          <ComplaintsTab customerId={customerId} complaints={data.complaints} />
        </TabsContent>
        <TabsContent value="segmentation" className="mt-4">
          <SegmentationTab segmentation={data.segmentation} />
        </TabsContent>
        <TabsContent value="growth" className="mt-4">
          <GrowthTab growth={data.growth} />
        </TabsContent>
        <TabsContent value="competitors" className="mt-4">
          <CompetitorsTab customerId={customerId} competitors={data.competitors} />
        </TabsContent>
        <TabsContent value="contracts" className="mt-4">
          <ContractsTab customerId={customerId} contracts={data.contracts} />
        </TabsContent>
        <TabsContent value="ltv" className="mt-4">
          <LtvTab ltv={data.ltv} orders={data.orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
