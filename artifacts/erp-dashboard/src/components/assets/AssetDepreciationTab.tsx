/**
 * @module AssetDepreciationTab
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { Activity, TrendingDown } from "lucide-react";
import { depreciationMethodLabels } from "@/components/assets/helpers";
import type { AssetInventoryItem } from "@/components/assets/types";

interface DepreciationTabProps {
  assets: AssetInventoryItem[];
  assetsLoading: boolean;
  handleDepreciateClick: (a: AssetInventoryItem) => void;
}

export function DepreciationTab({ assets, assetsLoading, handleDepreciateClick }: DepreciationTabProps) {
  const { t } = useTranslation('mro');

  return (
    <TabsContent value="depreciation" className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("depreciationCalc")}</CardTitle>
          <CardDescription>{t("depreciationTabDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {assetsLoading ? (
            <div className="space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}</div>
          ) : (Array.isArray(assets) ? assets : []).filter(a => a.status === "active").length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("noActiveAssets")}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/40 transition-colors">
                    <TableHead>{t("colCode")}</TableHead>
                    <TableHead>{t("colName")}</TableHead>
                    <TableHead>{t("colMethod")}</TableHead>
                    <TableHead>{t("colUsefulLifeYears")}</TableHead>
                    <TableHead className="text-right">{t("cardPurchaseValue")}</TableHead>
                    <TableHead className="text-right">{t("colSalvageValue")}</TableHead>
                    <TableHead className="text-right">{t("colAccumDepreciation")}</TableHead>
                    <TableHead className="text-right">{t("colDepreciationPct")}</TableHead>
                    <TableHead className="text-center">{t("btnCalculate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(assets) ? assets : []).filter(a => a.status === "active").map((asset, index) => {
                    const depPercent = asset.purchaseValue > 0
                      ? ((asset.accumulatedDepreciation / asset.purchaseValue) * 100).toFixed(1) : "0";
                    return (
                      <TableRow key={asset.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`row-dep-${asset.id}`}>
                        <TableCell className="font-mono text-sm">{asset.assetCode}</TableCell>
                        <TableCell className="font-medium">{asset.assetName}</TableCell>
                        <TableCell><Badge variant="outline">{t(depreciationMethodLabels[asset.depreciationMethod] || asset.depreciationMethod)}</Badge></TableCell>
                        <TableCell className="text-center">{asset.usefulLife || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(asset.purchaseValue)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(asset.currentValue)}</TableCell>
                        <TableCell className="text-right text-[var(--ep-red)]">{formatCurrency(asset.accumulatedDepreciation)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(depPercent))}%` }} />
                            </div>
                            <span className="text-sm">{depPercent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" onClick={() => handleDepreciateClick(asset)} data-testid={`button-run-depreciation-${asset.id}`}>
                            <TrendingDown className="h-3.5 w-3.5 mr-1" />{t("btnCalculate")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
