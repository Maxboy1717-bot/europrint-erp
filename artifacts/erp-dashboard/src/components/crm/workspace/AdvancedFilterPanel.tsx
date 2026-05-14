/**
 * @module AdvancedFilterPanel
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, RefreshCw } from "lucide-react";
import { DEFAULT_ADVANCED_FILTERS, EntityType, Stage } from "@/pages/crm/crm-types";
import { AdvancedFilterPanelProps } from "./types";

export function AdvancedFilterPanel({
  filters,
  setFilters,
  onClose,
  activeEntity,
  stages,
}: AdvancedFilterPanelProps) {
  return (
    <div className="bg-muted/40 border-b border-border px-4 py-4 animate-in slide-in-from-top duration-200">
      <div className="max-w-screen-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <X className="h-4 w-4 cursor-pointer" onClick={onClose} />
            Kengaytirilgan filtrlar
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters(DEFAULT_ADVANCED_FILTERS)}
            className="text-xs h-7 gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Filtrlarni tozalash
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Yaratilgan sana (dan)
            </Label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
              className="h-9 bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Yaratilgan sana (gacha)
            </Label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
              className="h-9 bg-card"
            />
          </div>

          {(activeEntity === "leads" ||
            activeEntity === "deals" ||
            activeEntity === "proposals" ||
            activeEntity === "invoices") && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                Bosqich
              </Label>
              <Select
                value={filters.stageId || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, stageId: v === "all" ? null : v })
                }
              >
                <SelectTrigger className="h-9 bg-card">
                  <SelectValue placeholder="Hammasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha bosqichlar</SelectItem>
                  {(Array.isArray(stages) ? stages : []).map((s) => (
                    <SelectItem key={s.stageId} value={s.stageId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Summa (dan)
            </Label>
            <Input
              type="number"
              value={filters.amountFrom === null ? "" : filters.amountFrom}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  amountFrom: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="h-9 bg-card"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              Summa (gacha)
            </Label>
            <Input
              type="number"
              value={filters.amountTo === null ? "" : filters.amountTo}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  amountTo: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="h-9 bg-card"
              placeholder="∞"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
