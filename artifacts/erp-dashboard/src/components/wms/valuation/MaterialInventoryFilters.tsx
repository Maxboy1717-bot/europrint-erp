import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse } from "./types";

interface MaterialInventoryFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  warehouseFilter: string;
  setWarehouseFilter: (warehouseId: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  countTypeFilter: string;
  setCountTypeFilter: (type: string) => void;
  warehouses: Warehouse[];
  clearFilters: () => void;
}

export function MaterialInventoryFilters({
  searchQuery,
  setSearchQuery,
  warehouseFilter,
  setWarehouseFilter,
  statusFilter,
  setStatusFilter,
  countTypeFilter,
  setCountTypeFilter,
  warehouses,
  clearFilters
}: MaterialInventoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Qidirish</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Hisob raqami..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>
      <div className="w-[160px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Omborxona</Label>
        < Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger data-testid="select-warehouse-filter">
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
              <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[140px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Holat</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="select-status-filter">
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="planned">Rejalashtirilgan</SelectItem>
            <SelectItem value="in_progress">Jarayonda</SelectItem>
            <SelectItem value="completed">Yakunlangan</SelectItem>
            <SelectItem value="approved">Tasdiqlangan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-[130px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Tur</Label>
        <Select value={countTypeFilter} onValueChange={setCountTypeFilter}>
          <SelectTrigger data-testid="select-type-filter">
            <SelectValue placeholder="Barchasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="full">To'liq</SelectItem>
            <SelectItem value="cycle">Davriy</SelectItem>
            <SelectItem value="spot">Spot</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button 
        variant="outline" 
        size="icon"
        onClick={clearFilters}
        data-testid="button-clear-filters"
      >
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  );
}
