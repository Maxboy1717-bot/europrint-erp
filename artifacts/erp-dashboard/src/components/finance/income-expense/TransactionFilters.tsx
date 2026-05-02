import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { FinanceCategory } from "./types";

interface TransactionFiltersProps {
  filters: {
    type: string;
    categoryId: string;
    dateFrom: string;
    dateTo: string;
    status: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      type: string;
      categoryId: string;
      dateFrom: string;
      dateTo: string;
      status: string;
    }>
  >;
  categories: FinanceCategory[];
}

export function TransactionFilters({
  filters,
  setFilters,
  categories,
}: TransactionFiltersProps) {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation("common");

  return (
    <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
      <Select
        value={filters.type}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
      >
        <SelectTrigger className="w-[150px]" data-testid="filter-type">
          <SelectValue placeholder="Turi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tCommon("all")}</SelectItem>
          <SelectItem value="income">{t("inflow")}</SelectItem>
          <SelectItem value="expense">{t("outflow")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId}
        onValueChange={(value) =>
          setFilters((prev) => ({ ...prev, categoryId: value }))
        }
      >
        <SelectTrigger className="w-[180px]" data-testid="filter-category">
          <SelectValue placeholder={t("category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tCommon("all")}</SelectItem>
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
      >
        <SelectTrigger className="w-[150px]" data-testid="filter-status">
          <SelectValue placeholder={tCommon("status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{tCommon("all")}</SelectItem>
          <SelectItem value="draft">{t("draft")}</SelectItem>
          <SelectItem value="posted">{t("approved")}</SelectItem>
          <SelectItem value="cancelled">{tCommon("cancelled")}</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
          }
          className="w-[150px]"
          data-testid="filter-date-from"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
          }
          className="w-[150px]"
          data-testid="filter-date-to"
        />
      </div>

      <Button
        variant="outline"
        onClick={() =>
          setFilters({
            type: "",
            categoryId: "",
            dateFrom: "",
            dateTo: "",
            status: "",
          })
        }
        data-testid="button-clear-filters"
      >
        {tCommon("refresh")}
      </Button>
    </div>
  );
}
