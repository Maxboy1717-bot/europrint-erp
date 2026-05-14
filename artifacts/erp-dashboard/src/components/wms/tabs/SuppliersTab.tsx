/**
 * @module SuppliersTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney, fmtDate } from "@/components/wms/helpers";
import type { SuppliersData } from "@/components/wms/wms-types";
import { useTranslation } from '@/lib/i18n';

interface SuppliersTabProps {
  suppliers: SuppliersData | null | undefined;
}

export function SuppliersTab({ suppliers }: SuppliersTabProps) {
  const { t } = useTranslation("common");
  if (!suppliers) return <div className="text-muted-foreground text-sm py-8 text-center">{t("yetkazibBeruvchiMalumotlariYoq")}</div>;

  return (
    <div className="space-y-4">
      {suppliers.primarySupplier ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("asosiyYetkazibBeruvchi")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: "Nomi", value: suppliers.primarySupplier.name },
              { label: "Joriy narx", value: fmtMoney(suppliers.primarySupplier.currentPrice, suppliers.primarySupplier.currency || "UZS") },
              { label: "Oxirgi xarid", value: fmtDate(suppliers.primarySupplier.lastPurchaseDate) },
            ]).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">{t("yetkazibBeruvchiMalumotiKiritilmagan")}</CardContent></Card>
      )}

      {(suppliers.allSuppliers?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("barchaYetkazibBeruvchilar")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>{(["Nom", "Narx", "Oxirgi xarid"]).map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {(suppliers.allSuppliers || []).map((s, i) => (
                    <tr key={`k-${i}`} className="border-b hover-elevate">
                      <td className="px-4 py-2 font-medium">{s.name}</td>
                      <td className="px-4 py-2">{fmtMoney(s.currentPrice, "UZS")}</td>
                      <td className="px-4 py-2 text-muted-foreground">{fmtDate(s.lastPurchaseDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
