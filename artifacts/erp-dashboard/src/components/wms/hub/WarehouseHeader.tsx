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
  const gradient = warehouseColors[warehouse.code] || "from-slate-500 to-slate-600";

  return (
    <div className="flex items-center gap-5 mb-8 flex-wrap">
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-2xl border-outline-variant hover:bg-surface-container shadow-sm"
        onClick={onBack}
        data-testid="button-back"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center `}>
        <IconComponent className="h-7 w-7 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-4xl font-light tracking-tight text-on-surface truncate" data-testid="text-selected-warehouse">
          {warehouse.name.split(' ')[0]} <span className="font-bold text-primary">{warehouse.name.split(' ').slice(1).join(' ') || warehouse.code}</span>
        </h1>
        <div className="flex items-center gap-3 mt-1 font-bold text-sm text-on-surface-variant">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-outline-variant bg-surface-container-lowest">
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
