/**
 * @module BarcodeWarehouse
 * @description React page component. Route-level UI.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Boxes, ScanBarcode, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { AsosiyTab } from "@/components/wms/barcode/AsosiyTab";
import { OperatsiyalarTab } from "@/components/wms/barcode/OperatsiyalarTab";
import { NazoratTab } from "@/components/wms/barcode/NazoratTab";
import { useTranslation } from '@/lib/i18n';

export default function BarcodeWarehouse() {
  const { t } = useTranslation("common");
  return (
    <div className="pb-4">
      <div className="sticky top-0 z-50 bg-background border-b p-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" data-testid="text-page-title">{t("omborBoshqaruvi")}</h1>
          <p className="text-xs text-muted-foreground">{t("barcodeAiKameraNazoratTizimi")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="asosiy" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 sticky top-[65px] z-40">
          <TabsTrigger data-testid="tab-asosiy" value="asosiy" className="text-xs">
            <Boxes className="h-3 w-3 mr-1" />
            {t("primary")}
          </TabsTrigger>
          <TabsTrigger data-testid="tab-operatsiyalar" value="operatsiyalar" className="text-xs">
            <ScanBarcode className="h-3 w-3 mr-1" />
            {t("operatsiyalar")}
          </TabsTrigger>
          <TabsTrigger data-testid="tab-nazorat" value="nazorat" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {t("nazorat")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asosiy" className="mt-0">
          <AsosiyTab />
        </TabsContent>
        <TabsContent value="operatsiyalar" className="mt-0">
          <OperatsiyalarTab />
        </TabsContent>
        <TabsContent value="nazorat" className="mt-0">
          <NazoratTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
