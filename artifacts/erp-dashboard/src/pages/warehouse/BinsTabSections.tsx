/**
 * @module BinsTabSections
 * @description Table and toolbar sections for BinsTab.
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { BinData, WarehouseData, ZoneData, Lang, Translations } from "./warehouse-types";

interface BinsToolbarProps {
  lang: Lang;
  t: Translations;
  selectedWarehouseId: string;
  selectedZoneId: string;
  warehouses: WarehouseData[];
  zones: ZoneData[];
  onWarehouseChange: (id: string) => void;
  onZoneChange: (id: string) => void;
  onAddClick: () => void;
}

export function BinsToolbar({
  lang, t, selectedWarehouseId, selectedZoneId,
  warehouses, zones, onWarehouseChange, onZoneChange, onAddClick,
}: BinsToolbarProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Select value={selectedWarehouseId} onValueChange={v => { onWarehouseChange(v); onZoneChange(""); }}>
        <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-warehouse-bins">
          <SelectValue placeholder={t.selectWarehouse} />
        </SelectTrigger>
        <SelectContent>
          {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
            <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedZoneId || "__all__"}
        onValueChange={v => onZoneChange(v === "__all__" ? "" : v)}
        disabled={!selectedWarehouseId}
      >
        <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-zone-bins">
          <SelectValue placeholder={t.selectZone} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t.allZones}</SelectItem>
          {(Array.isArray(zones) ? zones : []).map(zone => (
            <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex-1" />
      <Button
        onClick={onAddClick}
        disabled={!selectedWarehouseId}
        data-testid="btn-add-bin"
      >
        <Plus className="h-4 w-4 mr-2" />{t.add}
      </Button>
    </div>
  );
}

interface BinsTableProps {
  lang: Lang;
  t: Translations;
  bins: BinData[];
  isLoading: boolean;
  onEdit: (bin: BinData) => void;
  onDelete: (id: string) => void;
  onView360: (id: string) => void;
}

export function BinsTable({ lang, t, bins, isLoading, onEdit, onDelete, onView360 }: BinsTableProps) {
  return (
    <Card>
      <ScrollArea className="h-[500px]">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.binCode}</TableHead>
              <TableHead>{t.row}</TableHead>
              <TableHead>{t.shelf}</TableHead>
              <TableHead>{t.level}</TableHead>
              <TableHead>{t.binType}</TableHead>
              <TableHead>{t.maxWeight}</TableHead>
              <TableHead>{t.maxVolume}</TableHead>
              <TableHead>{t.occupancy}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-12 rounded-lg" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : bins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {lang === "uz" ? "Binlar topilmadi" : "Ячейки не найдены"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              (Array.isArray(bins) ? bins : []).map(bin => (
                <TableRow key={bin.id} data-testid={`row-bin-${bin.id}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono font-medium">{bin.binCode}</TableCell>
                  <TableCell>{bin.row || "-"}</TableCell>
                  <TableCell>{bin.shelf || "-"}</TableCell>
                  <TableCell>{bin.level || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t.binTypes[bin.binType as keyof typeof t.binTypes] || bin.binType}
                    </Badge>
                  </TableCell>
                  <TableCell>{bin.maxWeight || "-"}</TableCell>
                  <TableCell>{bin.maxVolume || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: `${bin.currentOccupancy || 0}%` }}
                        />
                      </div>
                      <span className="text-sm">{bin.currentOccupancy || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon" variant="ghost"
                        title="360° Ko'rinish"
                        onClick={() => onView360(bin.id)}
                        data-testid={`btn-360-bin-${bin.id}`}
                      >
                        <Eye className="h-4 w-4 text-[var(--ep-blue)]" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => onEdit(bin)}
                        data-testid={`btn-edit-bin-${bin.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => onDelete(bin.id)}
                        data-testid={`btn-delete-bin-${bin.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--ep-red)]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table></div>
      </ScrollArea>
    </Card>
  );
}

interface BinsEmptyStateProps {
  lang: Lang;
}

export function BinsEmptyState({ lang }: BinsEmptyStateProps) {
  return (
    <Card className="p-8 text-center text-muted-foreground">
      <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{lang === "uz" ? "Iltimos, omborni tanlang" : "Пожалуйста, выберите склад"}</p>
    </Card>
  );
}
