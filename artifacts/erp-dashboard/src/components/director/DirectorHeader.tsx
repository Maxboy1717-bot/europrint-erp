/**
 * @module DirectorHeader
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Bell, RefreshCw, BarChart3 } from "lucide-react";
import type { AlertItem } from "@/components/director/types";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';

interface DirectorHeaderProps {
  criticalAlerts: AlertItem[];
  onRefresh: () => void;
}

export function DirectorHeader({ criticalAlerts, onRefresh }: DirectorHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="ep-h1 text-foreground">
          {tLabel("director.titlePrefix", "Direktor")} <span className="text-primary">{tLabel("director.titleSuffix", "paneli")}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("realVaqtKorsatkichlarBarcha6")}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <Bell className="w-4 h-4 text-[var(--ep-red)] animate-pulse" />
            <span className="text-sm font-semibold text-[var(--ep-red)]">{criticalAlerts.length} kritik ogohlantirish</span>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-director">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("refresh")}
        </Button>
        <Button size="sm" data-testid="button-export-director">
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> {t("report")}
        </Button>
      </div>
    </div>
  );
}
