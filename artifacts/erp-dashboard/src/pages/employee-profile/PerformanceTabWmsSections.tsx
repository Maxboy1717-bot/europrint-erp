/**
 * @module PerformanceTabWmsSections
 * @description WMS (warehouse material) section components for PerformanceTab.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, RotateCw, RotateCcw, Trash2 } from "lucide-react";
import type { WmsSummary } from "./PerformanceTabTypes";

import { useTranslation } from '@/lib/i18n';
interface WmsSectionProps {
  wmsSummary?: WmsSummary | null;
  loadingWms?: boolean;
}

export function WmsSection({wmsSummary, loadingWms }: WmsSectionProps) {
  const { t } = useTranslation('common');
  const hasWmsData = !!(wmsSummary?.summary && wmsSummary.summary.totalMovements > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Package className="h-4 w-4" />
        Material sarfi va intizom (WMS)
        {wmsSummary && !loadingWms && (
          <span className="text-xs font-normal normal-case">(so'nggi {wmsSummary.periodDays} kun)</span>
        )}
      </h3>

      {loadingWms ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={`k-${i}`} className="h-20 rounded-lg" />)}
        </div>
      ) : !hasWmsData ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Bu xodim uchun material harakatlari topilmadi</p>
            <p className="text-xs mt-1 opacity-60 text-center max-w-sm">
              Xodim so'nggi 90 kun ichida WMS tizimida material olmagan yoki qaytarmagan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <WmsKpiCards wmsSummary={wmsSummary!} />
          {(wmsSummary!.materials?.length ?? 0) > 0 && (
            <WmsMaterialsTable wmsSummary={wmsSummary!} />
          )}
        </div>
      )}
    </div>
  );
}

function WmsKpiCards({ wmsSummary }: { wmsSummary: WmsSummary }) {
  const { summary } = wmsSummary;
  const returnRate = summary?.overallReturnRate ?? 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-blue-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-[var(--ep-blue)]" />
            <p className="text-xs text-muted-foreground">Jami olingan</p>
          </div>
          <p className="text-xl font-bold text-[var(--ep-blue)]">{summary.totalIssued.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{summary.totalMovements} ta harakat</p>
        </CardContent>
      </Card>
      <Card className="border-green-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <RotateCw className="h-4 w-4 text-[var(--ep-green)]" />
            <p className="text-xs text-muted-foreground">Qaytarilgan</p>
          </div>
          <p className="text-xl font-bold text-[var(--ep-green)]">{summary.totalReturned.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card className="border-orange-500/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="h-4 w-4 text-[var(--ep-primary)]" />
            <p className="text-xs text-muted-foreground">Isrof</p>
          </div>
          <p className="text-xl font-bold text-[var(--ep-primary)]">{summary.totalWasted.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card className={returnRate >= 20 ? "border-green-500/20" : returnRate >= 10 ? "border-yellow-500/20" : "border-red-500/20"}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Qaytarish foizi</p>
          </div>
          <p className={`text-xl font-bold ${returnRate >= 20 ? "text-[var(--ep-green)]" : returnRate >= 10 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>
            {returnRate}%
          </p>
          <p className="text-xs text-muted-foreground">intizom ko'rsatkichi</p>
        </CardContent>
      </Card>
    </div>
  );
}

function WmsMaterialsTable({ wmsSummary }: { wmsSummary: WmsSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Materiallar bo'yicha tafsilot
        </CardTitle>
        <CardDescription>Har bir material uchun olingan, qaytarilgan va qaytarish foizi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{"Material"}</TableHead>
              <TableHead className="text-right">Olingan</TableHead>
              <TableHead className="text-right">Qaytarilgan</TableHead>
              <TableHead className="text-right">Isrof</TableHead>
              <TableHead className="text-right">Qaytarish %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(wmsSummary.materials) ? wmsSummary.materials : []).map((mat, idx) => (
              <TableRow key={mat.materialId || idx} data-testid={`row-wms-material-${mat.materialId || idx}`} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-sm">{mat.materialName}</TableCell>
                <TableCell className="text-right text-sm">
                  {mat.issued.toLocaleString()} <span className="text-muted-foreground text-xs">{mat.unit}</span>
                </TableCell>
                <TableCell className="text-right text-sm text-[var(--ep-green)]">
                  {mat.returned.toLocaleString()} <span className="text-muted-foreground text-xs">{mat.unit}</span>
                </TableCell>
                <TableCell className="text-right text-sm text-[var(--ep-primary)]">
                  {mat.wasted > 0 ? `${mat.wasted.toLocaleString()} ` : "—"}
                  {mat.wasted > 0 && <span className="text-muted-foreground text-xs">{mat.unit}</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={mat.returnRate >= 20 ? "border-green-300 text-[var(--ep-green)]" : mat.returnRate >= 10 ? "border-yellow-300 text-[var(--ep-yellow)]" : "border-red-300 text-[var(--ep-red)]"}
                  >
                    {mat.returnRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}
