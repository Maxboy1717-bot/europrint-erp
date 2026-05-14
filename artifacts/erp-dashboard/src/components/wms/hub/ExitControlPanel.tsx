/**
 * @module ExitControlPanel
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { ExitLog } from "./types";
import { alertBadgeVariant, alertLabel } from "./helpers";
import { useTranslation } from '@/lib/i18n';

interface ExitControlProps {
  logs: ExitLog[];
}

export function ExitControlPanel({ logs }: ExitControlProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Chiqish nazorati (AI kamera)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3 flex-wrap">
          <Badge variant="default">RUXSAT</Badge>
          <Badge variant="secondary">OGOHLANTIRISH</Badge>
          <Badge variant="destructive">BLOKLASH</Badge>
          <Badge variant="destructive" className="bg-black text-white dark:bg-card dark:text-foreground">XAVFLI</Badge>
        </div>
        {!logs || logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("chiqishJurnaliBosh")}
          </p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`exit-log-${log.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{log.materialName || log.barcodeId}</div>
                  <div className="text-xs text-muted-foreground">
                    {log.detectedWeight && log.expectedWeight
                      ? `${log.detectedWeight} / ${log.expectedWeight} kg`
                      : new Date(log.createdAt).toLocaleString("uz-UZ")}
                  </div>
                </div>
                <Badge variant={alertBadgeVariant(log.alertLevel) as "default" | "secondary" | "destructive" | "outline"}>
                  {alertLabel(log.alertLevel)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
