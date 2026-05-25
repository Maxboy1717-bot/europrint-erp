/**
 * @module WarehouseHeader
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Warehouse } from "lucide-react";
import { WarehouseItem } from "./types";
import { warehouseIcons, warehouseColors } from "./helpers";

interface WarehouseHeaderProps {
  warehouse: WarehouseItem;
  onBack: () => void;
}

export function WarehouseHeader({ warehouse, onBack }: WarehouseHeaderProps) {
  const IconComponent = warehouseIcons[warehouse.code] || Warehouse;
  const gradient = warehouseColors[warehouse.code] || "";

  return (
    <div className="flex items-center gap-5 mb-8 flex-wrap">
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-xl border-border hover:bg-muted/60 shadow-sm"
        onClick={onBack}
        data-testid="button-back"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center `}>
        <IconComponent className="h-7 w-7 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="ep-h1 text-foreground truncate" data-testid="text-selected-warehouse">
          {warehouse.name.split(' ')[0]} <span className="font-bold text-primary">{warehouse.name.split(' ').slice(1).join(' ') || warehouse.code}</span>
        </h1>
        <div className="flex items-center gap-3 mt-1 font-bold text-sm text-muted-foreground">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-border bg-card">
            {warehouse.code}
          </Badge>
          {warehouse.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {warehouse.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
