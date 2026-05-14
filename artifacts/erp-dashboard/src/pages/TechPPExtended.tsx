/**
 * @module TechPPExtended
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/tabs";
import { Cpu } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

import {
  URL_TAB_MAP, tabMeta, TECH_TABS, PP_TABS,
  type ProductionOrder, type TechCard, type OeeData, type ShiftRequirement,
} from "./TechPPExtendedTypes";
import {
  TechMaterialsSection, TechMachinesSection, TechTimeSection,
  TechCostSection, TechClientsSection, TechHistorySection, TechParallelSection,
  PpShiftsSection, PpRushSection, PpBottleneckSection,
  PpDemandSection, PpOeeSection, RemainingPpSections,
} from "./TechPPExtendedSections";

export default function TechPPExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "tech-materials");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["tech-materials"];

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ProductionOrder[]>({ queryKey: ["/api/pp/production-orders"] });
  const { data: techCards = [], isLoading: techCardsLoading } = useQuery<TechCard[]>({ queryKey: ["/api/technology-cards"] });
  const { data: oeeData, isLoading: oeeLoading } = useQuery<OeeData>({ queryKey: ["/api/mes/oee"] });
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<ShiftRequirement[]>({ queryKey: ["/api/integration/shifts"] });

  const rushOrders = (Array.isArray(orders) ? orders : []).filter(o => o.priority === "high" || o.priority === "urgent");

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-light tracking-tight text-foreground">
          Texnolog <span className="font-bold text-primary">BOM/Routing</span> va AI Rejalashtirish
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-4 overflow-x-auto bg-muted/40">
          <div className="flex flex-col gap-0">
            <div className="flex gap-0 border-b border-border/30 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2.5 shrink-0 flex items-center">TEXNOLOG:</span>
              {(Array.isArray(TECH_TABS) ? TECH_TABS : []).map(t => (
                <button key={t.v} onClick={() => setActiveTab(t.v)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2",
                    activeTab === t.v ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2.5 shrink-0 flex items-center">AI PP:</span>
              {(Array.isArray(PP_TABS) ? PP_TABS : []).map(t => (
                <button key={t.v} onClick={() => setActiveTab(t.v)}
                  className={cn(
                    "px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2",
                    activeTab === t.v ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="Texnolog / PP"
            moduleColor="text-primary"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          <TechMaterialsSection techCards={Array.isArray(techCards) ? techCards : []} loading={techCardsLoading} />
          <TechMachinesSection />
          <TechTimeSection />
          <TechCostSection />
          <TechClientsSection />
          <TechHistorySection />
          <TechParallelSection />
          <PpShiftsSection shifts={Array.isArray(shifts) ? shifts : []} loading={shiftsLoading} />
          <PpRushSection rushOrders={rushOrders} loading={ordersLoading} />
          <PpBottleneckSection />
          <PpDemandSection />
          <PpOeeSection oeeData={oeeData} loading={oeeLoading} />
          <RemainingPpSections />
        </div>
      </Tabs>
    </div>
  );
}
