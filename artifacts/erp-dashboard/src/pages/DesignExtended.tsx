/**
 * @module DesignExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import type { DesignOrder, DesignTool, DesignTemplate } from "./DesignExtendedTypes";
import { routeTabMap, tabMeta, brandColors, defaultCostData } from "./DesignExtendedTypes";
import {
  AiReviewTab,
  MockupTab,
  BrandTab,
  CompareTab,
  TemplatesTab,
  ToolsTab,
  CostingTab,
  LibraryTab,
} from "./DesignExtendedSections";

export default function DesignExtended() {
  const [location, setLocation] = useLocation();
  const defaultTab = routeTabMap[location] || "ai";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const { data: designOrders = [] } = useQuery<DesignOrder[]>({ queryKey: ["/api/design/orders"] });
  const { data: toolsData = [] } = useQuery<DesignTool[]>({
    queryKey: ["/api/integration/mro/equipment"],
  });
  const { data: templatesData = [] } = useQuery<DesignTemplate[]>({
    queryKey: ["/api/design/templates"],
  });

  const pendingReview = (Array.isArray(designOrders) ? designOrders : []).filter(
    (o) => ["submitted", "in_review"].includes(o.status ?? ""),
  );

  const totalCost = (Array.isArray(defaultCostData) ? defaultCostData : []).reduce((s, c) => s + c.total, 0);

  const meta = tabMeta[activeTab] || tabMeta.ai;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <ModuleSectionHeader
        moduleName="Dizayn"
        moduleColor="text-pink-600"
        sectionTitle={meta.title}
        sectionDescription={meta.description}
        icon={meta.icon}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="ai" className="space-y-4 mt-0">
          <AiReviewTab
            pendingReview={pendingReview}
            onOpenOrder={(id) => setLocation(`/design/orders/${id}`)}
          />
        </TabsContent>

        <TabsContent value="3d" className="mt-0">
          <MockupTab />
        </TabsContent>

        <TabsContent value="brand" className="space-y-4 mt-0">
          <BrandTab colors={brandColors} />
        </TabsContent>

        <TabsContent value="compare" className="mt-0">
          <CompareTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <TemplatesTab templates={templatesData} />
        </TabsContent>

        <TabsContent value="tools" className="mt-0">
          <ToolsTab tools={toolsData} />
        </TabsContent>

        <TabsContent value="costing" className="space-y-4 mt-0">
          <CostingTab costData={defaultCostData} totalCost={totalCost} />
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          <LibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
