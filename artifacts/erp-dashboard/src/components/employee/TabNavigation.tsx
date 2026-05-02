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
      <TabsList className="bg-surface-container p-1 rounded-lg flex w-max min-w-full gap-0.5">
        <TabsTrigger value="personal" data-testid="tab-personal" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Shaxsiy</TabsTrigger>
        <TabsTrigger value="work" data-testid="tab-work" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Ish tarixi</TabsTrigger>
        <TabsTrigger value="documents" data-testid="tab-documents" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Hujjatlar</TabsTrigger>
        <TabsTrigger value="discipline" data-testid="tab-discipline" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Intizom & Mukofotlar</TabsTrigger>
        <TabsTrigger value="development" data-testid="tab-development" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Rivojlanish</TabsTrigger>
        <TabsTrigger value="adaptation" data-testid="tab-adaptation" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Moslashuv</TabsTrigger>
        <TabsTrigger value="career" data-testid="tab-career" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Karera yo'li</TabsTrigger>
        <TabsTrigger value="assets" data-testid="tab-assets" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Jihozlar</TabsTrigger>
        <TabsTrigger value="obligations" data-testid="tab-obligations" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Majburiyatlar</TabsTrigger>
        <TabsTrigger value="attendance" data-testid="tab-attendance" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Davomat</TabsTrigger>
        <TabsTrigger value="finance" data-testid="tab-finance" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Moliya</TabsTrigger>
        <TabsTrigger value="performance" data-testid="tab-performance" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Samaradorlik</TabsTrigger>
        {isAdminOrHrManager && (
          <TabsTrigger value="hr-capital" data-testid="tab-hr-capital" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">HR Kapital</TabsTrigger>
        )}
        <TabsTrigger value="corporate-inventory" data-testid="tab-corporate-inventory" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Inventar</TabsTrigger>
        <TabsTrigger value="monthly-report" data-testid="tab-monthly-report" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Oylik Hisobot</TabsTrigger>
        <TabsTrigger value="daily-reports" data-testid="tab-daily-reports" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Kunlik Hisobotlar</TabsTrigger>
        {(status === "terminated" || status === "offboarding") && (
          <TabsTrigger value="offboarding" data-testid="tab-offboarding" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap">Ishdan bo'shatish</TabsTrigger>
        )}
        {isMachineOperator && (
          <TabsTrigger value="machine-operator" data-testid="tab-machine-operator" className="rounded-md px-3 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary font-medium text-sm whitespace-nowrap flex items-center gap-1">
            ⚙️ Dastgoh
          </TabsTrigger>
        )}
      </TabsList>
    </ScrollArea>
  );
}
