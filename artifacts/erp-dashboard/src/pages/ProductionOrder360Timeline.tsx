/**
 * @module ProductionOrder360Timeline
 * @description React page component. Route-level UI.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  created:     { label: "Yaratildi",    variant: "secondary" },
  released:    { label: "Chiqarildi",   variant: "default" },
  in_progress: { label: "Jarayonda",   variant: "default" },
  completed:   { label: "Bajarildi",   variant: "default" },
  closed:      { label: "Yopildi",     variant: "secondary" },
  qc_hold:     { label: "QC To'xtatdi", variant: "destructive" },
};

export interface StatusHistoryEntry {
  id: string | number;
  oldStatus?: string;
  newStatus: string;
  changerName?: string;
  changedAt?: string;
  reason?: string;
}

export interface ProductionOrder360TimelineProps {
  statusHistory?: StatusHistoryEntry[];
}

export default function ProductionOrder360Timeline({ statusHistory }: ProductionOrder360TimelineProps) {
  const { t } = useTranslation("common");
  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{t("holatTarixi")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statusHistory.map((h) => (
            <div key={h.id} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {h.oldStatus && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[h.oldStatus]?.label || h.oldStatus}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                    </>
                  )}
                  <EPStatusPill tone="success" className="text-xs">
                    {STATUS_LABELS[h.newStatus]?.label || h.newStatus}
                  </EPStatusPill>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {h.changerName || "—"} · {h.changedAt ? new Date(h.changedAt).toLocaleString("uz-UZ") : ""}
                </p>
                {h.reason && <p className="text-xs text-muted-foreground">{h.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
