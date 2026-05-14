/**
 * @module BasicTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, Box, CheckCircle } from "lucide-react";
import { fmtDate } from "@/components/wms/helpers";
import { KpiCard } from "@/components/wms/tabs/KpiCard";
import type { MaterialBasic } from "@/components/wms/wms-types";

import { useTranslation } from '@/lib/i18n';
interface BasicTabProps {
  basic: MaterialBasic;
}

export function BasicTab({basic }: BasicTabProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label={t('materialKodi')} value={basic.kod || "—"} />
        <KpiCard icon={Layers} label={t("category")} value={basic.category || "—"} />
        <KpiCard icon={Box} label={t("olchovBirligi")} value={basic.unitOfMeasure || "—"} />
        <KpiCard icon={CheckCircle} label={t("status28")} value={basic.isActive ? "Aktiv" : "Arxiv"} color={basic.isActive ? "text-[var(--ep-green)]" : "text-muted-foreground"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("materialHaqida")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Nomi (O'zbek)", value: basic.xomAshyo },
              { label: "Nomi (Rus)", value: basic.xomAshyoRu },
              { label: "Kategoriya", value: basic.category },
              { label: "O'lchov", value: basic.unitOfMeasure },
            ]).map(({ label, value }) => value ? (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-36 shrink-0">{label}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ) : null)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("texnikMalumotlar")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Format A", value: basic.formatA ? `${basic.formatA} mm` : null },
              { label: "Format B", value: basic.formatB ? `${basic.formatB} mm` : null },
              { label: "Gramm", value: basic.grammage ? `${basic.grammage} g/m²` : null },
              { label: "Yetkazib beruvchi", value: basic.supplierName },
              { label: "Oxirgi xarid", value: fmtDate(basic.lastPurchaseDate) },
            ]).map(({ label, value }) => value ? (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-36 shrink-0">{label}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ) : null)}
            {basic.description && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">{t("progress.description")}</p>
                <p className="text-sm">{basic.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
