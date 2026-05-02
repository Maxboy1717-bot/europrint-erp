import { Button } from "@/components/ui/button";
import { Bell, RefreshCw, BarChart3 } from "lucide-react";
import type { AlertItem } from "@/components/director/types";

interface DirectorHeaderProps {
  criticalAlerts: AlertItem[];
  onRefresh: () => void;
}

export function DirectorHeader({ criticalAlerts, onRefresh }: DirectorHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Direktor <span className="text-primary">Paneli</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Real-vaqt ko'rsatkichlar — barcha 6 modul</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {criticalAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <Bell className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="text-sm font-semibold text-red-700">{criticalAlerts.length} kritik ogohlantirish</span>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onRefresh} data-testid="button-refresh-director">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Yangilash
        </Button>
        <Button size="sm" data-testid="button-export-director">
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Hisobot
        </Button>
      </div>
    </div>
  );
}
