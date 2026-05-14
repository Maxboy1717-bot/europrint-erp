/**
 * @module BarcodeSystemSections
 * @description The Batches tab section for BarcodeSystem.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Barcode, QrCode, Plus, Pencil, Eye, Printer, Search,
} from "lucide-react";
import { STATUS_COLORS, QC_STATUS_COLORS } from "./barcode/barcode-types";
import type { BatchesTabProps } from "./BarcodeSystemTypes";

// ── BatchesTabContent ─────────────────────────────────────────────────────────
export function BatchesTabContent({
  lang, t,
  batches, batchesLoading,
  materials, warehousesList,
  searchQuery, onSearchChange,
  materialFilter, onMaterialFilterChange,
  warehouseFilter, onWarehouseFilterChange,
  statusFilter, onStatusFilterChange,
  selectedBatchesForBulk, onToggleBulkSelection, onSelectAll,
  onCreateBatch, onEditBatch, onViewBatch, onPrintBatch, onLabelPrint,
  onBulkGenerate, bulkGeneratePending,
}: BatchesTabProps) {
  const tAny = t as Record<string, string & Record<string, string>>;

  return (
    <TabsContent value="batches" className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-[14px] font-semibold">{tAny.batches}</CardTitle>
            <div className="flex items-center gap-2">
              {selectedBatchesForBulk.length > 0 && (
                <Button onClick={onBulkGenerate} size="sm" variant="outline" disabled={bulkGeneratePending} data-testid="button-bulk-generate">
                  <QrCode className="h-4 w-4 mr-2" />{tAny.bulkGenerate} ({selectedBatchesForBulk.length})
                </Button>
              )}
              <Button onClick={onCreateBatch} size="sm" data-testid="button-create-batch">
                <Plus className="h-4 w-4 mr-2" />{tAny.add}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tAny.search}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
                data-testid="input-search-batches"
              />
            </div>
            <Select value={materialFilter || "__all__"} onValueChange={(v) => onMaterialFilterChange(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-material-filter">
                <SelectValue placeholder={tAny.allMaterials} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{tAny.allMaterials}</SelectItem>
                {(Array.isArray(materials) ? materials : []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.xomAshyo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={warehouseFilter || "__all__"} onValueChange={(v) => onWarehouseFilterChange(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9" data-testid="select-warehouse-filter">
                <SelectValue placeholder={tAny.allWarehouses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{tAny.allWarehouses}</SelectItem>
                {(Array.isArray(warehousesList) ? warehousesList : []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter || "__all__"} onValueChange={(v) => onStatusFilterChange(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[150px] h-9" data-testid="select-status-filter">
                <SelectValue placeholder={tAny.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{tAny.allStatuses}</SelectItem>
                <SelectItem value="active">{(tAny.statuses as unknown as Record<string,string>)?.active}</SelectItem>
                <SelectItem value="depleted">{(tAny.statuses as unknown as Record<string,string>)?.depleted}</SelectItem>
                <SelectItem value="blocked">{(tAny.statuses as unknown as Record<string,string>)?.blocked}</SelectItem>
                <SelectItem value="expired">{(tAny.statuses as unknown as Record<string,string>)?.expired}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className="space-y-2">{([1, 2, 3]).map((i) => (<Skeleton key={`k-${i}`} className="h-12 w-full rounded-lg" />))}</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedBatchesForBulk.length === batches.length && batches.length > 0}
                        onChange={(e) => onSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-border/40"
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>{tAny.batchNumber}</TableHead>
                    <TableHead>{tAny.material}</TableHead>
                    <TableHead>{tAny.warehouse}</TableHead>
                    <TableHead className="text-right">{tAny.quantity}</TableHead>
                    <TableHead className="text-right">{tAny.remaining}</TableHead>
                    <TableHead>{tAny.productionDate}</TableHead>
                    <TableHead>{tAny.expiryDate}</TableHead>
                    <TableHead>{tAny.qcStatus}</TableHead>
                    <TableHead>{tAny.status}</TableHead>
                    <TableHead className="text-right">{tAny.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(batches) ? batches : []).map((batch) => (
                    <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedBatchesForBulk.includes(batch.id)}
                          onChange={() => onToggleBulkSelection(batch.id)}
                          className="h-4 w-4 rounded border-border/40"
                          data-testid={`checkbox-batch-${batch.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Barcode className="h-4 w-4 text-muted-foreground" />
                          {batch.batchNumber}
                        </div>
                      </TableCell>
                      <TableCell>{batch.materialName || "-"}</TableCell>
                      <TableCell>{batch.warehouseName || "-"}</TableCell>
                      <TableCell className="text-right">{batch.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{batch.remainingQuantity.toLocaleString()}</TableCell>
                      <TableCell>{batch.productionDate || "-"}</TableCell>
                      <TableCell>{batch.expiryDate || "-"}</TableCell>
                      <TableCell>
                        <Badge className={QC_STATUS_COLORS[batch.qcStatus || "pending"]}>
                          {(tAny.qcStatuses as unknown as Record<string,string>)?.[batch.qcStatus] || batch.qcStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[batch.status || "active"]}>
                          {(tAny.statuses as unknown as Record<string,string>)?.[batch.status] || batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onViewBatch(batch)} data-testid={`button-view-batch-${batch.id}`}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onEditBatch(batch)} data-testid={`button-edit-batch-${batch.id}`}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onPrintBatch(batch.id, "batch")} data-testid={`button-print-batch-${batch.id}`}><Printer className="h-4 w-4" /></Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={tAny.labelPrint}
                            onClick={() => onLabelPrint(batch)}
                            data-testid={`button-label-print-${batch.id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <rect x="2" y="6" width="20" height="12" rx="2"/>
                              <path d="M17 6V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2"/>
                              <path d="M7 12h.01M12 12h.01M17 12h.01"/>
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {batches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-[13px] text-muted-foreground">
                        {lang === "uz" ? "Partiyalar topilmadi" : "Партии не найдены"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table></div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
