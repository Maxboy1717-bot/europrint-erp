/**
 * @module MaterialInventoryFilters
 * @description React UI component.
 */

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse } from "./types";
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">{t("search")}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("hisobRaqami")} 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>
      <div className="w-full sm:w-[160px]">
        <Label className="text-xs text-muted-foreground mb-1 block">{t("omborxona1")}</Label>
        < Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger data-testid="select-warehouse-filter" className="h-9">
            <SelectValue placeholder={t("Barchasi")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Barchasi")}</SelectItem>
            {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
              <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-[140px]">
        <Label className="text-xs text-muted-foreground mb-1 block">{t("status28")}</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="select-status-filter" className="h-9">
            <SelectValue placeholder={t("Barchasi")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Barchasi")}</SelectItem>
            <SelectItem value="planned">{t("rejalashtirilgan")}</SelectItem>
            <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
            <SelectItem value="completed">{t("yakunlangan")}</SelectItem>
            <SelectItem value="approved">{t("approved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-[130px]">
        <Label className="text-xs text-muted-foreground mb-1 block">{t("tur")}</Label>
        <Select value={countTypeFilter} onValueChange={setCountTypeFilter}>
          <SelectTrigger data-testid="select-type-filter" className="h-9">
            <SelectValue placeholder={t("Barchasi")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("Barchasi")}</SelectItem>
            <SelectItem value="full">{t("toliq")}</SelectItem>
            <SelectItem value="cycle">{t("davriy")}</SelectItem>
            <SelectItem value="spot">{t("spot")}</SelectItem>
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
