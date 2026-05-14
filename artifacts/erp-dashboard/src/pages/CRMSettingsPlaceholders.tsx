/** @module CRMSettingsPlaceholders @description Placeholder panel components for CRM Settings sidebar sections that are not yet implemented. */

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Key, Package, Layers } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export function RequisitesTab() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("meningRekvizitlarim")}</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("rekvizitlarSozlamalari")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccessTab() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("kirishHuquqlari")}</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("kirishHuquqlariSozlamalari")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProductsTab() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("tovarlarVaOmborlar")}</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("tovarlarVaOmborlarSozlamalari")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function IntegrationsTab() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t("integratsiyalar")}</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("tashqiTizimlarBilanIntegratsiya")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
