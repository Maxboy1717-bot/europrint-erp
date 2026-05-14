/**
 * @module QCExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { 
  AlertTriangle, Building2, FileText, Shield, Award, BarChart3, Settings, 
  Brain, FileCheck, TrendingUp 
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

import { LabSection } from "@/components/production/qc/LabSection";
import { VendorSection } from "@/components/production/qc/VendorSection";
import { DefectSection } from "@/components/production/qc/DefectSection";
import { ReclamationSection } from "@/components/production/qc/ReclamationSection";
import { CertificateSection } from "@/components/production/qc/CertificateSection";
import { AiTrendSection } from "@/components/production/qc/AiTrendSection";
import { ReportSection } from "@/components/production/qc/ReportSection";
import { IsoSettingsSection } from "@/components/production/qc/IsoSettingsSection";
import { TabMeta } from "@/components/production/qc/types";

const URL_TAB_MAP: Record<string, string> = {
  "/qc/lab": "lab",
  "/qc/vendor-quality": "vendor",
  "/qc/defect-management": "defects",
  "/qc/complaints": "complaints",
  "/qc/certificates": "certificates",
  "/qc/iso": "iso",
  "/qc/trends": "trends",
  "/qc/ai-analysis": "ai",
  "/qc/reports": "reports",
  "/qc/settings": "settings",
};

const tabMeta: TabMeta = {
  "lab": { title: "Laboratoriya", icon: FileCheck },
  "vendor": { title: "Yetkazuvchi Sifat", icon: Building2 },
  "defects": { title: "Brak Boshqaruvi", icon: AlertTriangle },
  "complaints": { title: "Reklamatsiyalar", icon: FileText },
  "certificates": { title: "Sertifikatlar", icon: Award },
  "iso": { title: "ISO / Standartlar", icon: Shield },
  "trends": { title: "Sifat Trendi", icon: TrendingUp },
  "ai": { title: "AI Tahlil", icon: Brain },
  "reports": { title: "Hisobotlar", icon: BarChart3 },
  "settings": { title: "Normalar", icon: Settings },
};

export default function QCExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "vendor");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["vendor"];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex justify-end px-6 pt-3">
        <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="Sifat Nazorati"
            moduleColor="text-[var(--ep-red)]"
            sectionTitle={meta.title}
            icon={meta.icon}
          />

          <TabsContent value="lab" className="mt-0">
            <LabSection activeTab={activeTab} />
          </TabsContent>

          <TabsContent value="vendor" className="mt-0">
            <VendorSection />
          </TabsContent>

          <TabsContent value="defects" className="mt-0">
            <DefectSection />
          </TabsContent>

          <TabsContent value="complaints" className="mt-0">
            <ReclamationSection />
          </TabsContent>

          <TabsContent value="certificates" className="mt-0">
            <CertificateSection />
          </TabsContent>

          <TabsContent value="iso" className="mt-0">
            <IsoSettingsSection type="iso" />
          </TabsContent>

          <TabsContent value="trends" className="mt-0">
            <ReportSection />
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <AiTrendSection activeTab={activeTab} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportSection />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <IsoSettingsSection type="settings" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
