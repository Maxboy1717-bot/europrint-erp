/**
 * @module WasteTracking
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, Lightbulb } from "lucide-react";
import {
  useWasteTranslations,
  WasteRecord,
  WasteAnalysis,
  WasteCause,
  WasteByTypeItem,
  WasteByMaterialItem,
} from "./WasteTrackingTypes";
import { KPICards, WasteByTypeChart, WasteTrendChart, WasteByMachineChart } from "./WasteTrackingCharts";
import { AddWasteRecordDialog, TargetsTab } from "./WasteTrackingDialogs";
import { EPStatusPill } from "@/components/ep";

// ── RecordsTable ──────────────────────────────────────────────────────────────

function RecordsTable() {
  const tr = useWasteTranslations();
  const { data: records, isLoading } = useQuery<WasteRecord[]>({
    queryKey: ["/api/waste/records"],
  });

  if (isLoading) {
    return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full rounded-lg" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm">{tr("records")}</CardTitle>
        <AddWasteRecordDialog />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr("date")}</TableHead>
                <TableHead>{tr("wasteType")}</TableHead>
                <TableHead>{tr("materialType")}</TableHead>
                <TableHead className="text-right">{tr("quantity")}</TableHead>
                <TableHead className="text-right">{tr("totalCostLabel")}</TableHead>
                <TableHead>{tr("machineId")}</TableHead>
                <TableHead>{tr("cause")}</TableHead>
                <TableHead>{tr("shift")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!records || records.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">{tr("noData")}</TableCell>
                </TableRow>
              ) : (
                (Array.isArray(records) ? records : []).map((record: WasteRecord) => (
                  <TableRow key={record.id} data-testid={`row-waste-${record.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="text-sm">{record.date}</TableCell>
                    <TableCell>
                      <EPStatusPill tone="neutral" className="text-xs">{tr(record.wasteType)}</EPStatusPill>
                    </TableCell>
                    <TableCell className="text-sm">{record.materialType || "-"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{Number(record.quantity).toFixed(1)} {record.unit}</TableCell>
                    <TableCell className="text-right text-sm">{Number(record.totalCost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{record.machineId || "-"}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{record.cause || "-"}</TableCell>
                    <TableCell className="text-sm">{record.shiftNumber || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── AnalysisTab ───────────────────────────────────────────────────────────────

function AnalysisTab() {
  const tr = useWasteTranslations();
  const { data: analysis, isLoading } = useQuery<WasteAnalysis>({
    queryKey: ["/api/waste/analysis"],
  });

  if (isLoading) {
    return <div className="space-y-4">{([1, 2]).map(i => <Card key={`k-${i}`}><CardContent className="p-4"><Skeleton className="h-32 w-full rounded-lg" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />{tr("topCauses")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!analysis?.topCauses || analysis.topCauses.length === 0) ? (
            <p className="text-sm text-muted-foreground">{tr("noData")}</p>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(analysis.topCauses) ? analysis.topCauses : []).map((cause: WasteCause, i: number) => (
                <div key={`k-${i}`} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
                  <span className="text-sm">{cause.cause}</span>
                  <div className="flex items-center gap-2">
                    <EPStatusPill tone="neutral" className="text-xs">{cause.recordCount}x</EPStatusPill>
                    <span className="text-sm font-medium">{Number(cause.totalQuantity).toFixed(1)} {tr("kg")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[var(--ep-green)]" />{tr("recommendations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!analysis?.recommendations || analysis.recommendations.length === 0) ? (
            <p className="text-sm text-muted-foreground">{tr("noData")}</p>
          ) : (
            <ul className="space-y-2">
              {(Array.isArray(analysis.recommendations) ? analysis.recommendations : []).map((rec: string, i: number) => (
                <li key={`k-${i}`} className="text-sm flex gap-2">
                  <span className="text-[var(--ep-green)] shrink-0">&#8226;</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("byType")}</CardTitle></CardHeader>
          <CardContent>
            {(!analysis?.byType || analysis.byType.length === 0) ? (
              <p className="text-sm text-muted-foreground">{tr("noData")}</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(analysis.byType) ? analysis.byType : []).map((item: WasteByTypeItem, i: number) => (
                  <div key={`k-${i}`} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{tr(item.wasteType)}</span>
                    <span className="text-sm font-medium">{Number(item.totalQuantity).toFixed(1)} {tr("kg")} / {Number(item.totalCost).toLocaleString()} UZS</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("materialType")}</CardTitle></CardHeader>
          <CardContent>
            {(!analysis?.byMaterial || analysis.byMaterial.length === 0) ? (
              <p className="text-sm text-muted-foreground">{tr("noData")}</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(analysis.byMaterial) ? analysis.byMaterial : []).map((item: WasteByMaterialItem, i: number) => (
                  <div key={`k-${i}`} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{item.materialType}</span>
                    <span className="text-sm font-medium">{Number(item.totalQuantity).toFixed(1)} {tr("kg")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WasteTracking() {
  const tr = useWasteTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <BarChart3 className="h-6 w-6 text-[var(--ep-red)]" />
        <h1 className="text-xl font-bold" data-testid="text-page-title">{tr("title")}</h1>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">{tr("dashboard")}</TabsTrigger>
          <TabsTrigger value="records" data-testid="tab-records">{tr("records")}</TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">{tr("analysis")}</TabsTrigger>
          <TabsTrigger value="targets" data-testid="tab-targets">{tr("targets")}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <KPICards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WasteByTypeChart />
            <WasteTrendChart />
          </div>
          <WasteByMachineChart />
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <RecordsTable />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <AnalysisTab />
        </TabsContent>

        <TabsContent value="targets" className="mt-4">
          <TargetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
