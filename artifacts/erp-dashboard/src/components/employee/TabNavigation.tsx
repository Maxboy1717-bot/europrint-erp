/**
 * @module TabNavigation
 * @description React UI component.
 */

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TabNavigationProps {
  isAdminOrHrManager: boolean;
  isMachineOperator: boolean;
  status: string;
}

export function TabNavigation({
  isAdminOrHrManager,
  isMachineOperator,
  status
}: TabNavigationProps) {
  return (
    <ScrollArea className="w-full">
      <TabsList style={{ background: "#fff", boxShadow: "4px 4px 14px rgba(163,177,198,0.35), -2px -2px 8px rgba(255,255,255,0.8)", borderRadius: 14, padding: "4px 6px", display: "flex", width: "max-content", minWidth: "100%", gap: 2, border: "none" }}>
        <TabsTrigger value="personal" data-testid="tab-personal" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Shaxsiy</TabsTrigger>
        <TabsTrigger value="work" data-testid="tab-work" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Ish tarixi</TabsTrigger>
        <TabsTrigger value="documents" data-testid="tab-documents" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Hujjatlar</TabsTrigger>
        <TabsTrigger value="discipline" data-testid="tab-discipline" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Intizom & Mukofotlar</TabsTrigger>
        <TabsTrigger value="development" data-testid="tab-development" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Rivojlanish</TabsTrigger>
        <TabsTrigger value="adaptation" data-testid="tab-adaptation" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Moslashuv</TabsTrigger>
        <TabsTrigger value="career" data-testid="tab-career" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Karera yo'li</TabsTrigger>
        <TabsTrigger value="assets" data-testid="tab-assets" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Jihozlar</TabsTrigger>
        <TabsTrigger value="obligations" data-testid="tab-obligations" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Majburiyatlar</TabsTrigger>
        <TabsTrigger value="attendance" data-testid="tab-attendance" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Davomat</TabsTrigger>
        <TabsTrigger value="finance" data-testid="tab-finance" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Moliya</TabsTrigger>
        <TabsTrigger value="performance" data-testid="tab-performance" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Samaradorlik</TabsTrigger>
        <TabsTrigger value="goals" data-testid="tab-goals" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Maqsadlar</TabsTrigger>
        <TabsTrigger value="one-on-one" data-testid="tab-one-on-one" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">1-on-1</TabsTrigger>
        {isAdminOrHrManager && (
          <TabsTrigger value="hr-capital" data-testid="tab-hr-capital" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">HR Kapital</TabsTrigger>
        )}
        <TabsTrigger value="corporate-inventory" data-testid="tab-corporate-inventory" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Inventar</TabsTrigger>
        <TabsTrigger value="monthly-report" data-testid="tab-monthly-report" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Oylik Hisobot</TabsTrigger>
        <TabsTrigger value="daily-reports" data-testid="tab-daily-reports" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Kunlik Hisobotlar</TabsTrigger>
        {(status === "terminated" || status === "offboarding") && (
          <TabsTrigger value="offboarding" data-testid="tab-offboarding" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">Ishdan bo'shatish</TabsTrigger>
        )}
        {isMachineOperator && (
          <TabsTrigger value="machine-operator" data-testid="tab-machine-operator" className="rounded-md px-3 py-2 data-[state=active]:bg-card data-[state=active]:text-primary font-medium text-sm whitespace-nowrap flex items-center gap-1">
            ⚙️ Dastgoh
          </TabsTrigger>
        )}
      </TabsList>
    </ScrollArea>
  );
}
