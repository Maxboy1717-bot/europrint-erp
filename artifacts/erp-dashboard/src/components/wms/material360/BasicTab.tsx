/**
 * @module BasicTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, Box, CheckCircle } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { fmtDate, type BasicInfo } from "./types";

import { useTranslation } from '@/lib/i18n';
export function BasicTab({ basic }: { basic: BasicInfo }) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Package} label={t('materialKodi')} value={basic.kod || "—"} />
        <KpiCard icon={Layers} label={t("category")} value={basic.category || "—"} />
        <KpiCard icon={Box} label={t("olchovBirligi")} value={basic.unitOfMeasure || "—"} />
        <KpiCard icon={CheckCircle} label={t("status28")} value={basic.isActive ? "Aktiv" : "Arxiv"}
          color={basic.isActive ? "text-[var(--ep-green)]" : "text-muted-foreground"} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("materialHaqida")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([["Nomi (O'zbek)", basic.xomAshyo], ["Nomi (Rus)", basic.xomAshyoRu], ["Kategoriya", basic.category], ["O'lchov", basic.unitOfMeasure]] as [string, string | null | undefined][])
              .filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-36 shrink-0">{l}:</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("texnikMalumotlar")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              ["Format A", basic.formatA ? `${basic.formatA} mm` : null],
              ["Format B", basic.formatB ? `${basic.formatB} mm` : null],
              ["Gramm", basic.grammage ? `${basic.grammage} g/m²` : null],
              ["Yetkazib beruvchi", basic.supplierName],
              ["Oxirgi xarid", fmtDate(basic.lastPurchaseDate)],
            ] as [string, string | null][]).filter(([, v]) => v && v !== "—").map(([l, v]) => (
              <div key={l} className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-36 shrink-0">{l}:</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
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
