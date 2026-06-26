/**
 * @module TabNavigation
 * @description React UI component.
 */

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation("common");
  return (
    <ScrollArea className="w-full">
      <TabsList className="ep-tabbar-soft">
        <TabsTrigger value="personal" data-testid="tab-personal" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("shaxsiy")}</TabsTrigger>
        <TabsTrigger value="work" data-testid="tab-work" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("ishTarixi")}</TabsTrigger>
        <TabsTrigger value="documents" data-testid="tab-documents" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("hujjatlar")}</TabsTrigger>
        <TabsTrigger value="discipline" data-testid="tab-discipline" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("intizomMukofotlar")}</TabsTrigger>
        <TabsTrigger value="development" data-testid="tab-development" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("rivojlanish")}</TabsTrigger>
        <TabsTrigger value="adaptation" data-testid="tab-adaptation" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("moslashuv")}</TabsTrigger>
        <TabsTrigger value="career" data-testid="tab-career" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("kareraYoli")}</TabsTrigger>
        <TabsTrigger value="assets" data-testid="tab-assets" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("jihozlar")}</TabsTrigger>
        <TabsTrigger value="obligations" data-testid="tab-obligations" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("majburiyatlar")}</TabsTrigger>
        <TabsTrigger value="attendance" data-testid="tab-attendance" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("davomat")}</TabsTrigger>
        <TabsTrigger value="finance" data-testid="tab-finance" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("moliya")}</TabsTrigger>
        <TabsTrigger value="performance" data-testid="tab-performance" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("samaradorlik")}</TabsTrigger>
        <TabsTrigger value="goals" data-testid="tab-goals" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("maqsadlar")}</TabsTrigger>
        <TabsTrigger value="one-on-one" data-testid="tab-one-on-one" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">1-on-1</TabsTrigger>
        {isAdminOrHrManager && (
          <TabsTrigger value="hr-capital" data-testid="tab-hr-capital" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("hrKapital")}</TabsTrigger>
        )}
        <TabsTrigger value="corporate-inventory" data-testid="tab-corporate-inventory" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("inventar")}</TabsTrigger>
        <TabsTrigger value="monthly-report" data-testid="tab-monthly-report" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("oylikHisobot")}</TabsTrigger>
        <TabsTrigger value="daily-reports" data-testid="tab-daily-reports" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("kunlikHisobotlar")}</TabsTrigger>
        {(status === "terminated" || status === "offboarding") && (
          <TabsTrigger value="offboarding" data-testid="tab-offboarding" className="rounded-[10px] px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-xs whitespace-nowrap text-gray-500 transition-all">{t("ishdanBoshatish")}</TabsTrigger>
        )}
        {isMachineOperator && (
          <TabsTrigger value="machine-operator" data-testid="tab-machine-operator" className="rounded-md px-3 py-2 data-[state=active]:bg-card data-[state=active]:text-primary font-medium text-sm whitespace-nowrap flex items-center gap-1">
            {t("dastgoh")}
          </TabsTrigger>
        )}
      </TabsList>
    </ScrollArea>
  );
}
