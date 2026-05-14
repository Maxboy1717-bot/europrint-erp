/**
 * @module AIFinancePage
 * @description React page component. Route-level UI.
 */

import { Brain, AlertTriangle, TrendingUp, BarChart3, FileText, ShieldAlert, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnomalyTab, CashflowTab } from "./AIFinancePageSections";
import { BudgetVarianceTab, InvoiceTab } from "./AIFinancePageSections2";
import { FraudTab } from "./AIFinanceFraudTab";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function AIFinancePage() {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("aiMoliyaTahlili")}</b></>}
        title={t("aiMoliyaTahlili")}
        subtitle={t("suniyIntellektYordamidaAnomaliyaAniqlash")}
        icon={<Brain className="h-6 w-6 text-primary"
      />}
      />

      <Tabs defaultValue="anomalies" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
          <TabsTrigger value="anomalies" className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("anomaliyalar")}</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("pulOqimi")}</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("byudjet")}</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("faktura")}</span>
          </TabsTrigger>
          <TabsTrigger value="fraud" className="flex items-center gap-1.5 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("fraud")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
                {t("moliyaviyAnomaliyalarniAniqlash")}
              </CardTitle>
              <CardDescription>
                {t("glYozuvlariVaMoliyaviyOperatsiyalar")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnomalyTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--ep-green)]" />
                {t("pulOqimiBashorati")}
              </CardTitle>
              <CardDescription>
                Tarixiy ma'lumotlar asosida keyingi oy uchun kirim/chiqim bashorati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashflowTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--ep-blue)]" />
                {t("byudjetFarqiTahlili")}
              </CardTitle>
              <CardDescription>
                {t("rejalashtirilganVaHaqiqiyXarajatlarOrtasidagi")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetVarianceTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--ep-primary)]" />
                {t("fakturaTasnifi")}
              </CardTitle>
              <CardDescription>
                {t("fakturaMalumotlariAsosidaAvtomatikKategoriya")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[var(--ep-red)]" />
                {t("fraudXavfiniBaholash")}
              </CardTitle>
              <CardDescription>
                {t("shubhaliTranzaksiyalarniAiYordamidaTekshirish")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FraudTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
