/**
 * @module QCSupplierQualityTab
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface SupplierRating {
  supplierId: string;
  supplierName: string;
  deliveryCount: number;
  avgQualityScore: number;
  avgPassRate: number;
}

export function QCSupplierQualityTab() {
  const { t } = useTranslation("common");
  const { data: supplierRatings, isLoading: suppliersLoading } = useQuery<SupplierRating[]>({
    queryKey: ["/api/qc/supplier-quality/ratings"],
  });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          {t("yetkazuvchiSifatReytingi1")}
        </CardTitle>
        <CardDescription>{t("harYetkazuvchiBoyichaMaterialSifat")}</CardDescription>
      </CardHeader>
      <CardContent>
        {suppliersLoading ? (
          <div className="flex justify-center py-8"><EPLoader className="w-6 h-6" /></div>
        ) : !supplierRatings?.length ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            {t("supplierMalumotlariYoqMaterialTestlari")}
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("yetkazuvchi")}</TableHead>
                <TableHead>{t("yetkazmaSoni")}</TableHead>
                <TableHead>{t("otishFoizi2")}</TableHead>
                <TableHead>{t("sifatBali")}</TableHead>
                <TableHead>{t("reyting")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(supplierRatings) ? supplierRatings : []).map((s, i) => (
                <TableRow key={s.supplierId} data-testid={`row-supplier-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{s.supplierName}</TableCell>
                  <TableCell>{s.deliveryCount}</TableCell>
                  <TableCell>{s.avgPassRate}%</TableCell>
                  <TableCell>{s.avgQualityScore}/100</TableCell>
                  <TableCell>
                    <Badge variant={s.avgQualityScore >= 90 ? "default" : s.avgQualityScore >= 70 ? "secondary" : "destructive"}>
                      {s.avgQualityScore >= 90 ? "A — Yaxshi" : s.avgQualityScore >= 70 ? "B — O'rta" : "C — Yomon"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
