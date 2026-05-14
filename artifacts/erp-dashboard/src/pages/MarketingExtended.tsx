/**
 * @module MarketingExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import {
  type MarketingCampaign,
  type NpsMonthly,
  type AbTest,
  type Competitor,
  type ChurnData,
  routeTabMap,
  tabMeta,
} from "./MarketingExtendedTypes";
import { RoiSection, SeoSection, AbSection, CompSection, NpsSection } from "./MarketingExtendedSections";
import { EPPageHeader } from "@/components/ep";

export default function MarketingExtended() {
  const [location] = useLocation();
  const defaultTab = routeTabMap[location] || "roi";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["roi"];

  const { data: campaigns = [], refetch } = useQuery<MarketingCampaign[]>({ queryKey: ["/api/marketing/campaigns"] });

  const { data: npsData = [], isLoading: npsLoading } = useQuery<NpsMonthly[]>({
    queryKey: ["/api/marketing/nps/monthly"]
  });

  const { data: abTests = [] } = useQuery<AbTest[]>({
    queryKey: ["/api/marketing/ab-tests"]
  });

  const { data: competitors = [] } = useQuery<Competitor[]>({
    queryKey: ["/api/marketing/competitors"]
  });

  const { data: churnData, isLoading: churnLoading } = useQuery<ChurnData>({
    queryKey: ["/api/marketing/churn-risk"],
    enabled: activeTab === "nps",
  });

  const totalBudget = (Array.isArray(campaigns) ? campaigns : []).reduce((s: number, c: MarketingCampaign) => s + (Number(c.budget) || 0), 0);
  const totalSpent = (Array.isArray(campaigns) ? campaigns : []).reduce((s: number, c: MarketingCampaign) => s + (Number(c.spent) || 0), 0);
  const roi = totalBudget > 0 ? ((totalBudget - totalSpent) / totalSpent) * 100 : 0;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between mb-6">
        <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Marketing Kengaytirilgan</b></>}
        title="Marketing Kengaytirilgan"
      />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <div className="mb-6">
        <ModuleSectionHeader
          moduleName="Marketing"
          moduleColor="text-[var(--ep-purple)]"
          sectionTitle={meta?.title || ""}
          icon={meta?.icon || (() => null)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="roi" className="space-y-6 mt-0">
          <RoiSection
            campaigns={Array.isArray(campaigns) ? campaigns : []}
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            roi={roi}
          />
        </TabsContent>

        <TabsContent value="seo" className="space-y-6 mt-0">
          <SeoSection />
        </TabsContent>

        <TabsContent value="ab" className="space-y-6 mt-0">
          <AbSection abTests={Array.isArray(abTests) ? abTests : []} />
        </TabsContent>

        <TabsContent value="comp" className="space-y-6 mt-0">
          <CompSection competitors={Array.isArray(competitors) ? competitors : []} />
        </TabsContent>

        <TabsContent value="nps" className="space-y-6 mt-0">
          <NpsSection
            npsLoading={npsLoading}
            npsData={Array.isArray(npsData) ? npsData : []}
            churnLoading={churnLoading}
            churnData={churnData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
