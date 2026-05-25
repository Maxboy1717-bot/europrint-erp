/**
 * OrgChartSearchBar.tsx — Phase 6 T6.1
 *
 * Controlled search input rendered above the tree. Reports total match count
 * so users see whether the filter is empty before scrolling.
 */

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tLabel } from "@/lib/i18n/tLabel";
import { useTranslation } from '@/lib/i18n';

interface Props {
  value: string;
  onChange: (next: string) => void;
  matchCount: number;
}

export function OrgChartSearchBar({ value, onChange, matchCount }: Props) {
  const { t } = useTranslation("common");
  const hasQuery = value.trim().length > 0;
  return (
    <div className="flex items-center gap-2 mb-4" data-testid="orgchart-search-wrapper">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={tLabel("orgchart.search.placeholder", "Bo'lim yoki ism bo'yicha qidirish...")}
          className="pl-9"
          data-testid="orgchart-search-input"
          aria-label={tLabel("orgchart.search.aria_label", "Tashkiliy tuzilma bo'yicha qidirish")}
        />
      </div>
      {hasQuery && (
        <>
          <span
            className="text-xs text-muted-foreground"
            data-testid="orgchart-search-count"
            aria-live="polite"
          >
            {matchCount > 0
              ? `${matchCount} ta natija topildi`
              : 'Natija topilmadi'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            data-testid="orgchart-search-clear"
            aria-label={t("qidiruvniTozalash")}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
