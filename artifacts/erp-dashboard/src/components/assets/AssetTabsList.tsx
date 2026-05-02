import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { Building2, Wrench, Trash2, ArrowRightLeft, ShieldCheck, Activity } from "lucide-react";

export function AssetTabsList() {
  const { t } = useTranslation('mro');

  return (
    <TabsList className="flex w-full flex-wrap gap-1 h-auto">
      <TabsTrigger value="assets" data-testid="tab-assets">
        <Building2 className="h-4 w-4 mr-1" />{t("tabAssets")}
      </TabsTrigger>
      <TabsTrigger value="maintenance" data-testid="tab-maintenance">
        <Wrench className="h-4 w-4 mr-1" />{t("tabMaintenance")}
      </TabsTrigger>
      <TabsTrigger value="disposal" data-testid="tab-disposal">
        <Trash2 className="h-4 w-4 mr-1" />{t("tabDisposal")}
      </TabsTrigger>
      <TabsTrigger value="transfer" data-testid="tab-transfer">
        <ArrowRightLeft className="h-4 w-4 mr-1" />{t("tabTransfer")}
      </TabsTrigger>
      <TabsTrigger value="insurance" data-testid="tab-insurance">
        <ShieldCheck className="h-4 w-4 mr-1" />{t("tabInsurance")}
      </TabsTrigger>
      <TabsTrigger value="depreciation" data-testid="tab-depreciation">
        <Activity className="h-4 w-4 mr-1" />{t("tabDepreciation")}
      </TabsTrigger>
    </TabsList>
  );
}
