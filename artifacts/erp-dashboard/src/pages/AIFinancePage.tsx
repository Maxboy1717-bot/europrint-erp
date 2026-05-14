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

export default function AIFinancePage() {
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">AI Moliya Tahlili</b></>}
        title="AI Moliya Tahlili"
        subtitle="Sun'iy intellekt yordamida anomaliya aniqlash, pul oqimi bashorati, byudjet tahlili va fraud nazorat"
        icon={<Brain className="h-6 w-6 text-primary"
      />}
      />

      <Tabs defaultValue="anomalies" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6">
          <TabsTrigger value="anomalies" className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Anomaliyalar</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pul Oqimi</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Byudjet</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Faktura</span>
          </TabsTrigger>
          <TabsTrigger value="fraud" className="flex items-center gap-1.5 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fraud</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)]" />
                Moliyaviy Anomaliyalarni Aniqlash
              </CardTitle>
              <CardDescription>
                GL yozuvlari va moliyaviy operatsiyalar tahlili asosida anomaliyalarni aniqlash
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
                Pul Oqimi Bashorati
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
                Byudjet Farqi Tahlili
              </CardTitle>
              <CardDescription>
                Rejalashtirilgan va haqiqiy xarajatlar o'rtasidagi farqni tushuntirish
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
                Faktura Tasnifi
              </CardTitle>
              <CardDescription>
                Faktura ma'lumotlari asosida avtomatik kategoriya va soliq kodi aniqlash
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
                Fraud Xavfini Baholash
              </CardTitle>
              <CardDescription>
                Shubhali tranzaksiyalarni AI yordamida tekshirish va fraud belgilarini aniqlash
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
