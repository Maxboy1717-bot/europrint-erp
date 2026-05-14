/**
 * @module AssetMaintenanceTab
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { CheckCircle, Wrench } from "lucide-react";
import { maintenanceTypeLabels, getMaintenanceStatusBadge } from "@/components/assets/helpers";
import type { MaintenanceRecord } from "@/components/assets/types";

interface MaintenanceTabProps {
  maintenanceRecords: MaintenanceRecord[];
  filteredMaintenance: MaintenanceRecord[];
  maintenanceLoading: boolean;
  maintenanceStatusFilter: string;
  setMaintenanceStatusFilter: (v: string) => void;
  handleCompleteMaintenanceClick: (r: MaintenanceRecord) => void;
}

export function MaintenanceTab({
  maintenanceRecords, filteredMaintenance, maintenanceLoading,
  maintenanceStatusFilter, setMaintenanceStatusFilter, handleCompleteMaintenanceClick,
}: MaintenanceTabProps) {
  const { t } = useTranslation('mro');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="maintenance" className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("maintStatusScheduled")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-[var(--ep-blue)]">{(Array.isArray(maintenanceRecords) ? maintenanceRecords : []).filter(m => m.status === "scheduled").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("maintStatusInProgress")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-[var(--ep-yellow)]">{(Array.isArray(maintenanceRecords) ? maintenanceRecords : []).filter(m => m.status === "in_progress").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("cardMaintCost")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency((Array.isArray(maintenanceRecords) ? maintenanceRecords : []).filter(m => m.status === "completed").reduce((s, m) => s + Number(m.cost || 0), 0))}</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1 flex-wrap">
          <div>
            <CardTitle>{t("maintHistory")}</CardTitle>
            <CardDescription>{t("maintHistoryDesc")}</CardDescription>
          </div>
          <select className="border rounded p-1 text-sm bg-background" value={maintenanceStatusFilter} onChange={e => setMaintenanceStatusFilter(e.target.value)} data-testid="select-maintenance-status">
            <option value="all">{tCommon("all")}</option>
            <option value="scheduled">{t("maintStatusScheduled")}</option>
            <option value="in_progress">{t("maintStatusInProgress")}</option>
            <option value="completed">{t("maintStatusCompleted")}</option>
            <option value="cancelled">{t("maintStatusCancelled")}</option>
          </select>
        </CardHeader>
        <CardContent>
          {maintenanceLoading ? (
            <div className="space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />)}</div>
          ) : filteredMaintenance.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("noMaintRecords")}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/40 transition-colors">
                    <TableHead>{t("colAssetId")}</TableHead>
                    <TableHead>{tCommon("type")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead>{t("colTechnician")}</TableHead>
                    <TableHead>{t("colScheduledDate")}</TableHead>
                    <TableHead>{t("colCompletedDate")}</TableHead>
                    <TableHead className="text-right">{t("colCost")}</TableHead>
                    <TableHead>{t("colDescription")}</TableHead>
                    <TableHead className="text-center">{t("colActions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(filteredMaintenance) ? filteredMaintenance : []).map((record, index) => (
                    <TableRow key={record.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`row-maintenance-${record.id}`}>
                      <TableCell className="font-medium">#{record.assetId}</TableCell>
                      <TableCell><Badge variant="outline">{t(maintenanceTypeLabels[record.maintenanceType] || record.maintenanceType)}</Badge></TableCell>
                      <TableCell>{getMaintenanceStatusBadge(record.status, t)}</TableCell>
                      <TableCell className="text-sm">{record.technicianName || "-"}</TableCell>
                      <TableCell className="text-sm">{record.scheduledDate ? formatDate(record.scheduledDate) : "-"}</TableCell>
                      <TableCell className="text-sm">{record.completedDate ? formatDate(record.completedDate) : "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(record.cost || 0))}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{record.description || "-"}</TableCell>
                      <TableCell className="text-center">
                        {(record.status === "scheduled" || record.status === "in_progress") && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCompleteMaintenanceClick(record)} title={t("finish")} data-testid={`button-complete-maintenance-${record.id}`}>
                            <CheckCircle className="h-3.5 w-3.5 text-[var(--ep-green)]" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
